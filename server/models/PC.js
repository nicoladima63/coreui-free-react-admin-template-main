const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const PC = sequelize.define('PC', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

// Sincronizza il modello con il database
const syncDatabase = async () => {
  await PC.sync();
};

syncDatabase();

module.exports = PC;