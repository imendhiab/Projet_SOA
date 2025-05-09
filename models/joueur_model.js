const mongoose = require('mongoose');

const ficheSchema = new mongoose.Schema({
  id: String,
  date: Date,
  tension: Number,
  oxy: Number
});

const joueurSchema = new mongoose.Schema({
  id: String,  
  nom: String,
  prenom: String,
  age: Number,
  fiche: [ficheSchema]
});

module.exports = mongoose.model('Joueur', joueurSchema);
