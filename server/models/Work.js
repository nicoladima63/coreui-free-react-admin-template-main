const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Work = sequelize.define('Work', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  provider_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Work;
