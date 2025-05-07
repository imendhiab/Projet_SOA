

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const joueurServiceImpl = require('./services/joueur');

const PROTO_PATH = './joueur.proto';
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
  server.addService(joueurPackage.JoueurService.service, joueurServiceImpl);  //JoueurService definit dans .proto
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('✅ Serveur gRPC en écoute sur 0.0.0.0:50051');
    server.start();
  });
}).catch(err => {
  console.error('❌ Erreur connexion MongoDB :', err);
});
