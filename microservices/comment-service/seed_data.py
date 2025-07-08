"""
Script de génération de données initiales pour le service de commentaires

Ce script peut être exécuté manuellement pour remplir la base de données
avec quelques commentaires de démonstration.

Utilisation: python seed_data.py
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
import requests
from datetime import datetime
from dotenv import load_dotenv

from models import Comment, Base
from database import engine

# Chargement des variables d'environnement
load_dotenv()

# URL du service d'articles pour récupérer des IDs valides
ARTICLE_SERVICE_URL = os.getenv("ARTICLE_SERVICE_URL", "http://article-service:3001")

# Commentaires de démonstration (les IDs d'articles seront récupérés du service d'articles)
sample_comments = [
    {
        "content": "Excellent article qui explique clairement les concepts fondamentaux.",
        "author": "Jean Dupont"
    },
    {
        "content": "Je ne suis pas totalement d'accord avec votre analyse sur les microservices. Je pense que la complexité opérationnelle est souvent sous-estimée.",
        "author": "Marie Curie"
    },
    {
        "content": "Cet article m'a beaucoup aidé pour mon projet universitaire. Merci !",
        "author": "Étudiant en informatique"
    },
    {
        "content": "Pourriez-vous approfondir la partie sur le Circuit Breaker ? Je trouve ce concept particulièrement intéressant.",
        "author": "Alex Techno"
    },
    {
        "content": "Je recommande également l'ouvrage 'Building Microservices' de Sam Newman sur ce sujet.",
        "author": "Bibliophile Dev"
    }
]

async def seed_database():
    """Fonction pour remplir la base de données avec des données de test"""
    print("[SEED] Création des tables dans la base de données PostgreSQL")
    
    # Création des tables - version non asynchrone pour éviter les problèmes de compatibilité
    # Cette approche fonctionne mieux dans certains environnements Docker
    try:
        Base.metadata.drop_all(bind=engine.sync_engine)
        Base.metadata.create_all(bind=engine.sync_engine)
        print("[SEED] Tables créées avec succès")
    except Exception as e:
        print(f"[SEED] Erreur lors de la création des tables: {str(e)}")
        # Alternative si la méthode sync_engine n'est pas disponible
        try:
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("[SEED] Tables créées avec succès (méthode alternative)")
        except Exception as e2:
            print(f"[SEED] Erreur avec la méthode alternative: {str(e2)}")
            return
    
    # Session asynchrone avec gestion d'erreur améliorée
    try:
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
    except Exception as e:
        print(f"[SEED] Erreur lors de la création de la session: {str(e)}")
        return
    
    # Récupération des IDs d'articles depuis le service d'articles
    article_ids = []
    
    try:
        print(f"[SEED] Tentative de récupération des articles depuis {ARTICLE_SERVICE_URL}/api/articles")
        response = requests.get(f"{ARTICLE_SERVICE_URL}/api/articles")
        
        if response.status_code == 200:
            articles = response.json().get('data', [])
            article_ids = [article['_id'] for article in articles]
            print(f"[SEED] {len(article_ids)} IDs d'articles récupérés avec succès")
        else:
            print(f"[SEED] Impossible de récupérer les articles. Code: {response.status_code}")
            # IDs par défaut si le service d'articles n'est pas disponible
            article_ids = ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"]
            print("[SEED] Utilisation d'IDs d'articles par défaut")
    
    except Exception as e:
        print(f"[SEED] Erreur lors de la récupération des articles: {str(e)}")
        # IDs par défaut si le service d'articles n'est pas disponible
        article_ids = ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"]
        print("[SEED] Utilisation d'IDs d'articles par défaut")
    
    # Ajout des commentaires dans la base de données - avec gestion d'erreurs améliorée
    try:
        # Création de la session
        session = async_session()
        
        try:
            # Suppression des commentaires existants
            await session.execute("DELETE FROM comments")
            
            # Pour chaque article, ajouter quelques commentaires
            for idx, article_id in enumerate(article_ids[:3]):  # Limite à 3 articles pour éviter trop de données
                # Convertir l'ID MongoDB string en entier pour PostgreSQL
                # On utilise simplement l'index comme ID pour simplifier
                numeric_id = idx + 1
                
                for comment_template in sample_comments:
                    comment = Comment(
                        article_id=numeric_id,
                        content=comment_template["content"],
                        author=comment_template["author"]
                    )
                    session.add(comment)
                
                print(f"[SEED] Commentaires ajoutés pour l'article {article_id} (ID numérique: {numeric_id})")
            
            # Validation des changements
            await session.commit()
            print("[SEED] Tous les commentaires ont été ajoutés avec succès")
            
        except Exception as e:
            await session.rollback()
            print(f"[SEED] Erreur lors de l'ajout des commentaires: {str(e)}")
        finally:
            # Fermeture de la session dans tous les cas
            await session.close()
            
    except Exception as e:
        print(f"[SEED] Erreur lors de l'initialisation de la session: {str(e)}")
    
    print("[SEED] Opération terminée avec succès")

if __name__ == "__main__":
    asyncio.run(seed_database())
