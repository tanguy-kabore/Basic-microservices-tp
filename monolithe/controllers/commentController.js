const Comment = require('../models/comment');
const Article = require('../models/article');

// Récupérer tous les commentaires d'un article
exports.getCommentsByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    // Vérifier que l'article existe
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }
    
    // Récupérer les commentaires associés
    const comments = await Comment.find({ articleId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.error(`Erreur lors de la récupération des commentaires pour l'article ${req.params.articleId}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un nouveau commentaire
exports.createComment = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { content, author } = req.body;
    
    // Validation basique
    if (!content || !author) {
      return res.status(400).json({ 
        success: false, 
        error: 'Veuillez fournir un contenu et un auteur' 
      });
    }
    
    // Vérifier que l'article existe
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }
    
    const comment = await Comment.create({
      articleId,
      content,
      author
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error(`Erreur lors de la création d'un commentaire pour l'article ${req.params.articleId}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Commentaire non trouvé' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(`Erreur lors de la suppression du commentaire ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
