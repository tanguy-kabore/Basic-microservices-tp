const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Chargement des routes
const articleRoutes = require('./routes/articleRoutes');

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/articles?authSource=admin';

// Connexion à MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('[ARTICLE-SERVICE] MongoDB connecté avec succès'))
  .catch(err => {
    console.error('[ARTICLE-SERVICE] Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Routes
app.use('/api/articles', articleRoutes);

// Route racine - page d'accueil simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Microservice d'Articles</title>
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
          border-bottom: 2px solid #27ae60;
          padding-bottom: 10px;
        }
        h2 {
          color: #27ae60;
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
          border-left: 4px solid #27ae60;
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
      </style>
    </head>
    <body>
      <h1>Microservice d'Articles</h1>
      <p>Ce microservice est responsable uniquement de la gestion des articles du blog.</p>

      <div class="container">
        <h2>API Endpoints</h2>
        
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/api/articles</code></p>
          <p>Récupérer tous les articles</p>
        </div>
        <div class="endpoint">
          <p><span class="method get">GET</span> <code>/api/articles/:id</code></p>
          <p>Récupérer un article spécifique par son ID</p>
        </div>
        <div class="endpoint">
          <p><span class="method post">POST</span> <code>/api/articles</code></p>
          <p>Créer un nouvel article</p>
          <p>Body: <code>{ "title": "String", "content": "String", "author": "String", "tags": ["String"] }</code></p>
        </div>
        <div class="endpoint">
          <p><span class="method put">PUT</span> <code>/api/articles/:id</code></p>
          <p>Mettre à jour un article existant</p>
          <p>Body: <code>{ "title": "String", "content": "String", "tags": ["String"] }</code></p>
        </div>
        <div class="endpoint">
          <p><span class="method delete">DELETE</span> <code>/api/articles/:id</code></p>
          <p>Supprimer un article</p>
        </div>
      </div>

      <div class="container">
        <h2>Technologies utilisées</h2>
        <ul>
          <li><strong>Node.js et Express</strong>: Serveur web</li>
          <li><strong>MongoDB</strong>: Base de données NoSQL</li>
          <li><strong>Mongoose</strong>: ODM pour MongoDB</li>
        </ul>
        <p>Ce microservice fait partie d'une architecture complète de microservices, comprenant également un service de commentaires et une API Gateway.</p>
      </div>
    </body>
    </html>
  `);
});

// Route de santé pour les contrôles de disponibilité
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'article-service',
    database: {
      type: 'mongodb',
      status: dbStatus
    }
  });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `La route ${req.originalUrl} n'existe pas dans le service d'articles`
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('[ARTICLE-SERVICE] Erreur non gérée:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur serveur dans le service d\'articles'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`[ARTICLE-SERVICE] Le serveur d'articles est démarré sur le port ${PORT}`);
});
