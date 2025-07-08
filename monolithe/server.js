const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Chargement des routes
const articleRoutes = require('./routes/articleRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/blogdb?authSource=admin';

// Connexion à MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connecté avec succès'))
  .catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Routes
app.use('/api/articles', articleRoutes);
app.use('/api', commentRoutes);

// Route racine - page d'accueil simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Monolithique Blog</title>
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
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #3498db;
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
          border-left: 4px solid #3498db;
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
      <h1>Application Monolithique de Blog</h1>
      <p>Cette application implémente une architecture monolithique complète avec les fonctionnalités d'articles et de commentaires, utilisant MongoDB comme base de données.</p>

      <div class="container">
        <h2>API Endpoints</h2>
        
        <h3>Articles</h3>
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
        <div class="endpoint">
          <p><span class="method delete">DELETE</span> <code>/api/comments/:id</code></p>
          <p>Supprimer un commentaire</p>
        </div>
      </div>

      <div class="container">
        <h2>Technologies utilisées</h2>
        <ul>
          <li><strong>Node.js et Express</strong>: Serveur web</li>
          <li><strong>MongoDB</strong>: Base de données NoSQL</li>
          <li><strong>Mongoose</strong>: ODM pour MongoDB</li>
          <li><strong>Docker</strong>: Conteneurisation</li>
        </ul>
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
    service: 'blog-monolith',
    database: {
      status: dbStatus
    }
  });
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
  console.error('Erreur non gérée:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Le serveur monolithique est démarré sur le port ${PORT}`);
});
