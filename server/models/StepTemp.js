const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const StepTemp = sequelize.define('StepTemp', {
  workid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
});

const syncDatabase = async () => {
  await StepTemp.sync();
};

syncDatabase();


module.exports = StepTemp;
