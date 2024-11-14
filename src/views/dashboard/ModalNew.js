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
  CREATING_STEPS: 'creating_steps',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const ModalNew = ({ visible, onClose }) => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showToast } = useToast();  // Usando il tuo hook personalizzato

  // Form state
  const [formData, setFormData] = useState({
    workid: '',
    patient: '',
    deliveryDate: null
  });

  // Process state
  const [creationState, setCreationState] = useState(CREATION_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Template verification state
  const [templateInfo, setTemplateInfo] = useState(null);

  // Gestione cache locale per ripristino
  useEffect(() => {
    const cachedData = localStorage.getItem('modalNewDraft');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setFormData(parsed);
        setHasUnsavedChanges(true);
      } catch (e) {
        console.error('Error parsing cached form data:', e);
        localStorage.removeItem('modalNewDraft');
      }
    }
  }, []);

  // Salvataggio automatico della bozza
  useEffect(() => {
    if (hasUnsavedChanges) {
      localStorage.setItem('modalNewDraft', JSON.stringify(formData));
    }
  }, [formData, hasUnsavedChanges]);

  // Mutation per la creazione del task con steps
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

      showToast({
        message: `Task creato con successo! Create ${data.stepCount} fasi dal template`,
        type: 'success'
      });

      // Pulizia
      localStorage.removeItem('modalNewDraft');
      setHasUnsavedChanges(false);

      // Chiusura ritardata per mostrare il completamento
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    },
    onError: (error) => {
      setCreationState(CREATION_STATES.ERROR);
      setError(error);

      showToast({
        message: `Errore nella creazione: ${error.message}`,
        type: 'error'
      });
    }
  });

  // Verifica template quando viene selezionato un work
  const verifyTemplate = useCallback(async (workId) => {
    if (!workId) return;

    try {
      setCreationState(CREATION_STATES.VALIDATING);
      const info = await TasksService.verifyTemplateAvailability(workId);
      setTemplateInfo(info);
      setProgress(10);

      if (!info.hasTemplate) {
        showToast({
          message: 'Questo tipo di lavoro non ha fasi template definite',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Template verification error:', error);
      showToast({
        message: 'Impossibile verificare il template',
        type: 'error'
      });
    } finally {
      setCreationState(CREATION_STATES.IDLE);
    }
  }, [showToast]);

  // Handler per la selezione del work
  const handleWorkSelect = (workId) => {
    setFormData(prev => ({ ...prev, workid: workId }));
    setHasUnsavedChanges(true);
    verifyTemplate(workId);
  };

  // Handler per il cambio dei campi del form
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Reset del form
  const resetForm = () => {
    setFormData({
      workid: '',
      patient: '',
      deliveryDate: null
    });
    setCreationState(CREATION_STATES.IDLE);
    setProgress(0);
    setError(null);
    setHasUnsavedChanges(false);
    setTemplateInfo(null);
  };

  // Validazione form
  const validateForm = () => {
    const errors = [];
    if (!formData.workid) errors.push('Seleziona un tipo di lavoro');
    if (!formData.patient) errors.push('Inserisci il paziente');
    if (!formData.deliveryDate) errors.push('Seleziona una data di consegna');
    return errors;
  };

  // Handler per il submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError({ message: validationErrors.join(', ') });
      showToast({
        message: validationErrors.join(', '),
        type: 'error'
      });
      return;
    }

    if (!templateInfo?.hasTemplate) {
      const confirm = await showConfirmDialog({
        title: 'Attenzione',
        message: 'Questo tipo di lavoro non ha fasi template. Vuoi continuare comunque?',
        confirmText: 'Continua',
        cancelText: 'Annulla'
      });

      if (!confirm) return;
    }

    createTaskMutation.mutate(formData);
  };

  // Handler per la chiusura
  const handleClose = async () => {
    if (hasUnsavedChanges && creationState !== CREATION_STATES.COMPLETED) {
      const confirm = await showConfirmDialog({
        title: 'Modifiche non salvate',
        message: 'Ci sono modifiche non salvate. Vuoi davvero chiudere?',
        confirmText: 'Chiudi',
        cancelText: 'Annulla'
      });

      if (!confirm) return;
    }

    resetForm();
    onClose();
  };

  // Render degli stati di creazione
  const renderCreationStatus = () => {
    switch (creationState) {
      case CREATION_STATES.VALIDATING:
        return <div className="text-muted">Verifica template in corso...</div>;
      case CREATION_STATES.CREATING_TASK:
        return <div className="text-muted">Creazione task in corso...</div>;
      case CREATION_STATES.CREATING_STEPS:
        return <div className="text-muted">Creazione fasi in corso...</div>;
      case CREATION_STATES.COMPLETED:
        return <div className="text-success">Creazione completata!</div>;
      case CREATION_STATES.ERROR:
        return <CAlert color="danger">{error?.message}</CAlert>;
      default:
        return null;
    }
  };

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      backdrop="static"
      keyboard={!createTaskMutation.isLoading}
    >
      <CModalHeader closeButton={!createTaskMutation.isLoading}>
        <h5>Nuovo task</h5>
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
              <small className="text-muted">
                {templateInfo.hasTemplate
                  ? `Template disponibile con ${templateInfo.templateCount} fasi`
                  : 'Nessun template disponibile'}
              </small>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel>Paziente</CFormLabel>
            <CFormInput
              type="text"
              value={formData.patient}
              onChange={(e) => handleInputChange('patient', e.target.value)}
              disabled={createTaskMutation.isLoading}
              placeholder="Inserisci il paziente"
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Data Consegna</CFormLabel>
            <DatePicker
              selected={formData.deliveryDate}
              onChange={(date) => handleInputChange('deliveryDate', date)}
              dateFormat="yyyy-MM-dd"
              className="form-control"
              placeholderText="Seleziona la data di consegna"
              disabled={createTaskMutation.isLoading}
              required
            />
          </div>

          {progress > 0 && (
            <CProgress className="mb-3">
              <CProgressBar
                value={progress}
                color={creationState === CREATION_STATES.ERROR ? 'danger' : 'primary'}
              />
            </CProgress>
          )}

          {renderCreationStatus()}
        </CForm>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          onClick={handleClose}
          disabled={createTaskMutation.isLoading}
        >
          <CIcon icon={icon.cilX} className="me-2" />
          Annulla
        </CButton>

        <CButton
          color="primary"
          onClick={handleSubmit}
          disabled={createTaskMutation.isLoading}
        >
          {createTaskMutation.isLoading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Creazione in corso...
            </>
          ) : (
            <>
              <CIcon icon={icon.cilSave} className="me-2" />
              Salva
            </>
          )}
        </CButton>
      </CModalFooter>

      <ConfirmDialog />
    </CModal>
  );
};

export default ModalNew;
