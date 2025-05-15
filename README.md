Description
Ce projet est une architecture orientée services (SOA) qui permet de gérer une base de joueurs avec un CRUD complet, tout en intégrant des services avancés d'analyse d'image via un modèle d'IA pour prédire l’état de fatigue, ainsi qu’un chatbot basé sur Ollama.
L’objectif est de combiner plusieurs technologies modernes pour offrir une API robuste, flexible et évolutive

Technologies utilisées
•	REST API : Pour les opérations classiques CRUD sur les joueurs.
•	GraphQL : Pour des requêtes flexibles et précises sur les données des joueurs.
•	gRPC : Pour la communication performante et typée entre microservices.
•	API Gateway : Point d’entrée unique combinant REST, GraphQL et proxy vers les microservices.
•	MongoDB : Base de données NoSQL pour stocker les informations des joueurs.
•	Modèle IA TensorFlow Lite : Service d’analyse d’image pour prédire l’état de fatigue à partir de photos.
•	Ollama : Intégration d’un service de chatbot pour répondre aux questions sur les joueurs.
•	Multer & Jimp : Gestion et traitement des images uploadées.
•	Kafka : Pour la gestion des messages et événements liés aux opérations CRUD des joueurs.
•	Front-end Angular avec Bootstrap : Interface utilisateur responsive pour la gestion des joueurs, la visualisation des résultats d’analyse et l’interaction avec le chatbot.
Fonctionnalités principales
•	CRUD complet des joueurs via REST et GraphQL.
•	Communication entre services via gRPC pour une meilleure scalabilité.
•	API Gateway orchestrant les différentes APIs et microservices.
•	Analyse d’images uploadées pour prédire l’état de fatigue avec un modèle IA.
•	Chatbot Ollama intégré pour interaction naturelle avec les utilisateurs.
•	Intégration Kafka pour notifier et traiter les événements liés aux joueurs.
Architecture
Le projet est divisé en plusieurs microservices :
•	Service Joueurs : Gestion des données joueur, exposé en gRPC.
•	Service Analyse IA : Prédiction de l’état de fatigue à partir d’une image.
•	API Gateway : Agrégation des APIs REST, GraphQL, et proxy vers les microservices gRPC.
•	Service Ollama : Interaction conversationnelle via chatbot.
•	Front-end Angular : Application web client pour interagir avec les APIs et services.

Installation & démarrage
1.	Cloner le dépôt
2.	Installer les dépendances (npm install)
3.	Démarrer MongoDB
4.	Démarrer les microservices (Joueurs, Analyse IA, Ollama)
5.	Lancer l’API Gateway (node apiGateway.js)
6.	Accéder aux endpoints REST et GraphQL via http://localhost:3000
Exemple d’utilisation
POST /joueurs pour ajouter un joueur.
GET /joueurs/:id pour récupérer un joueur.
POST /api/joueurs/analyse pour analyser une image et prédire la fatigue.
POST /joueurs/chat pour interagir avec le chatbot Ollama.
