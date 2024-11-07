module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './db/database.sqlite'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:' // Utilizzo di un database in memoria per i test
  },
  production: {
    dialect: 'sqlite',
    storage: './db/database.sqlite'
  }
};
