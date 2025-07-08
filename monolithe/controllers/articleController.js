const Article = require('../models/article');
const mongoose = require('mongoose');

// Fonction utilitaire pour valider les ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Récupérer tous les articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Récupérer un article par son ID
exports.getArticleById = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Vérifier si l'ID est un ObjectId MongoDB valide
    if (!isValidObjectId(id)) {
      console.error(`ID d'article invalide: ${id}`);
      return res.status(400).json({ 
        success: false, 
        error: `Format d'ID invalide. Les IDs MongoDB sont des chaînes hexadécimales de 24 caractères.` 
      });
    }
    
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }
    
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'article ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un nouvel article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;

    // Validation basique
    if (!title || !content || !author) {
      return res.status(400).json({ 
        success: false, 
        error: 'Veuillez fournir un titre, un contenu et un auteur' 
      });
    }

    const article = await Article.create({
      title,
      content,
      author,
      tags: tags || []
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour un article
exports.updateArticle = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Vérifier si l'ID est un ObjectId MongoDB valide
    if (!isValidObjectId(id)) {
      console.error(`ID d'article invalide pour mise à jour: ${id}`);
      return res.status(400).json({ 
        success: false, 
        error: `Format d'ID invalide. Les IDs MongoDB sont des chaînes hexadécimales de 24 caractères.` 
      });
    }
    
    const { title, content, tags } = req.body;
    const article = await Article.findByIdAndUpdate(
      id,
      { 
        title, 
        content, 
        tags, 
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'article ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un article
exports.deleteArticle = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Vérifier si l'ID est un ObjectId MongoDB valide
    if (!isValidObjectId(id)) {
      console.error(`ID d'article invalide pour suppression: ${id}`);
      return res.status(400).json({ 
        success: false, 
        error: `Format d'ID invalide. Les IDs MongoDB sont des chaînes hexadécimales de 24 caractères.` 
      });
    }
    
    const article = await Article.findByIdAndDelete(id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'article ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
