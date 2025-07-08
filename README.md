# TP Architectures Avancées - Monolithe vs Microservices

Ce TP permet d'explorer les architectures monolithiques et microservices avec une application de blog simple mais complète utilisant des technologies et bases de données variées.

## 📋 Vue d'ensemble

Ce TP illustre les concepts suivants :

1. **Décomposition d'un monolithe** - Analyser et comprendre les bounded contexts
2. **Implémentation de patterns** - Circuit Breaker, API Gateway et résilience
3. **Technologies multiples** - Nodejs et Python, MongoDB et PostgreSQL

## 🏗 Architecture du projet

```
TP_Architectures_Avancees/
├── docker-compose.yml           # Orchestration de tous les services
│
├── monolithe/                   # Application monolithique complète
│   ├── controllers/             # Logique métier
│   ├── models/                  # Modèles de données MongoDB
│   ├── routes/                  # Définition des routes API
│   ├── server.js                # Point d'entrée de l'application
│   ├── package.json             # Dépendances npm
│   └── Dockerfile               # Instructions de build
│
└── microservices/              
    ├── article-service/         # Service d'articles (Node.js + MongoDB)
    │   ├── controllers/         
    │   ├── models/              
    │   ├── routes/              
    │   ├── server.js            
    │   ├── package.json         
    │   └── Dockerfile           
    │
    ├── comment-service/         # Service de commentaires (Python + PostgreSQL) 
    │   ├── models.py            # Modèles SQLAlchemy
    │   ├── database.py          # Configuration de la DB
    │   ├── schemas.py           # Schémas Pydantic
    │   ├── main.py              # Application FastAPI
    │   ├── requirements.txt     # Dépendances Python
    │   └── Dockerfile           
    │
    └── api-gateway/             # API Gateway avec Circuit Breaker
        ├── server.js            # Logique d'orchestration et de résilience
        ├── package.json         
        └── Dockerfile           
```

## 🔧 Technologies utilisées

### Monolithe
- **Backend**: Node.js avec Express
- **Base de données**: MongoDB
- **ORM**: Mongoose

### Microservices
- **Service d'Articles**:
  - **Backend**: Node.js avec Express
  - **Base de données**: MongoDB
  - **ORM**: Mongoose

- **Service de Commentaires**:
  - **Backend**: Python avec FastAPI
  - **Base de données**: PostgreSQL
  - **ORM**: SQLAlchemy

- **API Gateway**:
  - **Backend**: Node.js avec Express
  - **Pattern de résilience**: Circuit Breaker (opossum)

## 🚀 Installation et démarrage

### Prérequis
- Docker et Docker Compose
- Node.js 14+ (pour développement local)
- Python 3.8+ (pour développement local)

### Lancement de l'ensemble du système

#### Sous Linux/macOS
```bash
# À la racine du projet
./start.sh
# Ou pour initialiser les données
./start.sh --init-data
```

#### Sous Windows
```powershell
# À la racine du projet
.\start.bat
# Ou pour initialiser les données
.\start.bat --init-data
```

### Notes pour Windows
Sous Windows, des restrictions d'accès aux ports peuvent survenir. Pour éviter ces problèmes, les services internes (monolithe, article-service, comment-service) ne sont accessibles que via le réseau Docker interne et l'API Gateway, qui est le seul point d'entrée exposé au système hôte.

### URLs des services
- **API Gateway**: http://localhost:8081 (seul point d'accès externe)
- **MongoDB**: mongodb://localhost:27017 (accessible pour les outils de développement)
- **PostgreSQL**: postgresql://localhost:5432 (accessible pour les outils de développement)

#### Services internes (accessibles uniquement via Docker)
- **Monolithe**: http://monolithe:3000 (réseau Docker interne)
- **Service d'Articles**: http://article-service:3001 (réseau Docker interne)
- **Service de Commentaires**: http://comment-service:3002 (réseau Docker interne)

## 🏫 Exercices pédagogiques

### Exercice 1: Décomposition d'un monolithe
1. **Analyse de l'existant**:
   - Examinez le code du monolithe dans le dossier `monolithe/`
   - Identifiez les responsabilités et les modèles de données

2. **Identification des bounded contexts**:
   - Dans l'application, quels sont les domaines fonctionnels ?
   - Quelles sont les entités principales et leurs relations ?

3. **Architecture proposée**:
   - Comparez l'approche monolithique à l'approche microservices
   - Analysez comment nous avons décomposé le monolithe en microservices
   - Identifiez les avantages et inconvénients de chaque approche

### Exercice 2: Implémentation de patterns

1. **Circuit Breaker**:
   - Localisez l'implémentation du Circuit Breaker dans le code de l'API Gateway
   - Testez le fonctionnement en arrêtant un service et en observant le comportement
   - Utilisez les endpoints `/api/circuit-breaker/test/:service` et `/api/circuit-breaker/reset/:service`

```bash
# Exemple de test du Circuit Breaker
curl -X POST http://localhost:8081/api/circuit-breaker/test/articleService
curl -X GET http://localhost:8081/api/status
```

2. **API Gateway**:
   - Analysez le rôle de l'API Gateway dans l'architecture
   - Observez comment elle orchestre les appels entre services
   - Identifiez les patterns de composition d'API

3. **Test de résilience**:
   - Arrêtez un des services (par exemple, le service d'articles)
   ```bash
   docker-compose stop article-service
   ```
   - Observez le comportement de l'API Gateway
   - Redémarrez le service et observez la récupération
   ```bash
   docker-compose start article-service
   ```

## 📊 Évaluation du TP

### Points à aborder dans le rapport

1. **Compréhension architecturale**:
   - Expliquez les différences entre monolithe et microservices
   - Identifiez les bounded contexts dans l'application blog
   - Proposez des évolutions possibles de l'architecture

2. **Patterns et résilience**:
   - Expliquez le fonctionnement du Circuit Breaker
   - Décrivez comment l'API Gateway améliore la résilience
   - Analysez les compromis entre couplage et complexité

3. **Bases de données**:
   - Comparez l'utilisation de MongoDB et PostgreSQL dans ce contexte
   - Expliquez les défis liés à la cohérence des données entre services
   - Proposez des stratégies pour gérer ces défis

## 🔍 Points d'observation importants

- **Cohérence vs disponibilité**: Comment les microservices gèrent-ils le compromis CAP ?
- **Communication inter-services**: Quelles sont les approches de communication entre services ?
- **Résilience**: Comment le système continue-t-il à fonctionner partiellement en cas de défaillance ?
- **Déploiement**: Quels sont les avantages des conteneurs pour le déploiement de microservices ?
- **Monitoring**: Comment pourrait-on surveiller efficacement une architecture distribuée ?

## 📚 Ressources supplémentaires

- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html)
- [Circuit Breaker Pattern](https://docs.microsoft.com/fr-fr/azure/architecture/patterns/circuit-breaker)
- [Principes SOLID et Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Patterns de résilience dans les microservices](https://docs.microsoft.com/fr-fr/azure/architecture/microservices/design/resiliency)
