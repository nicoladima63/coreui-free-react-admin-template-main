// models/index.js
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

module.exports = {
  User,
  Message
};
