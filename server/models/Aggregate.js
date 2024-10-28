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
    console.error('Errore nel recupero dei task con dettagli:', error);
    throw error;
  }
};
const getTasksForDashboard = async () => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Work,
          as: 'work',
          attributes: ['id', 'name'],
          include: [
            {
              model: Provider,
              as: 'provider',
              attributes: ['id', 'name', 'email', 'phone']
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'color']
            }
          ]
        }
      ]
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
