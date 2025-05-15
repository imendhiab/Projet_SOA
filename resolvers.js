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
        client.AddJoueur({ nom, prenom, age, fiche: Array.isArray(fiches) && fiches.length > 0 ? fiches[0] : null }, (err, response) => {
          if (err) 
            {reject(err);
          console.log("Réponse du gRPC:", response); // verifier grpc
            }
          else resolve(response.joueur);
        });
      });
    },

   /* updateJoueur: (_, { id, nom, prenom, age, fiches }) => {
    if (!id) {
    console.error("ID manquant pour updateJoueur !");
    throw new Error("ID obligatoire !");
  }
      return new Promise((resolve, reject) => {
        client.UpdateJoueur( { id, nom, prenom, age, ...(fiche ? { fiche } : {}) }, (err, response) => {
          if (err) 
            {
              reject(err);
              console.log("Réponse gRPC brute:", response);
            }
          else resolve(response.joueur);
        });
      });
    },*/
updateJoueur: (_, { id, nom, prenom, age, fiches }) => {
  if (!id) {
    throw new Error("ID obligatoire !");
  }

  let fiche = null;

  // ✅ Corriger la vérification null/undefined avant d'accéder à [0]
  if (fiches && Array.isArray(fiches) && fiches.length > 0 && fiches[0] != null) {
    fiche = { ...fiches[0] };

    if (!fiche.id) {
      throw new Error("La fiche doit contenir un champ 'id' valide");
    }

    if (fiche.date) {
      fiche.date = convertDateToTimestamp(fiche.date);
    }
  }

  const payload = {
    id,
    ...(nom !== undefined && { nom }),
    ...(prenom !== undefined && { prenom }),
    ...(age !== undefined && { age }),
    ...(fiche ? { fiche } : {}),
  };

  console.log("Payload envoyé à gRPC UpdateJoueur:", JSON.stringify(payload, null, 2));

  return new Promise((resolve, reject) => {
    client.UpdateJoueur(payload, (err, response) => {
      if (err) {
        console.error("Erreur gRPC updateJoueur:", err);
        reject(err);
      } else {
        resolve(response.joueur);
      }
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
