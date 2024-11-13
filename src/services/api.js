// services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Prima aggiungiamo il token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Poi logghiamo la configurazione completa incluso il token
apiClient.interceptors.request.use(
  (config) => {
    //console.log('Request Config:', {
    //  url: config.url,
    //  method: config.method,
    //  headers: config.headers,
    //  baseURL: config.baseURL,
    //});
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor con logging migliorato
apiClient.interceptors.response.use(
  (response) => {
    //console.log('Response Success:', {
    //  url: response.config.url,
    //  status: response.status,
    //  data: response.data,
    //});
    return response.data;
  },
  async (error) => {
    //console.error('Response Error:', {
    //  url: error.config?.url,
    //  status: error.response?.status,
    //  data: error.response?.data,
    //  message: error.message,
    //});

    // Gestione refresh token
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const newToken = await refreshAuthToken(refreshToken);
        localStorage.setItem('token', newToken);
        apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Refresh Token Error:', refreshError);
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
    const response = await apiClient.patch(`/steps/${stepid}`, { completed });
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

//export const TodoService2 = {
//  getTodos: () => apiClient.get('/todos'),
//  getTodosSent: () => apiClient.get('/todos/sent'),
//  getTodosReceived: () => apiClient.get('/todos/received'),
//  getTodo: (id) => apiClient.get(`/todos/${id}`),
//  createTodo: (data) => apiClient.post('/todos', data),
//  updateTodo: (id, data) => apiClient.put(`/todos/${id}`, data),
//  deleteTodo: (id) => apiClient.delete(`/todos/${id}`),
//  markAsRead: (id) => apiClient.patch(`/todos/${id}/read`),
//};

export const TodoService3 = {
  getTodos: () => apiClient.get('/todos'),
  getTodosSent: async () => {
    try {
      const response = await apiClient.get('/todos/sent');
      return response;
    } catch (error) {
      console.error('Error fetching sent todos:', error.response?.data || error.message);
      throw error;
    }
  },
  getTodosReceived: async () => {
    try {
      const response = await apiClient.get('/todos/received');
      return response;
    } catch (error) {
      console.error('Error fetching received todos:', error.response?.data || error.message);
      throw error;
    }
  },
  updateTodoStatus: async ({ id, status }) => {
    try {
      const response = await apiClient.patch(`/todos/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating todo status:', error.response?.data || error.message);
      throw error;
    }
  }
};

export const TodoService = {
  getTodos: () => apiClient.get('/todos'),
  getTodosSent: async () => {
    try {
      const response = await apiClient.get('/todos/sent');
      return response;
    } catch (error) {
      console.error('Error fetching sent todos:', error.response?.data || error.message);
      throw error;
    }
  },
  getTodosReceived: async () => {
    try {
      const response = await apiClient.get('/todos/received');
      return response;
    } catch (error) {
      console.error('Error fetching received todos:', error.response?.data || error.message);
      throw error;
    }
  },
  createTodo: (data) => apiClient.post('/todos', data),
  updateTodoStatus: async ({ id, status }) => {
    try {
      const response = await apiClient.patch(`/todos/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating todo status:', error.response?.data || error.message);
      throw error;
    }
  },
  markAsRead: (id) => apiClient.patch(`/todos/${id}/read`)
};
