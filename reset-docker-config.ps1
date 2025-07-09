# Script de réinitialisation de la configuration Docker pour Windows
# Ce script supprime les variables d'environnement Docker Toolbox et configure Docker Desktop

Write-Host "Suppression des variables d'environnement Docker Toolbox..."
Remove-Item Env:\DOCKER_TLS_VERIFY -ErrorAction SilentlyContinue
Remove-Item Env:\DOCKER_HOST -ErrorAction SilentlyContinue
Remove-Item Env:\DOCKER_CERT_PATH -ErrorAction SilentlyContinue
Remove-Item Env:\DOCKER_MACHINE_NAME -ErrorAction SilentlyContinue

Write-Host "Configuration de Docker pour utiliser le socket Windows..."
$env:DOCKER_HOST = "npipe:////./pipe/docker_engine"

Write-Host "Test de la connexion Docker..."
docker version

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker est correctement configuré pour Docker Desktop!" -ForegroundColor Green
} else {
    Write-Host "La connexion à Docker a échoué. Vérifiez que Docker Desktop est bien en cours d'exécution." -ForegroundColor Red
}

Write-Host "`nPour appliquer ces paramètres de façon permanente, vous devriez:"
Write-Host "1. Désinstaller Docker Toolbox"
Write-Host "2. Définir la variable DOCKER_HOST de façon permanente"
Write-Host "3. Redémarrer votre ordinateur"
