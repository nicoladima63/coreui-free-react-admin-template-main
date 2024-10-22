const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Provider = sequelize.define('Provider', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = Provider;
