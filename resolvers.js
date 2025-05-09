const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Charger le proto de joueur
const joueurProtoPath = 'joueur.proto';
const joueurProtoDefinition = protoLoader.loadSync(joueurProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const joueurProto = grpc.loadPackageDefinition(joueurProtoDefinition).joueur;

// Création du client gRPC
const client = new joueurProto.JoueurService('localhost:50051', grpc.credentials.createInsecure());

const resolvers = {
  Query: {
    getAllJoueurs: () => {
      return new Promise((resolve, reject) => {
        client.GetAllJoueurs({}, (err, response) => {
          if (err) reject(err);
          else resolve(response.joueurs);
        });
      });
    },
    getJoueurById: (_, { id }) => {
      return new Promise((resolve, reject) => {
        client.GetJoueur({ joueur_id: id }, (err, response) => {
          if (err) reject(err);
          else resolve(response.joueur);
        });
      });
    },
  },

  Mutation: {
    addJoueur: (_, { id, nom, prenom, age, fiches }) => {
      return new Promise((resolve, reject) => {
        client.AddJoueur({ nom, prenom, age, fiche: fiches[0] }, (err, response) => {
          if (err) reject(err);
          else resolve(response.joueur);
        });
      });
    },

    updateJoueur: (_, { id, nom, prenom, age, fiches }) => {
      return new Promise((resolve, reject) => {
        client.UpdateJoueur({ id, nom, prenom, age, fiche: fiches ? fiches[0] : null }, (err, response) => {
          if (err) reject(err);
          else resolve(response.joueur);
        });
      });
    },

    deleteJoueur: (_, { id }) => {
      return new Promise((resolve, reject) => {
        client.DeleteJoueur({ joueur_id: id }, (err, response) => {
          if (err) reject(err);
          else resolve(response);
        });
      });
    },
  },
};

module.exports = resolvers;
