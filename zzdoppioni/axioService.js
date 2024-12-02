// axiosService.js
import axios from 'axios';
import { getCurrentConfig } from './config/environment';

// Ottieni la configurazione corrente
const { apiBaseUrl } = getCurrentConfig();
console.log('axioservice apiBaseUrl: ',apiBaseUrl)
// Crea un'istanza di Axios con configurazione di base
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere automaticamente il token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper per gestire gli errori
const handleError = (error, message) => {
  console.error(message, error);
  throw new Error(message);
};

// Elenco dei controller
const task = {
  getTasks: async () => {
    try {
      const response = await api.get('/api/tasks');
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero dei task.');
    }
  },

  // Nuovo metodo per ottenere i task per il dashboard
  getTasksForDashboard: async () => {
    try {
      const response = await api.get('/api/aggregate/dashboard'); // Assicurati che l'endpoint corrisponda al tuo backend
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero dei task per il dashboard.');
    }
  },
};

const user = {
  getUsers: async () => {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero degli utenti.');
    }
  },
};

const category = {
  getCategories: async () => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero delle categorie.');
    }
  },
};

const step = {
  getSteps: async () => {
    try {
      const response = await api.get('/api/steps');
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero degli step.');
    }
  },

  // Correzione: aggiunta del parametro taskId
  getStepsForWork: async (workid) => {

    try {
      const response = await api.get(`/api/aggregate/stepstemp?workid=${workid}`);
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero degli step per il task specificato.');
    }
  },
  getStepsForTask: async (taskid) => {
    try {
      const response = await api.get(`/api/steps?taskid=${taskid}`);
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero degli step per il task specificato.');
    }
  },
};
const work = {
  getWorks: async () => {
    try {
      const response = await api.get('/api/works');
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero dei lavori.');
    }
  },
};

const provider = {
  getProviders: async () => {
    try {
      const response = await api.get('/api/providers');
      return response.data;
    } catch (error) {
      handleError(error, 'Errore nel recupero dei fornitori.');
    }
  },
};

// Esporta tutti i controller che centralizzano le API
export { api, work, task, user, category, step, provider, };
