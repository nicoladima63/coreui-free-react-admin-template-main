// services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token a tutte le richieste
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const newToken = await refreshAuthToken(refreshToken); // Implementare questa funzione
        localStorage.setItem('token', newToken);
        apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    const customError = new Error(
      error.response?.data?.message || 'Si è verificato un errore'
    );
    customError.code = error.response?.status;
    customError.data = error.response?.data;
    throw customError;
  }
);

// Funzione per gestire il refresh del token (da implementare lato backend)
async function refreshAuthToken(refreshToken) {
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });
  return response.data.token;
}


// Interceptor per gestire gli errori
//apiClient.interceptors.response.use(
//  (response) => response.data,
//  (error) => {
//    const customError = new Error(
//      error.response?.data?.message || 'Si è verificato un errore'
//    );
//    customError.code = error.response?.status;
//    customError.data = error.response?.data;
//    throw customError;
//  }
//);

// Servizio per gestire i tasks
export const TasksService = {
  getTasksForDashboard: () => apiClient.get('/aggregate/dashboard'),
  getTasks: () => apiClient.get('/tasks'),
  getTask: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (data) => apiClient.post('/tasks', data),
  updateTask: (id, data) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
};

// Servizio per gestire i works
export const WorksService = {
  getWorks: () => apiClient.get('/aggregate/works'),
  getWork: (id) => apiClient.get(`/works/${id}`),
  createWork: (data) => apiClient.post('/works', data),
  updateWork: (id, data) => apiClient.put(`/works/${id}`, data),
  deleteWork: (id) => apiClient.delete(`/works/${id}`),
};

// Servizio per gestire i steps
export const StepsService = {
  getStepsForTask: (taskid) => apiClient.get(`/aggregate/steps?taskid=${taskid}`),
  getStep: (id) => apiClient.get(`/steps/${id}`),
  createStep: (data) => apiClient.post('/steps', data),
  updateStep: (id, data) => apiClient.put(`/steps/${id}`, data),
  deleteStep: (id) => apiClient.delete(`/steps/${id}`),
  updateStepStatus: async (stepId, completed) => {
    const response = await apiClient.patch(`/steps/${stepId}`, { completed });
    return response.data;
  },

};

export const StepsTempService = {
  getStepsForWork: (workId) => apiClient.get(`/aggregate/stepstemp?workid=${workId}`),
  getStep: (id) => apiClient.get(`/stepstemp/${id}`),
  createStep: (data) => apiClient.post('/stepstemp', data),
  updateStep: (id, data) => apiClient.put(`/stepstemp/${id}`, data),
  deleteStep: (id) => apiClient.delete(`/stepstemp/${id}`),
};

// Servizio per gestire le categories
export const CategoriesService = {
  getCategories: () => apiClient.get('/categories'),
  getCategory: (id) => apiClient.get(`/categories/${id}`),
  createCategory: (data) => apiClient.post('/categories', data),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
};

// Servizio per gestire gli users
export const UsersService = {
  getUsers: () => apiClient.get('/users'),
  getUser: (id) => apiClient.get(`/users/${id}`),
  createUser: (data) => apiClient.post('/users', data),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

// Servizio per gestire i providers
export const ProvidersService = {
  getProviders: () => apiClient.get('/providers'),
  getProvider: (id) => apiClient.get(`/providers/${id}`),
  createProvider: (data) => apiClient.post('/providers', data),
  updateProvider: (id, data) => apiClient.put(`/providers/${id}`, data),
  deleteProvider: (id) => apiClient.delete(`/providers/${id}`),
};

// Servizio per gestire i pc
export const PCService = {
  getPCs: () => apiClient.get('/pcs'),
  getPc: (id) => apiClient.get(`/pcs/${id}`),
  createPc: (data) => apiClient.post('/pcs', data),
  updatePc: (id, data) => apiClient.put(`/pcs/${id}`, data),
  deletePc: (id) => apiClient.delete(`/pcs/${id}`),
};

export const MessageService = {
  getMessages: (userId) => apiClient.get(`/messages`),
  getMessagesForUser: (userId) => apiClient.get(`/messages/${userId}`),
  markAsRead: (messageId) => apiClient.patch(`/messages/${messageId}/read`),
};

export const TodoService = {
  getTodos: () => apiClient.get('/todos'),
  getTodosSent: () => apiClient.get('/todos/sent'),
  getTodosReceived: () => apiClient.get('/todos/received'),
  getTodo: (id) => apiClient.get(`/todos/${id}`),
  createTodo: (data) => apiClient.post('/todos', data),
  updateTodo: (id, data) => apiClient.put(`/todos/${id}`, data),
  deleteTodo: (id) => apiClient.delete(`/todos/${id}`),
  markAsRead: (id) => apiClient.patch(`/todos/${id}/read`),
};
