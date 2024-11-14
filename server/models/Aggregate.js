const { Op } = require('sequelize');
const Work = require('./Work');
const Provider = require('./Provider');
const Category = require('./Category');
const User = require('./User');
const Step = require('./Step');
const StepTemp = require('./StepTemp');
const Task = require('./Task');

// Definisci le associazioni solo una volta in questo file
Work.belongsTo(Provider, { foreignKey: 'providerid', as: 'provider' });
Work.belongsTo(Category, { foreignKey: 'categoryid', as: 'category' });
Work.hasMany(StepTemp, { foreignKey: 'workid', as: 'stepstemp' });

Step.belongsTo(User, { foreignKey: 'userid', as: 'user' });
Step.belongsTo(Task, { foreignKey: 'taskid', as: 'task' }); // Un step appartiene a un task
StepTemp.belongsTo(User, { foreignKey: 'userid', as: 'user' });

Task.belongsTo(Work, { foreignKey: 'workid', as: 'work' });
Task.hasMany(Step, { foreignKey: 'taskid', as: 'steps' }); // Un task pu� avere molti step


// Funzione per ottenere tutti i lavori con provider e categoria
const getWorksWithDetails = async ({ page = 1, limit = 10, search = '', sort = 'id', order = 'ASC', categoryid, providerid }) => {
  try {
    let whereClause = {};

    // Gestione ricerca
    if (search) {
      whereClause = {
        ...whereClause,
        name: {
          [Op.like]: `%${search}%`
        }
      };
    }

    // Filtri per categoria e provider
    if (categoryid) whereClause.categoryid = categoryid;
    if (providerid) whereClause.providerid = providerid;

    // Calcola offset per la paginazione
    const offset = (page - 1) * limit;

    // Query principale con paginazione e filtri
    const { rows: works, count: total } = await Work.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['id', 'name'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color'],
        }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: offset
    });

    // Calcola il numero totale di pagine
    const totalPages = Math.ceil(total / limit);

    return {
      works,
      metadata: {
        total,
        pages: totalPages,
        currentPage: page,
        perPage: limit
      }
    };
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

const getStepsForWork = async (workid) => {
  console.log('workid:', workid);
  try {
    const stepstemp = await StepTemp.findAll({
      where: { workid },  // Filtra in base al parametro workid
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        }
      ]
    });
    return stepstemp;
  } catch (error) {
    //console.error('Errore nel recupero dei dettagli delle fasi:', error);
    console.error('Errore nel recupero dei dettagli delle fasi:', error.message, error.stack);

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
  getStepsForWork,
};
