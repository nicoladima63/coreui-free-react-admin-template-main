const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Task = sequelize.define('Task', {
  work_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  patient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pc_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assigned_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Inserito',
  }
});

module.exports = Task;
