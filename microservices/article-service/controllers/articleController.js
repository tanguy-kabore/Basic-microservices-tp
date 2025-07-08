const Article = require('../models/article');

// Récupérer tous les articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    console.error('[ARTICLE-SERVICE] Erreur lors de la récupération des articles:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Récupérer un article par son ID
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error(`[ARTICLE-SERVICE] Erreur lors de la récupération de l'article ${req.params.id}:`, error);
    
    // Vérifier si l'erreur est due à un ID invalide
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'ID d\'article invalide' });
    }
    
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
    console.error('[ARTICLE-SERVICE] Erreur lors de la création de l\'article:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour un article
exports.updateArticle = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const article = await Article.findByIdAndUpdate(
      req.params.id,
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
    console.error(`[ARTICLE-SERVICE] Erreur lors de la mise à jour de l'article ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }

    // Ici, dans un système complet, nous devrions notifier le service de commentaires
    // pour supprimer également les commentaires associés à cet article

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(`[ARTICLE-SERVICE] Erreur lors de la suppression de l'article ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
