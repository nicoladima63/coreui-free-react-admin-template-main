// services/api.js
import axiosRetry from 'axios-retry';
import { backOff } from 'exponential-backoff';
import axios from 'axios';
import { getCurrentConfig } from '../config/environment';

// Ottieni la configurazione corrente
const { apiBaseUrl } = getCurrentConfig();

// Crea un'istanza di Axios con configurazione di base
const apiClient = axios.create({
  baseURL: apiBaseUrl,
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

// Configura retry per axios
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return retry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  }
});

// Servizio per gestire i tasks
export const TasksService = {
  getTasksForDashboard: () => apiClient.get('/aggregate/dashboard'),
  getTasks: () => apiClient.get('/tasks'),
  getTask: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (data) => apiClient.post('/tasks', data),
  updateTask: (id, data) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
  verifyTemplateAvailability: async (workId) => {
    try {
      const response = await apiClient.get(`/tasks/verify-template/${workId}`);
      return response;
    } catch (error) {
      console.error('Error verifying template:', error);
      throw new Error('Failed to verify template availability');
    }
  },
  createTaskWithSteps: async (taskData) => {
    // Implementa exponential backoff per tentativi multipli
    const backoffOptions = {
      numOfAttempts: 3,
      startingDelay: 1000,
      timeMultiple: 2,
      maxDelay: 5000,
    };

    try {
      // Prima verifica la disponibilità del template
      const templateCheck = await TasksService.verifyTemplateAvailability(taskData.workid);
      if (!templateCheck.hasTemplate) {
        throw new Error('No template steps available for this work type');
      }

      // Esegui la creazione con backoff exponenziale
      const response = await backOff(
        () => apiClient.post('/tasks', taskData),
        backoffOptions
      );

      return {
        success: true,
        data: response,
        stepCount: response.stepCount
      };

    } catch (error) {
      // Gestione dettagliata degli errori
      let errorMessage = 'Failed to create task';
      let errorDetails = {};

      if (error.response) {
        // Error response from server
        errorMessage = error.response.data.error || errorMessage;
        errorDetails = error.response.data.details || {};
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error - no response received';
        errorDetails = { type: 'NETWORK_ERROR' };
      } else {
        // Error in request setup
        errorMessage = error.message;
        errorDetails = { type: 'REQUEST_SETUP_ERROR' };
      }

      console.error('Task creation error:', {
        message: errorMessage,
        details: errorDetails,
        originalError: error
      });

      throw {
        message: errorMessage,
        details: errorDetails,
        code: error.response?.status || 500
      };
    }
  },
  // Metodo helper per il cleanup in caso di errori
  cleanupFailedTask: async (taskId) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      console.log('Cleanup successful for failed task:', taskId);
    } catch (cleanupError) {
      console.error('Cleanup failed for task:', taskId, cleanupError);
    }
  },

  updateTaskStatus: async (id, completed) => {
    const response = await apiClient.patch(`/tasks/${id}`, { completed });
    return response.data;
  },



};

// Servizio per gestire i works
//export const WorksService = {
//  getWorks: () => apiClient.get('/aggregate/works'),
//  getWork: (id) => apiClient.get(`/works/${id}`),
//  createWork: (data) => apiClient.post('/works', data),
//  updateWork: (id, data) => apiClient.put(`/works/${id}`, data),
//  deleteWork: (id) => apiClient.delete(`/works/${id}`),
//};

export const WorksService = {
  // Query di base
  getWorks: async (params = {}) => {
    const { page, limit, search, categoryid, providerid, status, sort, order } = params;
    const queryParams = new URLSearchParams();

    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (categoryid) queryParams.append('categoryid', categoryid);
    if (providerid) queryParams.append('providerid', providerid);
    if (status) queryParams.append('status', status);
    if (sort) queryParams.append('sort', sort);
    if (order) queryParams.append('order', order);

    const url = `/aggregate/works?${queryParams.toString()}`;
    return apiClient.get(url);
  },

  getWork: (id) => apiClient.get(`/works/${id}`),

  // Operazioni CRUD avanzate
  createWork: async (workData) => {
    try {
      const response = await apiClient.post('/works', workData);
      return {
        success: true,
        data: response,
        message: 'Work created successfully'
      };
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to create work',
        details: error.response?.data?.details || {},
        code: error.response?.status || 500
      };
    }
  },

  updateWork: async (id, workData) => {
    try {
      const response = await apiClient.put(`/works/${id}`, workData);
      return {
        success: true,
        data: response,
        message: 'Work updated successfully'
      };
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to update work',
        details: error.response?.data?.details || {},
        code: error.response?.status || 500
      };
    }
  },

  deleteWork: async (id) => {
    try {
      await apiClient.delete(`/works/${id}`);
      return {
        success: true,
        message: 'Work deleted successfully'
      };
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to delete work',
        code: error.response?.status || 500
      };
    }
  },

  // Operazioni speciali
  duplicateWork: async (id, newName) => {
    try {
      const response = await apiClient.post(`/works/${id}/duplicate`, { newName });
      return {
        success: true,
        data: response.work,
        message: 'Work duplicated successfully'
      };
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to duplicate work',
        code: error.response?.status || 500
      };
    }
  },

  exportWork: (id) => apiClient.get(`/works/${id}/export`),

  importWork: async (workData) => {
    try {
      const response = await apiClient.post('/works/import', workData);
      return {
        success: true,
        data: response.work,
        message: 'Work imported successfully'
      };
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to import work',
        details: error.response?.data?.details || {},
        code: error.response?.status || 500
      };
    }
  },

  reorderSteps: async (data) => {
    try {
      // Invia tutto l'array di passi con il nuovo ordine
      const response = await apiClient.patch(`/works/${data.workId}/reorder-steps`, {
        steps: data.steps
      });

      return {
        success: true,
        message: 'Steps reordered successfully'
      };
    } catch (error) {
      console.error("Error:", error);
      throw {
        message: error.response?.data?.error || 'Failed to reorder steps',
        code: error.response?.status || 500
      };
    }
  },


  // Metodo helper per verificare lo stato di un work
  verifyWorkStatus: async (workId) => {
    try {
      const work = await WorksService.getWork(workId);
      const steps = await StepsTempService.getStepsForWork(workId);

      return {
        hasSteps: steps.length > 0,
        stepCount: steps.length,
        status: work.status,
        version: work.version
      };
    } catch (error) {
      throw {
        message: 'Failed to verify work status',
        code: error.response?.status || 500
      };
    }
  }
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
  reorderStep: async (workId, stepId, newOrder) => {
    try {
      const response = await apiClient.patch(`/stepstemp/${stepId}/reorder`, {
        workid: workId,
        order: newOrder
      });
      return response;
    } catch (error) {
      throw new Error('Failed to reorder step');
    }
  },

  bulkUpdateSteps: async (workId, steps) => {
    try {
      const response = await apiClient.post(`/stepstemp/bulk-update`, {
        workid: workId,
        steps
      });
      return response;
    } catch (error) {
      throw new Error('Failed to update steps');
    }
  }

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
