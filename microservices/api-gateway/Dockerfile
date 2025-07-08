FROM node:16-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 8080

# Commande de démarrage
CMD ["node", "server.js"]
