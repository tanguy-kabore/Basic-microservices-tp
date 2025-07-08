const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Routes pour les commentaires
router.get('/articles/:articleId/comments', commentController.getCommentsByArticle);
router.post('/articles/:articleId/comments', commentController.createComment);
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;
