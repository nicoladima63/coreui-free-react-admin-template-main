// Aggiungere/aggiornare in api.js

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

    const url = `/works?${queryParams.toString()}`;
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

  reorderSteps: async (workId, steps) => {
    try {
      const response = await apiClient.patch(`/works/${workId}/reorder-steps`, { steps });
      return {
        success: true,
        data: response.steps,
        message: 'Steps reordered successfully'
      };
    } catch (error) {
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

export const StepsTempService = {
  // ... metodi esistenti ...

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
