// database.js
const { Sequelize } = require('sequelize');

// Crea una nuova connessione a SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/database.sqlite' // Specifica il percorso del file del database
});

// Funzione per testare la connessione
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

testConnection();

module.exports = sequelize;
