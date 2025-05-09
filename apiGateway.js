// apiGateway.js
//const { gql } = require('@apollo/server');

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Chargement des fichiers proto
const joueurProtoPath = './joueur.proto';
//const ficheProtoPath = './proto/ficheDeSante.proto';
//*********************************essai graphql
const fs = require('fs');
const path = require('path');
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8');
//********************** */
//******const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const joueurDefinition = protoLoader.loadSync(joueurProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
/*const ficheDefinition = protoLoader.loadSync(ficheProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});*/

const joueurProto = grpc.loadPackageDefinition(joueurDefinition).joueur;
//const ficheProto = grpc.loadPackageDefinition(ficheDefinition).fiche;

const app = express();
// Middleware pour parser le corps de la requête JSON
app.use(express.json());

// Clients gRPC
const joueurClient = new joueurProto.JoueurService('localhost:50051', grpc.credentials.createInsecure());
//const ficheClient = new ficheProto.FicheDeSanteService('localhost:50052', grpc.credentials.createInsecure());

// Serveur Apollo
const server = new ApolloServer({ typeDefs, resolvers });

/*server.start().then(() => {
  app.use(cors(), bodyParser.json(), expressMiddleware(server));
});*/

/**essai gql */
server.start().then(() => {
    app.use('/graphql', bodyParser.json(), expressMiddleware(server));
  });

// Routes REST Joueurs
app.get('/joueurs', (req, res) => {
  joueurClient.GetAllJoueurs({}, (err, response) => {
    if (err) return res.status(500).send(err);
    res.json(response.joueurs);
  });
});

app.get('/joueurs/:id', (req, res) => {
  const id = req.params.id;
  joueurClient.GetJoueur({ id }, (err, response) => {
    if (err) return res.status(500).send(err);
    res.json(response.joueur);
  });
});

//******************** integration de kafka     ********/
const { sendMessage } = require('./producer');
app.post('/joueurs', async (req, res) => {
    const { nom, prenom, age, fiche } = req.body;
  
    joueurClient.AddJoueur({ nom, prenom, age, fiche }, async (err, response) => {
      if (err) return res.status(500).send(err);
  
      const joueurData = response.joueur;
      await sendMessage('joueur1_topic', joueurData);
      res.status(201).json({ message: 'Joueur ajouté avec succès!!', data: joueurData });
    });
  });
  
 //************************************** */
  app.put('/joueurs/:id', (req, res) => {
    const id = req.params.id;
    const { nom, prenom, age, fiche } = req.body;
  
    joueurClient.UpdateJoueur({ id, nom, prenom, age, fiche }, (err, response) => {
      if (err) return res.status(500).send(err);
      res.json(response.joueur);
    });
  });

  app.delete('/joueurs/:id', (req, res) => {
    const joueur_id = req.params.id;
  
    joueurClient.DeleteJoueur({ joueur_id }, (err, response) => {
      if (err) return res.status(500).send(err);
      res.json(response);
    });
  });
    
const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway démarrée sur le port ${port}`);
});
