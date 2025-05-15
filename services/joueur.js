// joueurMicroservice.js
const Joueur = require('../models/joueur_model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

//const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb');

function timestampToDate(ts) {
    return new Date(ts.seconds * 1000);
  }

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// Charger le fichier joueur.proto
const joueurProtoPath = 'joueur.proto';
const joueurProtoDefinition = protoLoader.loadSync(joueurProtoPath, {
keepCase: true,
longs: String,
enums: String,
defaults: true,
oneofs: true,
});

const joueurProto = grpc.loadPackageDefinition(joueurProtoDefinition).joueur; //package du .proto

// Implémenter le service joueur

module.exports = {

  //Ajouter un nouveau joueur
  AddJoueur: async (call, callback) => {
    try {
      const data = call.request;
      const joueur = new Joueur({
        //id:data.id,
        nom: data.nom,
        prenom: data.prenom,
        age: data.age,
        fiche:[ {
          //id:data.fiche.id,
          date: timestampToDate(data.fiche.date),
          tension: data.fiche.tension,
          oxy: data.fiche.oxy
        }]
      });
      const saved = await joueur.save();
      callback(null, { joueur: { ...saved.toObject(), id: saved._id.toString() } });
    } catch (err) {
      callback(err);
    }
  },

  //Récupérer un joueur via son id
  GetJoueur: async (call, callback) => {
    try {
      
   
  const { joueur_id } = call.request;
console.log("📥 Reçu pour MAJ:", call.request);

      if (!ObjectId.isValid(joueur_id)) {
        return callback({ code: 3, message: "ID invalide" });
      }
      const objectId = new ObjectId(joueur_id);
      const joueur = await Joueur.findOne({ _id: objectId });
      if (!joueur) {
        return callback({ code: 5, message: "Joueur non trouvé" });
      }
      callback(null, { joueur });
    } catch (err) {
      callback(err);
    }
  },

  //Récupérer tous les joueurs 
  GetAllJoueurs: async (call, callback) => {
    try {
      const joueurs = await Joueur.find(); // Récupère tous les joueurs
      callback(null, { joueurs }); // Retourne tous les joueurs dans la réponse
    } catch (err) {
      callback(err);
    }
  },

   //Mettre à jour un joueur
   UpdateJoueur: async (call, callback) => {
    try {
      const data = call.request;
      // Convertir l'ID du joueur en ObjectId si c'est une chaîne
      //const joueurId = data.id;  // Conversion ici
      const joueur = await Joueur.findOneAndUpdate(
        { _id: data.id
      },
        {
          $set: {
            nom: data.nom,
            prenom: data.prenom,
            age: data.age
          },
          $push: {
            fiche: {
              id: data.fiche.id,
              date: timestampToDate(data.fiche.date),
              tension: data.fiche.tension,
              oxy: data.fiche.oxy
            }
          }
        },
        { new: true }
      );
  
      if (!joueur) {
        return callback({ code: 5, message: "Joueur non trouvé" });
      }
  
      callback(null, { joueur });
    } catch (err) {
      callback(err);
    }
  },
  
   //suppression d'un joueur
   DeleteJoueur: async (call, callback) => {
    try {
      const { joueur_id } = call.request;
console.log("📥 Reçu pour suppression:", call.request);
      if (!ObjectId.isValid(joueur_id)) {
        return callback({ code: 3, message: "ID invalide" });
      }

      const objectId = new ObjectId(joueur_id);
      const joueur = await Joueur.findOne({ _id: objectId });

      if (!joueur) {
        return callback({ code: 5, message: "Joueur non trouvé!" });
      }

      await Joueur.deleteOne({ _id: objectId });
      callback(null, { success: true, message: "Joueur supprimé avec succès" });
    } catch (err) {
          console.error("❌ Erreur pendant la suppression:", err);  // <-- Ajout ici

      callback({ code: 13, message: "Erreur serveur" });
    }
  }
};





