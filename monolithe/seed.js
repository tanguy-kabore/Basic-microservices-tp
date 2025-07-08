/**
 * Script de génération de données initiales pour l'application monolithique
 * 
 * Ce script peut être exécuté manuellement pour remplir la base de données
 * avec quelques articles et commentaires de démonstration.
 * 
 * Utilisation: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Article = require('./models/article');
const Comment = require('./models/comment');

// Configuration
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/monolithe?authSource=admin';

// Articles de démonstration
const sampleArticles = [
  {
    title: "Introduction aux Microservices",
    content: "Les microservices sont une approche architecturale du développement d'applications où une application est construite comme un ensemble de services autonomes...",
    author: "Martin Fowler",
    tags: ["Architecture", "Microservices", "Design Pattern"]
  },
  {
    title: "MongoDB vs PostgreSQL dans une architecture microservices",
    content: "Le choix de la base de données dans une architecture microservices est crucial. MongoDB et PostgreSQL offrent des avantages différents selon le contexte...",
    author: "Sarah Connor",
    tags: ["Bases de données", "MongoDB", "PostgreSQL"]
  },
  {
    title: "Patterns de résilience dans les microservices",
    content: "La résilience est essentielle dans une architecture distribuée. Le Circuit Breaker, le Bulkhead et le Timeout sont des patterns essentiels...",
    author: "Michael Brecker",
    tags: ["Résilience", "Circuit Breaker", "Microservices"]
  },
  {
    title: "API Gateway: le point d'entrée unique de votre architecture",
    content: "Une API Gateway sert de point d'entrée unique pour tous les clients, facilitant la gestion des requêtes et la sécurité tout en offrant des fonctionnalités de résilience...",
    author: "Ada Lovelace",
    tags: ["API Gateway", "Architecture", "Design"]
  },
  {
    title: "Communication inter-services: synchrone vs asynchrone",
    content: "Le choix entre communication synchrone (HTTP/REST) et asynchrone (message broker) a un impact majeur sur le couplage et la résilience de votre système...",
    author: "Tim Berners-Lee",
    tags: ["Communication", "Messaging", "REST"]
  }
];

// Commentaires de démonstration
const sampleComments = [
  {
    content: "Excellent article qui explique clairement les concepts fondamentaux.",
    author: "Jean Dupont"
  },
  {
    content: "Je ne suis pas totalement d'accord avec votre analyse sur les microservices. Je pense que la complexité opérationnelle est souvent sous-estimée.",
    author: "Marie Curie"
  },
  {
    content: "Cet article m'a beaucoup aidé pour mon projet universitaire. Merci !",
    author: "Étudiant en informatique"
  },
  {
    content: "Pourriez-vous approfondir la partie sur le Circuit Breaker ? Je trouve ce concept particulièrement intéressant.",
    author: "Alex Techno"
  },
  {
    content: "Je recommande également l'ouvrage 'Building Microservices' de Sam Newman sur ce sujet.",
    author: "Bibliophile Dev"
  }
];

// Fonction pour remplir la base de données
async function seedDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('[SEED] Connexion à MongoDB réussie');
    
    // Suppression des articles et commentaires existants
    await Article.deleteMany({});
    await Comment.deleteMany({});
    console.log('[SEED] Suppression des données existantes');
    
    // Création des nouveaux articles
    const insertedArticles = await Article.insertMany(sampleArticles);
    console.log(`[SEED] ${insertedArticles.length} articles insérés avec succès`);
    
    // Ajout de commentaires pour chaque article
    let commentCount = 0;
    for (const article of insertedArticles) {
      // Ajouter 2-3 commentaires par article
      const numComments = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numComments; i++) {
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        await Comment.create({
          articleId: article._id,
          content: randomComment.content,
          author: randomComment.author
        });
        
        commentCount++;
      }
    }
    
    console.log(`[SEED] ${commentCount} commentaires insérés avec succès`);
    
    // Affichage des IDs pour référence
    console.log('[SEED] Résumé des articles insérés:');
    insertedArticles.forEach(article => {
      console.log(`- ${article.title} (ID: ${article._id})`);
    });
    
    // Déconnexion de MongoDB
    await mongoose.disconnect();
    console.log('[SEED] Déconnexion de MongoDB');
    
    console.log('[SEED] Opération terminée avec succès');
  } catch (error) {
    console.error('[SEED] Erreur lors du remplissage de la base de données:', error);
    process.exit(1);
  }
}

// Exécution de la fonction
seedDatabase();
