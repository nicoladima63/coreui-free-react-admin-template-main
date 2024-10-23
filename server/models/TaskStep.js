const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Step = sequelize.define('Step', {
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
  await Step.sync();
};

syncDatabase();


module.exports = Step;
