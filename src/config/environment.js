// config/environment.js

// Determina l'ambiente attuale
const getEnvironment = () => {
  return import.meta.env.MODE || 'development'; // Usa 'development' come fallback
};

// Configurazione per gli ambienti
const config = {
  development: {
    apiUrl: 'http://localhost:5000',
    wsUrl: 'ws://localhost:5000',
    apiBaseUrl: 'http://localhost:5000/api',
  },
  production: {
    apiUrl: 'http://192.168.1.200:5000',
    wsUrl: 'ws://192.168.1.200:5000',
    apiBaseUrl: 'http://192.168.1.200:5000/api',
  },
};

// Esporta la configurazione dell'ambiente attuale
export const getCurrentConfig = () => config[getEnvironment()];

// Esempio di esportazione specifica (opzionale)
export const getWsUrl = () => {
  const { wsUrl } = getCurrentConfig();
  return wsUrl;
};
