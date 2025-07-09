"""
Script de génération de données initiales pour le service de commentaires

Ce script peut être exécuté manuellement pour remplir la base de données
avec quelques commentaires de démonstration.

Utilisation: python seed_data.py
"""

import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import text

# Import de l'engine et Base depuis le module database
from database import engine, Base, SessionLocal
from models import Comment

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

def seed_database():
    """Fonction pour remplir la base de données avec des données de test"""
    print("[SEED] Starting database seeding process")
    print(f"[SEED] Using database URL: {os.getenv('DATABASE_URL', 'default_url_not_set')}")
    print("[SEED] Création des tables dans la base de données PostgreSQL")
    
    # Création des tables
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("[SEED] Tables créées avec succès")
    except Exception as e:
        print(f"[SEED] Erreur lors de la création des tables: {str(e)}")
        return
    
    # Utilisation de la session déjà configurée dans database.py
    
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
    
    # Ajout des commentaires dans la base de données
    try:
        # Création de la session
        session = SessionLocal()
        
        try:
            # Suppression des commentaires existants
            session.execute(text("DELETE FROM comments"))
            
            # Pour chaque article, ajouter quelques commentaires
            for idx, article_id in enumerate(article_ids[:3]):  # Limite à 3 articles pour éviter trop de données
                # Utiliser directement l'ID MongoDB string pour PostgreSQL
                # Désormais article_id est une colonne de type String
                
                for comment_template in sample_comments:
                    comment = Comment(
                        article_id=article_id,  # Utiliser l'ID MongoDB directement
                        content=comment_template["content"],
                        author=comment_template["author"]
                    )
                    session.add(comment)
                
                print(f"[SEED] Commentaires ajoutés pour l'article {article_id}")
            
            # Validation des changements
            session.commit()
            print("[SEED] Tous les commentaires ont été ajoutés avec succès")
            
        except Exception as e:
            session.rollback()
            print(f"[SEED] Erreur lors de l'ajout des commentaires: {str(e)}")
        finally:
            # Fermeture de la session dans tous les cas
            session.close()
            
    except Exception as e:
        print(f"[SEED] Erreur lors de l'initialisation de la session: {str(e)}")
    
    print("[SEED] Opération terminée avec succès")

if __name__ == "__main__":
    # Exécution de la fonction d'initialisation des données
    seed_database()
