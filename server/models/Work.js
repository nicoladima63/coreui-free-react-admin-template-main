const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Work = sequelize.define('Work', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  providerid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Provider',
      key: 'id'
    }
  },
  categoryid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Category',
      key: 'id'
    }
  },
});

const syncDatabase = async () => {
  await Work.sync();
};

syncDatabase();


module.exports = Work;
