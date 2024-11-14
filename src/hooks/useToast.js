// hooks/useToast.js
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../constants/errorMessages';

export const useToast = () => {
  const showSuccess = useCallback((message) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
    });
  }, []);

  const showError = useCallback((error) => {
    const message = typeof error === 'string' ? error : getErrorMessage(error);
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
    });
  }, []);

  const showInfo = useCallback((message) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
    });
  }, []);

  return {
    showSuccess,
    showError,
    showInfo,
  };
};
