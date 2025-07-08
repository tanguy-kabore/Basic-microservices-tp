const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const dotenv = require('dotenv');

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
const ARTICLE_SERVICE_URL = process.env.ARTICLE_SERVICE_URL || 'http://article-service:3001';
const COMMENT_SERVICE_URL = process.env.COMMENT_SERVICE_URL || 'http://comment-service:3002';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Configuration des Circuit Breakers
const articleServiceOptions = {
  timeout: 3000, // Si une requête prend plus de 3 secondes, elle échoue
  errorThresholdPercentage: 50, // Si 50% des requêtes échouent, le circuit s'ouvre
  resetTimeout: 10000, // Après 10 secondes, le circuit passe de ouvert à semi-ouvert
  rollingCountTimeout: 60000, // La fenêtre de temps pour calculer le taux d'erreur
  rollingCountBuckets: 10 // Nombre d'intervalles dans la fenêtre de temps
};

const commentServiceOptions = {
  ...articleServiceOptions
};

// Création des fonctions d'appel aux services
const callArticleService = async (method, path, data = null) => {
  const url = `${ARTICLE_SERVICE_URL}${path}`;
  const config = { method, url };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

const callCommentService = async (method, path, data = null) => {
  const url = `${COMMENT_SERVICE_URL}${path}`;
  const config = { method, url };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Création des Circuit Breakers
const articleServiceBreaker = new CircuitBreaker(callArticleService, articleServiceOptions);
const commentServiceBreaker = new CircuitBreaker(callCommentService, commentServiceOptions);

// Gestion des événements des Circuit Breakers
const breakers = {
  articleService: articleServiceBreaker,
  commentService: commentServiceBreaker
};

// Enregistrement des événements pour chaque Circuit Breaker
Object.entries(breakers).forEach(([serviceName, breaker]) => {
  breaker.on('open', () => console.log(`[API-GATEWAY] Circuit ouvert pour ${serviceName}`));
  breaker.on('halfOpen', () => console.log(`[API-GATEWAY] Circuit semi-ouvert pour ${serviceName}`));
  breaker.on('close', () => console.log(`[API-GATEWAY] Circuit fermé pour ${serviceName}`));
  breaker.on('fallback', () => console.log(`[API-GATEWAY] Réponse de secours pour ${serviceName}`));
});

// Fallbacks pour les Circuit Breakers
articleServiceBreaker.fallback(() => {
  return {
    data: { 
      success: false, 
      error: "Service d'articles temporairement indisponible", 
      fallback: true 
    }
  };
});

commentServiceBreaker.fallback(() => {
  return {
    data: { 
      success: false, 
      error: "Service de commentaires temporairement indisponible", 
      fallback: true 
    }
  };
});

// Routes API

// Articles
app.get('/api/articles', async (req, res) => {
  try {
    console.log('[API-GATEWAY] Récupération de tous les articles');
    const response = await articleServiceBreaker.fire('get', '/api/articles');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('[API-GATEWAY] Erreur lors de la récupération des articles:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Erreur lors de la récupération des articles"
    });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    console.log(`[API-GATEWAY] Récupération de l'article ${articleId}`);
    
    const articleResponse = await articleServiceBreaker.fire('get', `/api/articles/${articleId}`);
    
    // Si nous avons l'article, nous pouvons récupérer ses commentaires
    const commentsResponse = await commentServiceBreaker.fire('get', `/api/articles/${articleId}/comments`);
    
    // Fusion des réponses
    const result = {
      ...articleResponse.data,
      comments: commentsResponse.data.fallback ? [] : commentsResponse.data
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error(`[API-GATEWAY] Erreur lors de la récupération de l'article ${req.params.id}:`, error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: `Erreur lors de la récupération de l'article ${req.params.id}`
    });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    console.log('[API-GATEWAY] Création d\'un nouvel article');
    const response = await articleServiceBreaker.fire('post', '/api/articles', req.body);
    res.status(201).json(response.data);
  } catch (error) {
    console.error('[API-GATEWAY] Erreur lors de la création de l\'article:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Erreur lors de la création de l'article"
    });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    console.log(`[API-GATEWAY] Mise à jour de l'article ${articleId}`);
    
    const response = await articleServiceBreaker.fire('put', `/api/articles/${articleId}`, req.body);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(`[API-GATEWAY] Erreur lors de la mise à jour de l'article ${req.params.id}:`, error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: `Erreur lors de la mise à jour de l'article ${req.params.id}`
    });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    console.log(`[API-GATEWAY] Suppression de l'article ${articleId}`);
    
    const response = await articleServiceBreaker.fire('delete', `/api/articles/${articleId}`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(`[API-GATEWAY] Erreur lors de la suppression de l'article ${req.params.id}:`, error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: `Erreur lors de la suppression de l'article ${req.params.id}`
    });
  }
});

// Commentaires
app.get('/api/articles/:articleId/comments', async (req, res) => {
  try {
    const articleId = req.params.articleId;
    console.log(`[API-GATEWAY] Récupération des commentaires pour l'article ${articleId}`);
    
    const response = await commentServiceBreaker.fire('get', `/api/articles/${articleId}/comments`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(`[API-GATEWAY] Erreur lors de la récupération des commentaires pour l'article ${req.params.articleId}:`, error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: `Erreur lors de la récupération des commentaires pour l'article ${req.params.articleId}`
    });
  }
});

app.post('/api/articles/:articleId/comments', async (req, res) => {
  try {
    const articleId = req.params.articleId;
    console.log(`[API-GATEWAY] Ajout d'un commentaire à l'article ${articleId}`);
    
    const response = await commentServiceBreaker.fire('post', `/api/articles/${articleId}/comments`, req.body);
    res.status(201).json(response.data);
  } catch (error) {
    console.error(`[API-GATEWAY] Erreur lors de l'ajout d'un commentaire à l'article ${req.params.articleId}:`, error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      success: false, 
      error: `Erreur lors de l'ajout d'un commentaire à l'article ${req.params.articleId}`
    });
  }
});

// Routes de gestion et de test des Circuit Breakers
app.get('/api/status', (req, res) => {
  const status = {
    articleService: {
      state: articleServiceBreaker.status.state,
      stats: {
        successful: articleServiceBreaker.stats.successes,
        failed: articleServiceBreaker.stats.failures,
        rejected: articleServiceBreaker.stats.rejects,
        timeout: articleServiceBreaker.stats.timeouts
      }
    },
    commentService: {
      state: commentServiceBreaker.status.state,
      stats: {
        successful: commentServiceBreaker.stats.successes,
        failed: commentServiceBreaker.stats.failures,
        rejected: commentServiceBreaker.stats.rejects,
        timeout: commentServiceBreaker.stats.timeouts
      }
    }
  };
  
  res.status(200).json(status);
});

app.post('/api/circuit-breaker/test/:service', (req, res) => {
  const service = req.params.service;
  
  if (!breakers[service]) {
    return res.status(404).json({ error: `Service ${service} non trouvé` });
  }
  
  // Simuler une erreur pour forcer l'ouverture du circuit
  breakers[service].fire('get', '/non-existent-endpoint')
    .then(() => {
      res.status(200).json({ message: `Test effectué sur ${service}` });
    })
    .catch(() => {
      res.status(200).json({ message: `Test effectué sur ${service}, erreur simulée` });
    });
});

app.post('/api/circuit-breaker/reset/:service', (req, res) => {
  const service = req.params.service;
  
  if (!breakers[service]) {
    return res.status(404).json({ error: `Service ${service} non trouvé` });
  }
  
  // Réinitialiser le circuit
  breakers[service].close();
  
  res.status(200).json({ 
    message: `Circuit breaker pour ${service} réinitialisé`, 
    state: breakers[service].status.state
  });
});

// Route de santé pour les contrôles de disponibilité
app.get('/health', async (req, res) => {
  try {
    const services = {};
    
    try {
      const articleHealth = await axios.get(`${ARTICLE_SERVICE_URL}/health`, { timeout: 1000 });
      services.articleService = articleHealth.data;
    } catch (error) {
      services.articleService = { status: 'ERROR', error: error.message };
    }
    
    try {
      const commentHealth = await axios.get(`${COMMENT_SERVICE_URL}/health`, { timeout: 1000 });
      services.commentService = commentHealth.data;
    } catch (error) {
      services.commentService = { status: 'ERROR', error: error.message };
    }
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      circuitBreakers: {
        articleService: articleServiceBreaker.status.state,
        commentService: commentServiceBreaker.status.state
      },
      services
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      error: error.message
    });
  }
});

// Route racine - page d'accueil simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Gateway - Blog Microservices</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #e74c3c;
          padding-bottom: 10px;
        }
        h2 {
          color: #e74c3c;
        }
        .container {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 20px;
          margin-bottom: 20px;
        }
        code {
          background-color: #f1f1f1;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: monospace;
        }
        .endpoint {
          margin-bottom: 15px;
          border-left: 4px solid #e74c3c;
          padding-left: 15px;
        }
        .method {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          color: white;
          font-weight: bold;
        }
        .get { background-color: #27ae60; }
        .post { background-color: #2980b9; }
        .put { background-color: #f39c12; }
        .delete { background-color: #c0392b; }
        
        .circuit-breaker {
          border-left: 4px solid #3498db;
          padding-left: 15px;
          margin-bottom: 15px;
        }
        
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          color: white;
        }
        
        .status-open { background-color: #e74c3c; }
        .status-closed { background-color: #2ecc71; }
        .status-half-open { background-color: #f39c12; }
        
        #service-status {
          margin-top: 20px;
        }
        
        button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
          margin-bottom: 5px;
        }
        
        button:hover {
          background-color: #2980b9;
        }
      </style>
    </head>
    <body>
      <h1>API Gateway - Blog Microservices</h1>
      <p>Cette API Gateway orchestre les microservices de notre application blog et implémente un <strong>Circuit Breaker</strong> pour la résilience.</p>

      <div class="container">
        <h2>Services Orchestrés</h2>
        <ul>
          <li><strong>Service d'Articles</strong>: Node.js + MongoDB - <code>${ARTICLE_SERVICE_URL}</code></li>
          <li><strong>Service de Commentaires</strong>: Python + PostgreSQL - <code>${COMMENT_SERVICE_URL}</code></li>
        </ul>
      </div>

      <div class="container">
        <h2>API Endpoints</h2>
        
        <h3>Articles</h3>
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/api/articles</code></p>
          <p>Récupérer tous les articles</p>
        </div>
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/api/articles/:id</code></p>
          <p>Récupérer un article spécifique avec ses commentaires</p>
        </div>
        <div class="endpoint">
          <p><span class="method post">POST</span> <code>/api/articles</code></p>
          <p>Créer un nouvel article</p>
          <p>Body: <code>{ "title": "String", "content": "String", "author": "String", "tags": ["String"] }</code></p>
        </div>
        <div class="endpoint">
          <p><span class="method put">PUT</span> <code>/api/articles/:id</code></p>
          <p>Mettre à jour un article existant</p>
        </div>
        <div class="endpoint">
          <p><span class="method delete">DELETE</span> <code>/api/articles/:id</code></p>
          <p>Supprimer un article</p>
        </div>

        <h3>Commentaires</h3>
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/api/articles/:articleId/comments</code></p>
          <p>Récupérer tous les commentaires d'un article</p>
        </div>
        <div class="endpoint">
          <p><span class="method post">POST</span> <code>/api/articles/:articleId/comments</code></p>
          <p>Ajouter un commentaire à un article</p>
          <p>Body: <code>{ "content": "String", "author": "String" }</code></p>
        </div>
        
        <h3>Circuit Breaker et Monitoring</h3>
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/api/status</code></p>
          <p>Obtenir l'état actuel des Circuit Breakers</p>
        </div>
        <div class="endpoint">
          <p><span class="method post">POST</span> <code>/api/circuit-breaker/test/:service</code></p>
          <p>Tester le Circuit Breaker d'un service en générant une erreur</p>
        </div>
        <div class="endpoint">
          <p><span class="method post">POST</span> <code>/api/circuit-breaker/reset/:service</code></p>
          <p>Réinitialiser le Circuit Breaker d'un service</p>
        </div>
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/health</code></p>
          <p>Vérifier l'état de santé de la gateway et des services</p>
        </div>
      </div>
      
      <div class="container">
        <h2>Tests des Circuit Breakers</h2>
        <div class="circuit-breaker">
          <h3>Service d'Articles</h3>
          <button onclick="testCircuitBreaker('articleService')">Tester le Circuit Breaker</button>
          <button onclick="resetCircuitBreaker('articleService')">Réinitialiser</button>
        </div>
        <div class="circuit-breaker">
          <h3>Service de Commentaires</h3>
          <button onclick="testCircuitBreaker('commentService')">Tester le Circuit Breaker</button>
          <button onclick="resetCircuitBreaker('commentService')">Réinitialiser</button>
        </div>
      </div>
      
      <div class="container" id="service-status">
        <h2>État des Services</h2>
        <p><button onclick="refreshStatus()">Actualiser l'état</button></p>
        <div id="status-content">Chargement...</div>
      </div>
      
      <script>
        // Fonction pour afficher l'état des Circuit Breakers
        async function refreshStatus() {
          try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            let html = '';
            
            // Service d'Articles
            html += '<div class="circuit-breaker">';
            html += '<h3>Service d\'Articles</h3>';
            
            let statusClass = '';
            if (data.articleService.state === 'closed') {
              statusClass = 'status-closed';
            } else if (data.articleService.state === 'open') {
              statusClass = 'status-open';
            } else {
              statusClass = 'status-half-open';
            }
            
            html += '<p>État: <span class="status ' + statusClass + '">' + data.articleService.state.toUpperCase() + '</span></p>';
            html += '<p>Succès: ' + data.articleService.stats.successful + '</p>';
            html += '<p>Échecs: ' + data.articleService.stats.failed + '</p>';
            html += '<p>Rejets: ' + data.articleService.stats.rejected + '</p>';
            html += '</div>';
            
            // Service de Commentaires
            html += '<div class="circuit-breaker">';
            html += '<h3>Service de Commentaires</h3>';
            
            if (data.commentService.state === 'closed') {
              statusClass = 'status-closed';
            } else if (data.commentService.state === 'open') {
              statusClass = 'status-open';
            } else {
              statusClass = 'status-half-open';
            }
            
            html += '<p>État: <span class="status ' + statusClass + '">' + data.commentService.state.toUpperCase() + '</span></p>';
            html += '<p>Succès: ' + data.commentService.stats.successful + '</p>';
            html += '<p>Échecs: ' + data.commentService.stats.failed + '</p>';
            html += '<p>Rejets: ' + data.commentService.stats.rejected + '</p>';
            html += '</div>';
            
            document.getElementById('status-content').innerHTML = html;
          } catch (error) {
            document.getElementById('status-content').innerHTML = '<p>Erreur lors de la récupération de l\'état: ' + error.message + '</p>';
          }
        }
        
        // Fonction pour tester un Circuit Breaker
        async function testCircuitBreaker(service) {
          try {
            await fetch('/api/circuit-breaker/test/' + service, { method: 'POST' });
            refreshStatus();
          } catch (error) {
            console.error('Erreur lors du test du Circuit Breaker:', error);
          }
        }
        
        // Fonction pour réinitialiser un Circuit Breaker
        async function resetCircuitBreaker(service) {
          try {
            await fetch('/api/circuit-breaker/reset/' + service, { method: 'POST' });
            refreshStatus();
          } catch (error) {
            console.error('Erreur lors de la réinitialisation du Circuit Breaker:', error);
          }
        }
        
        // Actualiser l'état au chargement de la page
        document.addEventListener('DOMContentLoaded', refreshStatus);
        
        // Actualiser l'état toutes les 5 secondes
        setInterval(refreshStatus, 5000);
      </script>
    </body>
    </html>
  `);
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `La route ${req.originalUrl} n'existe pas`
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('[API-GATEWAY] Erreur non gérée:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur serveur dans l\'API Gateway'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`[API-GATEWAY] L'API Gateway est démarrée sur le port ${PORT}`);
});
