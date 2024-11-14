import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
  CSpinner,
  CProgress,
  CProgressBar,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import { useToast } from '../../hooks/useToast';  // Il tuo hook personalizzato
import WorkSelect from '../../components/WorkSelect';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { TasksService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';

// Stati possibili del processo di creazione
const CREATION_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  CREATING_TASK: 'creating_task',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const ModalNew = ({ visible, onClose, onSave }) => {
  const queryClient = useQueryClient();
  const { showConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    workid: '',
    patient: '',
    deliveryDate: null
  });

  const [creationState, setCreationState] = useState(CREATION_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Gestione Autosave
  useEffect(() => {
    if (visible) {
      const cachedData = localStorage.getItem('taskDraft');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setFormData(parsed);
          setHasUnsavedChanges(true);
        } catch (e) {
          localStorage.removeItem('taskDraft');
        }
      }
    }
  }, [visible]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      localStorage.setItem('taskDraft', JSON.stringify(formData));
    }
  }, [formData, hasUnsavedChanges]);

  // Template Verification Query
  const verifyTemplateMutation = useMutation({
    mutationFn: TasksService.verifyTemplateAvailability,
    onMutate: () => {
      setCreationState(CREATION_STATES.VALIDATING);
      setProgress(10);
    },
    onSuccess: (info) => {
      setTemplateInfo(info);
      setCreationState(CREATION_STATES.IDLE);
      if (!info.hasTemplate) {
        showError('Questo tipo di lavoro non ha fasi template definite');
      }
    },
    onError: (error) => {
      showError('Impossibile verificare il template');
      setCreationState(CREATION_STATES.ERROR);
    }
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: TasksService.createTaskWithSteps,
    onMutate: () => {
      setCreationState(CREATION_STATES.CREATING_TASK);
      setProgress(25);
    },
    onSuccess: (data) => {
      setProgress(100);
      setCreationState(CREATION_STATES.COMPLETED);
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      showSuccess(`Task creato con successo! Create ${data.stepCount} fasi`);
      cleanup();
    },
    onError: (error) => {
      setCreationState(CREATION_STATES.ERROR);
      showError(error);
    }
  });

  // Handlers
  const handleWorkSelect = useCallback((workId) => {
    setFormData(prev => ({ ...prev, workid: workId }));
    setHasUnsavedChanges(true);
    if (workId) {
      verifyTemplateMutation.mutate(workId);
    }
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];
    if (!formData.workid) errors.push('Seleziona un tipo di lavoro');
    if (!formData.patient) errors.push('Inserisci il paziente');
    if (!formData.deliveryDate) errors.push('Seleziona una data di consegna');
    return errors;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showError(validationErrors.join(', '));
      return;
    }

    if (!templateInfo?.hasTemplate) {
      const confirm = await showConfirmDialog({
        title: 'Attenzione',
        message: 'Questo tipo di lavoro non ha fasi template. Vuoi continuare?',
        confirmText: 'Continua',
        cancelText: 'Annulla'
      });
      if (!confirm) return;
    }

    createTaskMutation.mutate(formData);
  };

  const cleanup = useCallback(() => {
    localStorage.removeItem('taskDraft');
    setHasUnsavedChanges(false);
    setTimeout(() => {
      onClose();
      resetForm();
    }, 1500);
  }, [onClose]);

  const handleClose = async () => {
    if (hasUnsavedChanges && creationState !== CREATION_STATES.COMPLETED) {
      const confirm = await showConfirmDialog({
        title: 'Modifiche non salvate',
        message: 'Vuoi davvero chiudere? Le modifiche andranno perse.',
        confirmText: 'Chiudi',
        cancelText: 'Annulla'
      });
      if (!confirm) return;
    }
    cleanup();
  };

  const resetForm = useCallback(() => {
    setFormData({
      workid: '',
      patient: '',
      deliveryDate: null
    });
    setCreationState(CREATION_STATES.IDLE);
    setProgress(0);
    setTemplateInfo(null);
    setHasUnsavedChanges(false);
  }, []);

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      backdrop="static"
      keyboard={!createTaskMutation.isLoading}
    >
      <CModalHeader closeButton={!createTaskMutation.isLoading}>
        <h5>Nuovo Task</h5>
      </CModalHeader>

      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Lavorazione</CFormLabel>
            <WorkSelect
              onSelect={handleWorkSelect}
              selectedValue={formData.workid}
              disabled={createTaskMutation.isLoading}
              required
            />
            {templateInfo && (
              <small className={`text-${templateInfo.hasTemplate ? 'success' : 'warning'}`}>
                {templateInfo.hasTemplate
                  ? `Template disponibile con ${templateInfo.templateCount} fasi`
                  : 'Nessun template disponibile'}
              </small>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel>Paziente</CFormLabel>
            <CFormInput
              value={formData.patient}
              onChange={(e) => handleInputChange('patient', e.target.value)}
              disabled={createTaskMutation.isLoading}
              placeholder="Nome paziente"
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Data Consegna</CFormLabel>
            <DatePicker
              selected={formData.deliveryDate}
              onChange={(date) => handleInputChange('deliveryDate', date)}
              className="form-control"
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              placeholderText="Seleziona data"
              disabled={createTaskMutation.isLoading}
              required
            />
          </div>

          {(progress > 0 || creationState !== CREATION_STATES.IDLE) && (
            <>
              <CProgress className="mb-3">
                <CProgressBar
                  value={progress}
                  color={creationState === CREATION_STATES.ERROR ? 'danger' : 'success'}
                  animated={creationState !== CREATION_STATES.COMPLETED}
                />
              </CProgress>
              <div className={`text-${creationState === CREATION_STATES.ERROR ? 'danger' : 'info'} small mb-3`}>
                {creationState === CREATION_STATES.VALIDATING && 'Verifica template...'}
                {creationState === CREATION_STATES.CREATING_TASK && 'Creazione task...'}
                {creationState === CREATION_STATES.COMPLETED && 'Completato!'}
              </div>
            </>
          )}
        </CForm>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          onClick={handleClose}
          disabled={createTaskMutation.isLoading}
        >
          <CIcon icon={icon.cilX} /> Annulla
        </CButton>
        <CButton
          color="primary"
          onClick={handleSubmit}
          disabled={createTaskMutation.isLoading}
        >
          {createTaskMutation.isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Creazione...
            </>
          ) : (
            <>
              <CIcon icon={icon.cilSave} /> Salva
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};
export default ModalNew;
