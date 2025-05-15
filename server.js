

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const joueurServiceImpl = require('./services/joueur');

const PROTO_PATH = './joueur.proto';


//***********IA******************* */
const PROTO_PATH2 = './analyse.proto';
const analyseProtoDef = protoLoader.loadSync(PROTO_PATH2, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const analyseServiceImpl = require('./microservice-analyse');

const analysepack= grpc.loadPackageDefinition(analyseProtoDef ).packageAnalyse;
//******************************************* */



const joueurProtoDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const joueurPackage = grpc.loadPackageDefinition(joueurProtoDef).joueur;

mongoose.connect('mongodb://localhost:27017/joueurs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  const server = new grpc.Server();
    // Ajouter le service joueur à gRPC
  server.addService(joueurPackage.JoueurService.service, joueurServiceImpl);  //JoueurService definit dans .proto

  // Ajouter le service IA à gRPC
server.addService(analysepack.ImageAnalysis.service, analyseServiceImpl );

  // Lancement de gRPC
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('✅ Serveur gRPC en écoute sur 0.0.0.0:50051');
    server.start();
  });
}).catch(err => {
  console.error('❌ Erreur connexion MongoDB :', err);
});
