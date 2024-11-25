// config/environment.js
const getEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

const config = {
  development: {
    apiUrl: import.meta.env.VITE_API_URL_DEVELOPMENT || 'http://localhost:5000',
    wsUrl: 'ws://localhost:5000',
    apiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api'
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL_PRODUCTION || 'http://192.168.1.200:5000',
    wsUrl: 'ws://192.168.1.200:5000',
    apiBaseUrl: 'http://192.168.1.200:5000/api'
  }
};

export const getCurrentConfig = () => config[getEnvironment()];

export const getWsUrl = () => {
  const { wsUrl } = getCurrentConfig();
  return wsUrl;
};
