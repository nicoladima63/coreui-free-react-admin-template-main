const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const TaskStep = sequelize.define('TaskStep', {
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  step_description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  assigned_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
});

module.exports = TaskStep;
