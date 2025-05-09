const { gql } = require('@apollo/server');
// Définir le schéma GraphQL
const typeDefs = `#graphql

scalar Date

type Fiche {
  id: ID!
  date: Date!
  tension: Float!
  oxy: Float!
}

type Joueur {
  id: ID!
  nom: String!
  prenom: String!
  age: Int!
  fiches: [Fiche!]!
}

type Query {
  getAllJoueurs: [Joueur!]!
  getJoueurById(id: ID!): Joueur
}

type Mutation {
  addJoueur(
    id: ID!
    nom: String!
    prenom: String!
    age: Int!
    fiches: [FicheInputFields!]!
  ): Joueur!

  updateJoueur(
    id: ID!
    nom: String
    prenom: String
    age: Int
    fiches: [FicheInputFields!]
  ): Joueur!

  deleteJoueur(id: ID!): DeleteResponse!
}

# Définition des champs nécessaires pour créer ou modifier une fiche
type DeleteResponse {
  success: Boolean!
  message: String!
}

# Hack : GraphQL ne permet pas de passer un tableau d'objets complexes sans input, sauf avec ce type spécial utilisé uniquement dans les paramètres
input FicheInputFields {
  id: ID!
  date: Date!
  tension: Float!
  oxy: Float!
}
`;
module.exports = typeDefs