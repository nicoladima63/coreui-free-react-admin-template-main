import axios from 'axios';

const API_URL = 'http://localhost:5000/api/';

export async function checkForData() {
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

    // Esegue i controlli in sequenza
    for (const { name, check } of checks) {
      const exists = await check();
      if (!exists) {
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
      canCreateTasks: missingSteps.length === 0
    };
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    throw error;
  }
}

async function checkUsers() {
  try {
    const response = await axios.get(`${API_URL}users`);
    const users = response.data;

    return Array.isArray(users) && users.length > 0;
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error);
    return false; // In caso di errore, restituisci false
  }
}

async function checkProviders() {
  try {
    const response = await axios.get(`${API_URL}providers`);
    const providers = response.data;

    return Array.isArray(providers) && providers.length > 0;
  } catch (error) {
    console.error("Errore nel recupero dei provider:", error);
    return false;
  }
}

async function checkCategories() {
  try {
    const response = await axios.get(`${API_URL}categories`);
    const categories = response.data;

    return Array.isArray(categories) && categories.length > 0;
  } catch (error) {
    console.error("Errore nel recupero delle categorie:", error);
    return false;
  }
}

async function checkWorks() {
  try {
    const response = await axios.get(`${API_URL}works`);
    const works = response.data;

    return Array.isArray(works) && works.length > 0;
  } catch (error) {
    console.error("Errore nel recupero dei lavori:", error);
    return false;
  }
}

async function checkSteps() {
  try {
    const response = await axios.get(`${API_URL}steps`);
    const steps = response.data;

    return Array.isArray(steps) && steps.length > 0;
  } catch (error) {
    console.error("Errore nel recupero degli step:", error);
    return false;
  }
}
