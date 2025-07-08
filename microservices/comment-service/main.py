import os
import requests
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List
import uvicorn
from datetime import datetime

import models
from database import engine, get_db
from schemas import CommentCreate, CommentResponse

# Création des tables dans la base de données
models.Base.metadata.create_all(bind=engine)

# Création de l'application FastAPI
app = FastAPI(title="Service de Commentaires")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration des variables d'environnement
ARTICLE_SERVICE_URL = os.getenv("ARTICLE_SERVICE_URL", "http://article-service:3001")
PORT = int(os.getenv("PORT", "3002"))

# Route racine - page d'accueil simple
@app.get("/", response_class=HTMLResponse)
def read_root():
    return """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Microservice de Commentaires</title>
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
                border-bottom: 2px solid #8e44ad;
                padding-bottom: 10px;
            }
            h2 {
                color: #8e44ad;
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
                border-left: 4px solid #8e44ad;
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
        </style>
    </head>
    <body>
        <h1>Microservice de Commentaires</h1>
        <p>Ce microservice est responsable uniquement de la gestion des commentaires du blog, implémenté en Python avec FastAPI et PostgreSQL.</p>

        <div class="container">
            <h2>API Endpoints</h2>
            
            <div class="endpoint">
                <p><span class="method get">GET</span> <code>/api/articles/{article_id}/comments</code></p>
                <p>Récupérer tous les commentaires d'un article spécifique</p>
            </div>
            <div class="endpoint">
                <p><span class="method post">POST</span> <code>/api/articles/{article_id}/comments</code></p>
                <p>Ajouter un commentaire à un article</p>
                <p>Body: <code>{ "content": "String", "author": "String" }</code></p>
            </div>
        </div>

        <div class="container">
            <h2>Technologies utilisées</h2>
            <ul>
                <li><strong>Python et FastAPI</strong>: Framework web</li>
                <li><strong>PostgreSQL</strong>: Base de données relationnelle</li>
                <li><strong>SQLAlchemy</strong>: ORM pour PostgreSQL</li>
            </ul>
            <p>Ce microservice fait partie d'une architecture complète de microservices, comprenant également un service d'articles et une API Gateway.</p>
        </div>
    </body>
    </html>
    """

# Route pour vérifier la santé du service
@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "service": "comment-service",
        "database": {
            "type": "postgresql",
            "status": "connected"  # Dans une implémentation réelle, on vérifierait l'état de la connexion
        }
    }

# Route pour récupérer les commentaires d'un article
@app.get("/api/articles/{article_id}/comments", response_model=List[CommentResponse])
def get_comments_by_article(article_id: int, db: Session = Depends(get_db)):
    try:
        # Vérifier que l'article existe en appelant le service d'articles
        print(f"[COMMENT-SERVICE] Vérification de l'existence de l'article {article_id}")
        article_response = requests.get(f"{ARTICLE_SERVICE_URL}/api/articles/{article_id}")
        
        if article_response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Article avec ID {article_id} non trouvé")
        
        # Si la requête échoue pour une autre raison, nous continuons quand même (résilience)
        if article_response.status_code != 200:
            print(f"[COMMENT-SERVICE] Avertissement: impossible de vérifier l'article {article_id}, code: {article_response.status_code}")
        
        # Récupérer les commentaires de l'article
        comments = db.query(models.Comment).filter(models.Comment.article_id == article_id).all()
        return comments
    
    except requests.RequestException as e:
        # En cas d'erreur de connexion au service d'articles, nous continuons quand même
        print(f"[COMMENT-SERVICE] Erreur lors de la connexion au service d'articles: {str(e)}")
        
        # Récupérer les commentaires de l'article
        comments = db.query(models.Comment).filter(models.Comment.article_id == article_id).all()
        return comments

# Route pour ajouter un commentaire à un article
@app.post("/api/articles/{article_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(article_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    try:
        # Vérifier que l'article existe en appelant le service d'articles
        print(f"[COMMENT-SERVICE] Vérification de l'existence de l'article {article_id} avant d'ajouter un commentaire")
        article_response = requests.get(f"{ARTICLE_SERVICE_URL}/api/articles/{article_id}")
        
        if article_response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Article avec ID {article_id} non trouvé")
        
        if article_response.status_code != 200:
            raise HTTPException(status_code=503, detail=f"Erreur lors de la communication avec le service d'articles")
        
        # Créer le commentaire
        db_comment = models.Comment(
            article_id=article_id,
            content=comment.content,
            author=comment.author
        )
        
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        
        return db_comment
    
    except requests.RequestException as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service d'articles temporairement indisponible: {str(e)}"
        )

# Démarrage du serveur si exécuté directement
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
