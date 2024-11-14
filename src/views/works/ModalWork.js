import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CAlert,
  CSpinner,
  CProgress,
  CProgressBar,
  CBadge,
  CButtonGroup,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import ProviderSelect from '../../components/ProviderSelect';
import CategorySelect from '../../components/CategorySelect';
import { WorksService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';

// Stati del processo di creazione/modifica
const WORK_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  SAVING: 'saving',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const ModalWork = ({ visible, onClose, selectedWork = null }) => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError, showInfo } = useToast();

  // Stati del form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    providerid: '',
    categoryid: '',
    status: 'active'
  });

  // Stati di gestione
  const [workState, setWorkState] = useState(WORK_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Carica i dati del work se in modalità modifica
  useEffect(() => {
    if (selectedWork) {
      setFormData({
        name: selectedWork.name || '',
        description: selectedWork.description || '',
        providerid: selectedWork.providerid || '',
        categoryid: selectedWork.categoryid || '',
        status: selectedWork.status || 'active'
      });
    } else {
      resetForm();
    }
  }, [selectedWork]);

  // Gestione salvataggio bozza
  useEffect(() => {
    if (hasUnsavedChanges) {
      localStorage.setItem('workDraft', JSON.stringify(formData));
    }
  }, [formData, hasUnsavedChanges]);

  // Carica bozza salvata
  useEffect(() => {
    const draft = localStorage.getItem('workDraft');
    if (draft && !selectedWork) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
        setHasUnsavedChanges(true);
        showInfo({
          message: 'Bozza precedente recuperata',
          type: 'info'
        });
      } catch (error) {
        console.error('Error parsing draft:', error);
        localStorage.removeItem('workDraft');
      }
    }
  }, []);

  // Mutation per salvare/aggiornare il work
  const workMutation = useMutation({
    mutationFn: (data) =>
      selectedWork
        ? WorksService.updateWork(selectedWork.id, data)
        : WorksService.createWork(data),
    onMutate: () => {
      setWorkState(WORK_STATES.SAVING);
      setProgress(50);
    },
    onSuccess: (response) => {
      setProgress(100);
      setWorkState(WORK_STATES.COMPLETED);
      queryClient.invalidateQueries([QUERY_KEYS.WORKS]);

      showSuccess({
        message: selectedWork
          ? 'Lavorazione aggiornata con successo'
          : 'Nuova lavorazione creata con successo',
        type: 'success'
      });

      // Pulizia
      localStorage.removeItem('workDraft');
      setHasUnsavedChanges(false);

      // Chiusura ritardata per mostrare il completamento
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    },
    onError: (error) => {
      setWorkState(WORK_STATES.ERROR);
      showError({
        message: `Errore: ${error.message}`,
        type: 'error'
      });
    }
  });

  // Validazione del form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
    } else if (formData.name.length < 2) {
      errors.name = 'Il nome deve essere di almeno 2 caratteri';
    }

    if (!formData.providerid) {
      errors.providerid = 'Seleziona un fornitore';
    }

    if (!formData.categoryid) {
      errors.categoryid = 'Seleziona una categoria';
    }

    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0);
    return Object.keys(errors).length === 0;
  };

  // Gestione cambiamenti form
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    validateForm();
  };

  // Reset del form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      providerid: '',
      categoryid: '',
      status: 'active'
    });
    setWorkState(WORK_STATES.IDLE);
    setProgress(0);
    setValidationErrors({});
    setHasUnsavedChanges(false);
    setIsValid(false);
  };

  // Gestione submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError({
        message: 'Correggi gli errori nel form prima di procedere',
        type: 'error'
      });
      return;
    }

    try {
      await workMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving work:', error);
    }
  };

  // Gestione chiusura
  const handleClose = async () => {
    if (hasUnsavedChanges && workState !== WORK_STATES.COMPLETED) {
      const confirmed = await showConfirmDialog({
        title: 'Modifiche non salvate',
        message: 'Ci sono modifiche non salvate. Vuoi davvero chiudere?',
        confirmText: 'Chiudi',
        cancelText: 'Annulla'
      });

      if (!confirmed) return;
    }

    resetForm();
    onClose();
  };

  // Rendering stato corrente
  const renderWorkState = () => {
    switch (workState) {
      case WORK_STATES.VALIDATING:
        return <div className="text-muted">Validazione in corso...</div>;
      case WORK_STATES.SAVING:
        return <div className="text-muted">Salvataggio in corso...</div>;
      case WORK_STATES.COMPLETED:
        return <div className="text-success">Operazione completata!</div>;
      case WORK_STATES.ERROR:
        return <CAlert color="danger">Si è verificato un errore</CAlert>;
      default:
        return null;
    }
  };

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      backdrop="static"
      keyboard={!workMutation.isLoading}
    >
      <CModalHeader closeButton={!workMutation.isLoading}>
        <h5>{selectedWork ? 'Modifica Lavorazione' : 'Nuova Lavorazione'}</h5>
      </CModalHeader>

      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Nome <CBadge color="danger">*</CBadge></CFormLabel>
            <CFormInput
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              invalid={!!validationErrors.name}
              disabled={workMutation.isLoading}
              placeholder="Nome della lavorazione"
            />
            {validationErrors.name && (
              <div className="invalid-feedback d-block">
                {validationErrors.name}
              </div>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel>Descrizione</CFormLabel>
            <CFormTextarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={workMutation.isLoading}
              placeholder="Descrizione della lavorazione"
              rows={3}
            />
          </div>

          <div className="mb-3">
            <CFormLabel>
              Fornitore <CBadge color="danger">*</CBadge>
            </CFormLabel>
            <ProviderSelect
              onSelect={(value) => handleChange('providerid', value)}
              selectedValue={formData.providerid}
              invalid={!!validationErrors.providerid}
              disabled={workMutation.isLoading}
            />
            {validationErrors.providerid && (
              <div className="invalid-feedback d-block">
                {validationErrors.providerid}
              </div>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel>
              Categoria <CBadge color="danger">*</CBadge>
            </CFormLabel>
            <CategorySelect
              onSelect={(value) => handleChange('categoryid', value)}
              selectedValue={formData.categoryid}
              invalid={!!validationErrors.categoryid}
              disabled={workMutation.isLoading}
            />
            {validationErrors.categoryid && (
              <div className="invalid-feedback d-block">
                {validationErrors.categoryid}
              </div>
            )}
          </div>

          {progress > 0 && (
            <CProgress className="mb-3">
              <CProgressBar
                value={progress}
                color={workState === WORK_STATES.ERROR ? 'danger' : 'primary'}
              />
            </CProgress>
          )}

          {renderWorkState()}
        </CForm>
      </CModalBody>

      <CModalFooter>
        <CButtonGroup>
          <CButton
            color="secondary"
            onClick={handleClose}
            disabled={workMutation.isLoading}
          >
            <CIcon icon={icon.cilX} className="me-2" />
            Annulla
          </CButton>

          <CButton
            color="primary"
            onClick={handleSubmit}
            disabled={workMutation.isLoading || !isValid}
          >
            {workMutation.isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Salvataggio...
              </>
            ) : (
              <>
                <CIcon icon={selectedWork ? icon.cilSave : icon.cilPlus} className="me-2" />
                {selectedWork ? 'Aggiorna' : 'Crea'}
              </>
            )}
          </CButton>
        </CButtonGroup>
      </CModalFooter>

      <ConfirmDialog />
    </CModal>
  );
};

export default ModalWork;
