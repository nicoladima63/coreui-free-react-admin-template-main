const sequelize = require('../database'); // Importa sequelize dall'istanza di database
const { DataTypes } = require('sequelize');

// Definizione dei modelli
const User = require('./User');
const Message = require('./Message');

// Definisci le relazioni
User.hasMany(Message, {
  as: 'sentMessages',
  foreignKey: 'fromId'
});

User.hasMany(Message, {
  as: 'receivedMessages',
  foreignKey: 'toId'
});

Message.belongsTo(User, {
  as: 'sender',
  foreignKey: 'fromId'
});

Message.belongsTo(User, {
  as: 'recipient',
  foreignKey: 'toId'
});

// Esporta i modelli e sequelize
module.exports = {
  sequelize, // Esportiamo sequelize per altri usi
  User,
  Message
};
