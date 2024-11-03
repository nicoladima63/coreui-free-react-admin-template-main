// hooks/useConfirmDialog.js
import { useState, useCallback } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from '@coreui/react';

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Conferma',
    cancelText: 'Annulla',
    confirmColor: 'danger',
    resolve: null,
  });

  const showConfirmDialog = useCallback(
    ({ title, message, confirmText, cancelText, confirmColor } = {}) => {
      return new Promise((resolve) => {
        setConfig({
          title: title || 'Conferma',
          message: message || 'Sei sicuro di voler procedere?',
          confirmText: confirmText || 'Conferma',
          cancelText: cancelText || 'Annulla',
          confirmColor: confirmColor || 'danger',
          resolve,
        });
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    config.resolve(true);
    setIsOpen(false);
  }, [config]);

  const handleCancel = useCallback(() => {
    config.resolve(false);
    setIsOpen(false);
  }, [config]);

  const ConfirmDialog = useCallback(
    () => (
      <CModal visible={isOpen} onClose={handleCancel}>
        <CModalHeader>
          <CModalTitle>{config.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>{config.message}</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancel}>
            {config.cancelText}
          </CButton>
          <CButton color={config.confirmColor} onClick={handleConfirm}>
            {config.confirmText}
          </CButton>
        </CModalFooter>
      </CModal>
    ),
    [isOpen, config, handleCancel, handleConfirm]
  );

  return {
    showConfirmDialog,
    ConfirmDialog,
  };
};
