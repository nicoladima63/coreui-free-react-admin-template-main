// models/PushSubscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');

const PushSubscription = sequelize.define('PushSubscription', {
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  keys: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  // Rimuoviamo userId da qui perché verrà aggiunto automaticamente da Sequelize
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastUsed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});

// Definiamo la relazione. Sequelize aggiungerà automaticamente UserId
PushSubscription.belongsTo(User);
User.hasMany(PushSubscription);

const syncDatabase = async () => {
  try {
    await PushSubscription.sync();
    console.log('PushSubscription table created successfully');
  } catch (error) {
    console.error('Error creating PushSubscription table:', error);
  }
};

syncDatabase();

module.exports = PushSubscription;
