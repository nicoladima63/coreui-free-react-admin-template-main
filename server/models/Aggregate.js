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

Step.belongsTo(User, { foreignKey: 'userid', as: 'user' });

Task.hasMany(Step, { foreignKey: 'taskid', as: 'steps' }); // Un task può avere molti step
Step.belongsTo(Task, { foreignKey: 'taskid', as: 'task' }); // Un step appartiene a un task

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

const getTasksForDashboard2 = async () => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Work,
          as: 'work',
          attributes: ['id', 'name'], // Attributi di Work
          include: [
            {
              model: Provider,
              as: 'provider',
              attributes: ['id', 'name'], // Attributi di Provider
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'color'], // Attributi di Category
            }
          ]
        },
        {
          model: Step,
          as: 'step',
          attributes: ['id', 'name'], // Attributi di Step
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'], // Attributi di User
            }
          ]
        }
      ],
      //attributes: ['id', 'deliveryDate','completed'], // Attributi di Task
    });
    return tasks;
  } catch (error) {
    console.error('Errore nel recupero dei task per il dashboard:', error);
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
          attributes: ['id', 'name'], // Attributi di Work
          include: [
            {
              model: Provider,
              as: 'provider',
              attributes: ['id', 'name'], // Attributi di Provider
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'color'], // Attributi di Category
            }
          ]
        },
        {
          model: Step,
          as: 'steps', // Usa 'steps' qui per la relazione
          attributes: ['id', 'name', 'completed'], // Attributi di Step
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'], // Attributi di User
            }
          ]
        }
      ],
      // attributes: ['id', 'deliveryDate', 'completed'], // Attributi di Task
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
  getTasksForDashboard,
};
