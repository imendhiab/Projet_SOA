// apiGateway.js
//const { gql } = require('@apollo/server');

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
//const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const axios = require('axios');
//*****************Ajout import IA********************
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const FormData = require('form-data');
const PROTO_PATH = './analyse.proto';
const { Readable } = require('stream');
const stream = require('stream');

// Chargement des fichiers proto
const joueurProtoPath = './joueur.proto';
//const ficheProtoPath = './proto/ficheDeSante.proto';
//essai graphql
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




//********************* */ Charger le fichier .proto de lIA
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition).packageAnalyse;


//********************* */ Créer un client gRPC IA
const client = new proto.ImageAnalysis('microservice-analyse:50051', grpc.credentials.createInsecure());


const joueurProto = grpc.loadPackageDefinition(joueurDefinition).joueur;
//const ficheProto = grpc.loadPackageDefinition(ficheDefinition).fiche;

const app = express();
// Middleware pour parser le corps de la requête JSON
app.use(express.json());

//********cors pour front */
const cors = require('cors');
app.use(cors());

// Clients gRPC
const joueurClient = new joueurProto.JoueurService('localhost:50051', grpc.credentials.createInsecure());


// Serveur Apollo
const server = new ApolloServer({ typeDefs, resolvers });

/*server.start().then(() => {
  app.use(cors(), bodyParser.json(), expressMiddleware(server));
});*/

//essai gql 
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
  joueurClient.GetJoueur({ joueur_id:id}, (err, response) => {
    if (err) return res.status(500).send(err);
    res.json(response.joueur);
  });
});

//******************** integration de kafka dans les CRUD    ********/
const { sendMessage } = require('./producer');
const { ok }=require('assert');
app.post('/joueurs', async (req, res) => {
    const { nom, prenom, age, fiche } = req.body;
  
    joueurClient.AddJoueur({ nom, prenom, age, fiche }, async (err, response) => {
      if (err) return res.status(500).send(err);
  
      const joueurData = response.joueur;
      await sendMessage('joueur3_topic', 'notre message kafka');
      res.status(201).json({ message: 'Joueur ajouté avec succès!!', data: joueurData });
    });
  });
  


  app.put('/joueurs/:id', (req, res) => {
    const id = req.params.id;
    const { nom, prenom, age, fiche } = req.body;
  
    joueurClient.UpdateJoueur({ id, nom, prenom, age, fiche }, async(err, response) => {
      if (err) return res.status(500).send(err);
// Si la mise à jour réussie, on envoie un message Kafka
    const message = {
      type: 'joueur_updated',
      joueur_id: id,
      nom: response.joueur.nom,
      prenom: response.joueur.prenom,
      timestamp: new Date().toISOString(),
    };

    try {
      // Envoi du message Kafka pour signaler la mise à jour
      await sendMessage('joueur3_topic', message);
      console.log('Kafka envoyé pour la mise à jour du joueur:', message);
    } catch (kafkaErr) {
      console.error('Erreur Kafka (non bloquante) :', kafkaErr);
    }

    // Répondre avec la réponse du service gRPC
    res.json(response.joueur);
  });
});

  app.delete('/joueurs/:id', (req, res) => {
    const joueur_id = req.params.id;
  
    joueurClient.DeleteJoueur({ joueur_id }, async(err, response) => {
      if (err) return res.status(500).send(err);
     // Si la suppression réussie, on envoie un message Kafka
      if (response.success) {
        const message = {
          type: 'joueur_deleted',
          joueur_id: joueur_id,
          timestamp: new Date().toISOString(),
        };
  
        try {
          // Envoi du message Kafka pour signaler la suppression
          await sendMessage('joueur3_topic', message);
          //console.log('Message Kafka envoyé pour la suppression du joueur:', message);
        } catch (kafkaErr) {
          console.error('Erreur Kafka (non bloquante) :', kafkaErr);
        }
      }
  
      res.json(response);
    });
  });
    

//**************************** Debut IA***************************** */
// Route d'analyse d'image
/*app.post('/api/joueurs/analyse', upload.single('image'), async (req, res) => {
  try {
    // Lire l'image depuis le chemin du fichier uploadé
    const imageBuffer = fs.readFileSync(req.file.path);

    // Appel au microservice via gRPC
    client.AnalyserImage({ image: imageBuffer }, (error, response) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erreur lors de l’analyse de l’image' });
      }

      // Retourner la prédiction au client
      res.json({ prediction: response.prediction });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l’analyse de l’image' });
  }
});*/

app.post("/api/joueurs/analyse", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Fichier image manquant" });
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const form = new FormData();
    form.append("image", bufferStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const length = await new Promise((resolve, reject) => {
      form.getLength((err, length) => {
        if (err) reject(err);
        else resolve(length);
      });
    });

    const response = await axios.post("http://localhost:5000/predict", form, {
      headers: {
        ...form.getHeaders(),
        "Content-Length": length,
      },
    });

    res.json(response.data);
  } catch (error) {
  console.error("Erreur dans la gateway :", error);
  console.error(error.response?.data || error.message);
  res.status(500).json({ error: "Erreur dans la gateway", details: error.message });
}

});
//*************************fin analyse image****************/


//************************* ollama ***************************/
app.post('/joueurs/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Champ `message` requis.' });
  }

  try {
    const prompt = `You answer only questions about best players. Always in short bullet points.\nUser: ${message}`;

    const ollamaResp = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2:7b',
      prompt: prompt,
      stream: false,
      max_tokens: 256
    });

    const answer = ollamaResp.data.response ?? '';
    return res.json({ answer });

  } catch (err) {
    console.error('Erreur Ollama →', err.message);
    return res.status(502).json({ error: 'Impossible de joindre le service Ollama.' });
  }
});


//**********************************Fin Ollama **********************************/
const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway démarrée sur le port ${port}`);
});
