// WorkDetails.js
const Work = require('./Work');
const Provider = require('./Provider');
const Category = require('./Category');
const User = require('./User');
const Step = require('./Step');
const Task = require('./Task');

// Definisci le associazioni solo una volta in questo file
Work.belongsTo(Provider, { foreignKey: 'providerid', as: 'provider' });
Work.belongsTo(Category, { foreignKey: 'categoryid', as: 'category' });

Step.belongsTo(Work, { foreignKey: 'workid', as: 'work' });
Step.belongsTo(User, { foreignKey: 'userid', as: 'user' });

Task.belongsTo(Work, { foreignKey: 'workid', as: 'work' });

// Funzione per ottenere tutti i lavori con provider e categoria
const getWorksWithDetails = async () => {
  try {
    const works = await Work.findAll({
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['id', 'name'], // Include solo i campi necessari
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        }
      ]
    });
    return works;
  } catch (error) {
    console.error('Errore nel recupero dei dettagli dei lavori:', error);
    throw error;
  }
};

const getStepsWithDetails = async () => {
  try {
    const steps = await Step.findAll({
      include: [
        {
          model: Work,
          as: 'work',
          attributes: ['id', 'name'], // Include solo i campi necessari
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        }
      ]
    });
    return steps;
  } catch (error) {
    console.error('Errore nel recupero dei dettagli delle fasi:', error);
    throw error;
  }
};

const getTasksWithDetails = async () => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Work,
          as: 'work',
          attributes: ['id', 'name'], // Include solo i campi necessari
        },
      ]
    });
    return tasks;
  } catch (error) {
    console.error('Errore nel recupero dei dettagli delle fasi:', error);
    throw error;
  }
};

const getTasksForDashboard = async () => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['name'], // Include solo il nome del provider
        },
        {
          model: Category,
          as: 'category',
          attributes: ['color'], // Cambia 'color' con il campo appropriato
        },
        {
          model: Work,
          as: 'work',
          attributes: ['name'], // Include solo il nome del lavoro
        },
      ],
      attributes: ['id', 'completed'], // Aggiungi altri attributi se necessari
    });
    return tasks;
  } catch (error) {
    console.error('Errore nel recupero dei task per il dashboard:', error);
    throw error;
  }
};

module.exports = {
  getWorksWithDetails,
  getStepsWithDetails,
  getTasksWithDetails,
  getTasksForDashboard, // Esporta la nuova funzione
};
