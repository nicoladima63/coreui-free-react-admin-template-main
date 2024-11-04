const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Task = sequelize.define('Task', {
  patient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Work',
      key: 'id'
    }
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});



module.exports = Task;
