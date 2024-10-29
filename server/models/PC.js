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
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastOnline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Sincronizza il modello con il database
const syncDatabase = async () => {
  await PC.sync();
};

syncDatabase();

module.exports = PC;
