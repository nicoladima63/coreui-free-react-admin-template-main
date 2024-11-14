import React, { useState, useEffect } from 'react';
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
  CBadge,
  CButtonGroup,
  CCard,
  CCardBody,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import UserSelect from '../../components/UserSelect';
import WorkSelect from '../../components/WorkSelect';
import { StepsTempService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';

// Stati del processo di creazione/modifica
const STEP_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  SAVING: 'saving',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const ModalStep = ({ visible, onClose, selectedStep = null, workId }) => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError, showInfo } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    order: '',
    userid: '',
    workid: workId || '',
    completed: false
  });

  // UI states
  const [stepState, setStepState] = useState(STEP_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Query per ottenere l'ordine massimo corrente
  const { data: existingSteps = [] } = useQuery({
    queryKey: [QUERY_KEYS.STEPSTEMP, workId],
    queryFn: () => StepsTempService.getStepsForWork(workId),
    enabled: !!workId
  });

  // Effetto per precompilare il form
  useEffect(() => {
    if (selectedStep) {
      setFormData({
        name: selectedStep.name || '',
        order: selectedStep.order || '',
        userid: selectedStep.userid || '',
        workid: selectedStep.workid || workId || '',
        completed: selectedStep.completed || false
      });
    } else if (workId) {
      // Se è una nuova fase, suggerisci il prossimo ordine disponibile
      const nextOrder = existingSteps.length > 0
        ? Math.max(...existingSteps.map(s => s.order)) + 1
        : 1;
      setFormData(prev => ({
        ...prev,
        workid: workId,
        order: nextOrder.toString()
      }));
    }
  }, [selectedStep, workId, existingSteps]);

  // Mutation per salvare/aggiornare lo step
  const stepMutation = useMutation({
    mutationFn: (data) =>
      selectedStep
        ? StepsTempService.updateStep(selectedStep.id, data)
        : StepsTempService.createStep(data),
    onMutate: () => {
      setStepState(STEP_STATES.SAVING);
      setProgress(50);
    },
    onSuccess: () => {
      setProgress(100);
      setStepState(STEP_STATES.COMPLETED);
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP, workId]);

      showSuccess({
        message: selectedStep
          ? 'Fase aggiornata con successo'
          : 'Nuova fase creata con successo',
        type: 'success'
      });

      // Chiusura ritardata per mostrare il completamento
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    },
    onError: (error) => {
      setStepState(STEP_STATES.ERROR);
      showError({
        message: `Errore: ${error.message}`,
        type: 'error'
      });
    }
  });

  // Validazione form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
    }

    if (!formData.order.trim()) {
      errors.order = 'L\'ordine è obbligatorio';
    } else if (isNaN(formData.order) || parseInt(formData.order) < 1) {
      errors.order = 'L\'ordine deve essere un numero positivo';
    }

    if (!formData.userid) {
      errors.userid = 'Seleziona un operatore';
    }

    if (!formData.workid) {
      errors.workid = 'Seleziona una lavorazione';
    }

    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0);
    return Object.keys(errors).length === 0;
  };

  // Handler per i cambiamenti del form
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    validateForm();
  };

  // Reset del form
  const resetForm = () => {
    setFormData({
      name: '',
      order: '',
      userid: '',
      workid: workId || '',
      completed: false
    });
    setStepState(STEP_STATES.IDLE);
    setProgress(0);
    setValidationErrors({});
    setHasUnsavedChanges(false);
    setIsValid(false);
  };

  // Handler per il submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError({
        message: 'Correggi gli errori nel form prima di procedere',
        type: 'error'
      });
      return;
    }

    // Controlla se l'ordine è già utilizzato
    const orderExists = existingSteps.some(
      step => step.order === parseInt(formData.order) && step.id !== selectedStep?.id
    );

    if (orderExists) {
      const confirmed = await showConfirmDialog({
        title: 'Ordine duplicato',
        message: 'Questo ordine è già utilizzato. Vuoi riordinare automaticamente le fasi successive?',
        confirmText: 'Riordina',
        cancelText: 'Annulla'
      });

      if (!confirmed) return;
    }

    try {
      await stepMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error saving step:', error);
    }
  };

  // Handler per la chiusura
  const handleClose = async () => {
    if (hasUnsavedChanges && stepState !== STEP_STATES.COMPLETED) {
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

  // Preview dell'ordine delle fasi
  const renderStepsPreview = () => {
    if (!workId || existingSteps.length === 0) return null;

    const currentOrder = parseInt(formData.order) || 0;
    const sortedSteps = [...existingSteps]
      .filter(step => step.id !== selectedStep?.id)
      .sort((a, b) => a.order - b.order);

    return (
      <CCard className="mt-3 mb-3">
        <CCardBody>
          <div className="small text-muted mb-2">Anteprima ordine fasi:</div>
          <div className="d-flex flex-column gap-2">
            {sortedSteps.map((step, index) => {
              const order = step.order;
              const isBeforeCurrent = order < currentOrder;
              const isAfterCurrent = order >= currentOrder;

              return (
                <div
                  key={step.id}
                  className={`d-flex align-items-center ${isAfterCurrent && 'text-muted'
                    }`}
                >
                  <div className="me-2">{order}.</div>
                  <div className="flex-grow-1">{step.name}</div>
                  {step.user && (
                    <div className="small text-muted">{step.user.name}</div>
                  )}
                </div>
              );
            })}
            {currentOrder > 0 && (
              <div className="d-flex align-items-center text-primary fw-bold">
                <div className="me-2">{currentOrder}.</div>
                <div className="flex-grow-1">
                  {formData.name || '(Nuova fase)'}
                </div>
              </div>
            )}
          </div>
        </CCardBody>
      </CCard>
    );
  };

  return (
    <CModal
      visible={visible}
      onClose={handleClose}
      backdrop="static"
      keyboard={!stepMutation.isLoading}
    >
      <CModalHeader closeButton={!stepMutation.isLoading}>
        <h5>{selectedStep ? 'Modifica Fase' : 'Nuova Fase'}</h5>
      </CModalHeader>

      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          {/* Work Selection - solo se non è passato workId */}
          {!workId && (
            <div className="mb-3">
              <CFormLabel>
                Lavorazione
              </CFormLabel>
              <WorkSelect
                onSelect={(value) => handleChange('workid', value)}
                selectedValue={formData.workid}
                invalid={!!validationErrors.workid}
                disabled={stepMutation.isLoading || !!workId}
                required
              />
              {validationErrors.workid && (
                <div className="invalid-feedback d-block">
                  {validationErrors.workid}
                </div>
              )}
            </div>
          )}

          <div className="mb-3">
            <CFormLabel>
              Nome Fase
            </CFormLabel>
            <CFormInput
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              invalid={!!validationErrors.name}
              disabled={stepMutation.isLoading}
              placeholder="Nome della fase"
              required
            />
            {validationErrors.name && (
              <div className="invalid-feedback d-block">
                {validationErrors.name}
              </div>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel>
              Ordine
            </CFormLabel>
            <CFormInput
              type="number"
              min="1"
              value={formData.order}
              onChange={(e) => handleChange('order', e.target.value)}
              invalid={!!validationErrors.order}
              disabled={stepMutation.isLoading}
              required
            />
            {validationErrors.order && (
              <div className="invalid-feedback d-block">
                {validationErrors.order}
              </div>
            )}
          </div>

          <div className="mb-3">
            <CFormLabel>
              Operatore
            </CFormLabel>
            <UserSelect
              onSelect={(value) => handleChange('userid', value)}
              selectedValue={formData.userid}
              invalid={!!validationErrors.userid}
              disabled={stepMutation.isLoading}
              required
            />
            {validationErrors.userid && (
              <div className="invalid-feedback d-block">
                {validationErrors.userid}
              </div>
            )}
          </div>

          {/* Preview ordine fasi */}
          {renderStepsPreview()}

          {progress > 0 && (
            <CProgress className="mb-3">
              <CProgressBar
                value={progress}
                color={stepState === STEP_STATES.ERROR ? 'danger' : 'primary'}
              />
            </CProgress>
          )}

          {stepState === STEP_STATES.ERROR && (
            <CAlert color="danger">
              Si è verificato un errore durante il salvataggio
            </CAlert>
          )}
        </CForm>
      </CModalBody>

      <CModalFooter>
        <CButtonGroup>
          <CButton
            color="secondary"
            onClick={handleClose}
            disabled={stepMutation.isLoading}
          >
            <CIcon icon={icon.cilX} className="me-2" />
            Annulla
          </CButton>

          <CButton
            color="primary"
            onClick={handleSubmit}
            disabled={stepMutation.isLoading || !isValid}
          >
            {stepMutation.isLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Salvataggio...
              </>
            ) : (
              <>
                <CIcon icon={selectedStep ? icon.cilSave : icon.cilPlus} className="me-2" />
                {selectedStep ? 'Aggiorna' : 'Crea'}
              </>
            )}
          </CButton>
        </CButtonGroup>
      </CModalFooter>

      <ConfirmDialog />
    </CModal>
  );
};

export default ModalStep;
