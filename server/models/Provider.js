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
});

const syncDatabase = async () => {
  await Provider.sync();
};

syncDatabase();


module.exports = Provider;
