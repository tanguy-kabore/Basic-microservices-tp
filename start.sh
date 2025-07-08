#!/bin/bash

# Script de démarrage pour l'environnement complet
# Ce script facilite le démarrage de tous les services et l'initialisation des données

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}     Démarrage de l'environnement TP Architecture     ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Fonction pour afficher l'aide
show_help() {
  echo -e "${YELLOW}Utilisation:${NC} ./start.sh [option]"
  echo ""
  echo "Options:"
  echo "  --help, -h            Afficher cette aide"
  echo "  --monolith, -m        Démarrer uniquement l'application monolithique"
  echo "  --microservices, -ms  Démarrer uniquement les microservices"
  echo "  --init-data, -i       Initialiser les données après démarrage"
  echo "  --clean, -c           Nettoyer les conteneurs et volumes avant démarrage"
  echo ""
  echo "Sans option, démarre l'ensemble du système."
}

# Fonction pour nettoyer l'environnement
clean_environment() {
  echo -e "${YELLOW}Nettoyage de l'environnement...${NC}"
  
  docker-compose down -v
  
  echo -e "${GREEN}Environnement nettoyé avec succès.${NC}"
}

# Fonction pour démarrer l'application monolithique
start_monolith() {
  echo -e "${YELLOW}Démarrage de l'application monolithique...${NC}"
  
  docker-compose up -d mongodb monolithe
  
  echo -e "${GREEN}Application monolithique démarrée.${NC}"
  echo -e "URL d'accès: ${BLUE}http://localhost:3000${NC}"
}

# Fonction pour démarrer les microservices
start_microservices() {
  echo -e "${YELLOW}Démarrage des microservices...${NC}"
  
  docker-compose up -d mongodb postgres article-service comment-service api-gateway
  
  echo -e "${GREEN}Microservices démarrés.${NC}"
  echo -e "URLs d'accès:"
  echo -e "- API Gateway:         ${BLUE}http://localhost:8080${NC}"
  echo -e "- Service d'articles:  ${BLUE}http://localhost:3001${NC}"
  echo -e "- Service de commentaires: ${BLUE}http://localhost:3002${NC}"
}

# Fonction pour initialiser les données
init_data() {
  echo -e "${YELLOW}Initialisation des données de test...${NC}"
  
  # Initialiser les données pour le monolithe
  if docker ps | grep -q "monolithe"; then
    echo -e "Initialisation des données pour le ${BLUE}monolithe${NC}..."
    docker exec -it monolithe node seed.js
  fi
  
  # Initialiser les données pour le service d'articles
  if docker ps | grep -q "article-service"; then
    echo -e "Initialisation des données pour le ${BLUE}service d'articles${NC}..."
    docker exec -it article-service node seed.js
  fi
  
  # Initialiser les données pour le service de commentaires
  if docker ps | grep -q "comment-service"; then
    echo -e "Initialisation des données pour le ${BLUE}service de commentaires${NC}..."
    docker exec -it comment-service python seed_data.py
  fi
  
  echo -e "${GREEN}Initialisation des données terminée.${NC}"
}

# Fonction pour démarrer tout le système
start_all() {
  echo -e "${YELLOW}Démarrage de tous les services...${NC}"
  
  docker-compose up -d
  
  echo -e "${GREEN}Tous les services sont démarrés.${NC}"
  echo -e "URLs d'accès:"
  echo -e "- Application monolithique: ${BLUE}http://localhost:3000${NC}"
  echo -e "- API Gateway:             ${BLUE}http://localhost:8080${NC}"
  echo -e "- Service d'articles:      ${BLUE}http://localhost:3001${NC}"
  echo -e "- Service de commentaires: ${BLUE}http://localhost:3002${NC}"
}

# Traitement des arguments
case "$1" in
  --help|-h)
    show_help
    exit 0
    ;;
  --monolith|-m)
    start_monolith
    ;;
  --microservices|-ms)
    start_microservices
    ;;
  --clean|-c)
    clean_environment
    start_all
    ;;
  --init-data|-i)
    init_data
    ;;
  *)
    start_all
    ;;
esac

# Conseils finaux
echo -e "\n${YELLOW}Conseils:${NC}"
echo -e "- Pour initialiser les données:    ${BLUE}./start.sh --init-data${NC}"
echo -e "- Pour arrêter tous les services:  ${BLUE}docker-compose down${NC}"
echo -e "- Pour voir les logs:              ${BLUE}docker-compose logs -f${NC}"
echo -e "\n${GREEN}Bon TP !${NC}\n"
