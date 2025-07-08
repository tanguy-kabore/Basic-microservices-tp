@echo off
:: Script de démarrage pour l'environnement complet sur Windows
:: Ce script facilite le démarrage de tous les services et l'initialisation des données

SETLOCAL EnableDelayedExpansion

echo ======================================================
echo      Démarrage de l'environnement TP Architecture     
echo ======================================================

:: Traitement des arguments
IF "%1"=="--help" GOTO :help
IF "%1"=="-h" GOTO :help
IF "%1"=="--monolith" GOTO :monolith
IF "%1"=="-m" GOTO :monolith
IF "%1"=="--microservices" GOTO :microservices
IF "%1"=="-ms" GOTO :microservices
IF "%1"=="--clean" GOTO :clean
IF "%1"=="-c" GOTO :clean
IF "%1"=="--init-data" GOTO :init_data
IF "%1"=="-i" GOTO :init_data
GOTO :start_all

:help
echo Utilisation: start.bat [option]
echo.
echo Options:
echo   --help, -h            Afficher cette aide
echo   --monolith, -m        Démarrer uniquement l'application monolithique
echo   --microservices, -ms  Démarrer uniquement les microservices
echo   --init-data, -i       Initialiser les données après démarrage
echo   --clean, -c           Nettoyer les conteneurs et volumes avant démarrage
echo.
echo Sans option, démarre l'ensemble du système.
GOTO :eof

:clean
echo Nettoyage de l'environnement...
docker-compose down -v
GOTO :start_all

:monolith
echo Démarrage de l'application monolithique...
docker-compose up -d mongodb monolithe
echo Application monolithique démarrée.
echo URL d'accès: http://localhost:3000
GOTO :eof

:microservices
echo Démarrage des microservices...
docker-compose up -d mongodb postgres article-service comment-service api-gateway
echo Microservices démarrés.
echo URL d'accès principal:
echo - API Gateway: http://localhost:8081
echo.
echo Note: Les services internes sont accessibles via l'API Gateway
GOTO :eof

:init_data
echo Initialisation des données de test...

:: Initialiser les données pour le monolithe
docker ps | find "monolithe" >nul
IF !ERRORLEVEL! EQU 0 (
    echo Initialisation des données pour le monolithe...
    docker exec -it monolithe node seed.js
)

:: Initialiser les données pour le service d'articles
docker ps | find "article-service" >nul
IF !ERRORLEVEL! EQU 0 (
    echo Initialisation des données pour le service d'articles...
    docker exec -it article-service node seed.js
)

:: Initialiser les données pour le service de commentaires
docker ps | find "comment-service" >nul
IF !ERRORLEVEL! EQU 0 (
    echo Initialisation des données pour le service de commentaires...
    docker exec -it comment-service python seed_data.py
)

echo Initialisation des données terminée.
GOTO :eof

:start_all
echo Démarrage de tous les services...
docker-compose up -d
echo Tous les services sont démarrés.
echo URLs d'accès:
echo - API Gateway:              http://localhost:8081 (point d'entrée principal)
echo.
echo Note: Les services internes ne sont plus exposés directement pour éviter
echo       les problèmes d'autorisation d'accès sous Windows.
echo       Utilisez l'API Gateway pour accéder à toutes les fonctionnalités.

:: Conseils finaux
echo.
echo Conseils:
echo - Pour initialiser les données:    start.bat --init-data
echo - Pour arrêter tous les services:  docker-compose down
echo - Pour voir les logs:              docker-compose logs -f
echo.
echo Bon TP !
echo.
GOTO :eof
