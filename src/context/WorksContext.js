// context/WorksContext.js
import React, { createContext, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useToast } from '../hooks/useToast';

const WorksContext = createContext(null);

export const WorksProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const invalidateWorks = useCallback(() => {
    queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
  }, [queryClient]);

  const invalidateSteps = useCallback((workId) => {
    queryClient.invalidateQueries([QUERY_KEYS.STEPS, workId]);
  }, [queryClient]);

  const handleSuccess = useCallback((message) => {
    showSuccess(message);
    invalidateWorks();
  }, [showSuccess, invalidateWorks]);

  const handleError = useCallback((error) => {
    showError(error);
  }, [showError]);

  const value = {
    invalidateWorks,
    invalidateSteps,
    handleSuccess,
    handleError,
  };

  return (
    <WorksContext.Provider value={value}>
      {children}
    </WorksContext.Provider>
  );
};

export const useWorks = () => {
  const context = useContext(WorksContext);
  if (!context) {
    throw new Error('useWorks must be used within a WorksProvider');
  }
  return context;
};
