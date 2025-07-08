/**
 * Script de génération de données initiales pour le service d'articles
 * 
 * Ce script peut être exécuté manuellement pour remplir la base de données
 * avec quelques articles de démonstration.
 * 
 * Utilisation: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Article = require('./models/article');

// Configuration
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/articles?authSource=admin';

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

// Fonction pour remplir la base de données
async function seedDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('[SEED] Connexion à MongoDB réussie');
    
    // Suppression des articles existants
    await Article.deleteMany({});
    console.log('[SEED] Suppression des articles existants');
    
    // Création des nouveaux articles
    const insertedArticles = await Article.insertMany(sampleArticles);
    console.log(`[SEED] ${insertedArticles.length} articles insérés avec succès`);
    
    // Affichage des IDs pour référence (utile pour les tests)
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
