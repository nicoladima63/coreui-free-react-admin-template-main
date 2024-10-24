// prerequisites.js
const User = require('../models/User');
const Provider = require('../models/Provider');
const Category = require('../models/Category');
const Work = require('../models/Work');
const Step = require('../models/Step');

/**
 * Controlla la presenza di tutti i prerequisiti necessari nel database
 * @returns {Promise<{
 *   success: boolean,
 *   missingSteps: string[],
 *   firstMissingStep: string | null,
 *   canCreateTasks: boolean,
 *   details: Object
 * }>}
 */
export async function checkPrerequisites() {
  try {
    // Array dei controlli da effettuare in ordine
    const checks = [
      { name: 'user', check: checkUsers },
      { name: 'provider', check: checkProviders },
      { name: 'category', check: checkCategories },
      { name: 'work', check: checkWorks },
      { name: 'step', check: checkSteps }
    ];

    const missingSteps = [];
    let firstMissingStep = null;
    const details = {};

    // Esegue i controlli in sequenza
    for (const { name, check } of checks) {
      const result = await check();
      details[name] = result;
      console.log(name, result);
      if (!result.exists) {
        missingSteps.push(name);
        if (firstMissingStep === null) {
          firstMissingStep = name;
        }
      }
    }
    return {
      success: missingSteps.length === 0,
      missingSteps,
      firstMissingStep,
      canCreateTasks: missingSteps.length === 0,
      details
    };
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    throw error;
  }
}

/**
 * Verifica se esistono utenti nel sistema
 * @returns {Promise<{exists: boolean, count: number, error: string|null}>}
 */
async function checkUsers() {
  try {
    const count = await User.count();
    return {
      exists: count > 0,
      count,
      error: null
    };
  } catch (error) {
    console.error('Error checking users:', error);
    return {
      exists: false,
      count: 0,
      error: 'Errore nel controllo degli utenti'
    };
  }
}

/**
 * Verifica se esistono provider nel sistema
 * @returns {Promise<{exists: boolean, count: number, error: string|null}>}
 */
async function checkProviders() {
  try {
    const count = await Provider.count();
    return {
      exists: count > 0,
      count,
      error: null
    };
  } catch (error) {
    console.error('Error checking providers:', error);
    return {
      exists: false,
      count: 0,
      error: 'Errore nel controllo dei provider'
    };
  }
}

/**
 * Verifica se esistono categorie nel sistema
 * @returns {Promise<{exists: boolean, count: number, error: string|null}>}
 */
async function checkCategories() {
  try {
    const count = await Category.count();
    return {
      exists: count > 0,
      count,
      error: null
    };
  } catch (error) {
    console.error('Error checking categories:', error);
    return {
      exists: false,
      count: 0,
      error: 'Errore nel controllo delle categorie'
    };
  }
}

/**
 * Verifica se esistono lavori nel sistema
 * @returns {Promise<{exists: boolean, count: number, hasValidRelations: boolean, error: string|null}>}
 */
async function checkWorks() {
  try {
    // Controlla il numero totale di lavori
    const count = await Work.count();

    // Controlla che i lavori abbiano relazioni valide con provider e categorie
    const validWorks = await Work.count({
      include: [
        {
          model: Provider,
          required: true
        },
        {
          model: Category,
          required: true
        }
      ]
    });

    return {
      exists: count > 0,
      count,
      hasValidRelations: validWorks === count,
      error: null
    };
  } catch (error) {
    console.error('Error checking works:', error);
    return {
      exists: false,
      count: 0,
      hasValidRelations: false,
      error: 'Errore nel controllo dei lavori'
    };
  }
}

/**
 * Verifica se esistono step nel sistema
 * @returns {Promise<{exists: boolean, count: number, hasValidRelations: boolean, error: string|null}>}
 */
async function checkSteps() {
  try {
    // Controlla il numero totale di step
    const count = await Step.count();

    // Controlla che gli step abbiano relazioni valide con i lavori
    const validSteps = await Step.count({
      include: [
        {
          model: Work,
          required: true
        }
      ]
    });

    return {
      exists: count > 0,
      count,
      hasValidRelations: validSteps === count,
      error: null
    };
  } catch (error) {
    console.error('Error checking steps:', error);
    return {
      exists: false,
      count: 0,
      hasValidRelations: false,
      error: 'Errore nel controllo degli step'
    };
  }
}

module.exports = {
  checkPrerequisites,
  checkUsers,
  checkProviders,
  checkCategories,
  checkWorks,
  checkSteps
};
