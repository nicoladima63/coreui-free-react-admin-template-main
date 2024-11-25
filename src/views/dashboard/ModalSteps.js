import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { websocketService } from '../../services/websocket';

import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalTitle,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CTooltip,
  CBadge,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import { StepsService, TasksService, TodoService } from '../../services/api';
import { QUERY_KEYS } from '../../constants/queryKeys';

const ModalSteps = ({ visible, onClose, task, focusedStepId }) => {
  const queryClient = useQueryClient();
  const { showError, showSuccess, showInfo } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const [localTask, setLocalTask] = useState(task);


  useEffect(() => {
    if (visible && focusedStepId) {
      const stepElement = document.getElementById(`step-${focusedStepId}`);
      if (stepElement) {
        stepElement.scrollIntoView({ behavior: 'smooth' });
        stepElement.classList.add('highlight-step');
        setTimeout(() => stepElement.classList.remove('highlight-step'), 2000);
      }
    }
  }, [visible, focusedStepId]);

  // Aggiorniamo localTask quando cambia task
  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  // Step update mutation
  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, completed }) => StepsService.updateStepStatus(stepId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
    },
    onError: (error) => {
      showError(error);
    }
  });

  // Mutation per completare il task
  const completeTaskMutation = useMutation({
    mutationFn: (taskId) => TasksService.updateTaskStatus(taskId, { completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      showSuccess('Task completato e archiviato');
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Errore sconosciuto';
      console.error('Error completing task:', errorMessage);
      showError(`Errore: ${errorMessage}`);
    },
  });

  const areAllStepsCompleted = useMemo(() => {
    if (!localTask?.steps?.length) return false;
    return localTask.steps.every(step => step.completed);
  }, [localTask?.steps]);

  // Computed values
  const sortedSteps = useMemo(() => {
    if (!localTask?.steps) return [];
    return [...localTask.steps].sort((a, b) => a.order - b.order);
  }, [localTask?.steps]);

  const stepValidations = useMemo(() => {
    if (!sortedSteps.length) return {};

    return sortedSteps.reduce((acc, step) => {
      const previousSteps = sortedSteps.filter(s => s.order < step.order);
      acc[step.id] = {
        canComplete: previousSteps.length === 0 || previousSteps.every(s => s.completed),
        hasIncompletePrerequisites: previousSteps.some(s => !s.completed)
      };
      return acc;
    }, {});
  }, [sortedSteps]);

  // Handlers
  const handleToggleStep = useCallback(async (stepId, completed) => {
    try {
      // Aggiorna localmente lo stato dello step
      const updatedSteps = localTask.steps.map(s =>
        s.id === stepId ? { ...s, completed } : s
      );
      setLocalTask(prev => ({ ...prev, steps: updatedSteps }));

      // Invia la modifica al backend
      await updateStepMutation.mutateAsync({ stepId, completed });


      if (completed) {
        const completedStep = localTask.steps.find(s => s.id === stepId);
        const nextStep = localTask.steps.find(s => s.order === completedStep.order + 1);

        if (nextStep) {
          const message = `La fase "${completedStep.name}" è stata completata. Puoi procedere con "${nextStep.name}"`;

          try {
            // Create notification via API only
            await TodoService.createTodo({
              recipientId: nextStep.user.id,
              subject: 'Fase precedente completata',
              message,
              priority: 'high',
              type: 'step_notification',
              relatedTaskId: task.id,
              relatedStepId: nextStep.id,
              status: 'pending'
            });

            showInfo(`Notifica inviata a ${nextStep.user.name}`);
          } catch (error) {
            console.error('Error sending notification:', error);
            showError('Errore nell\'invio della notifica');
          }
        }
      }

      // Verifica se tutti gli step saranno completati
      const willAllBeCompleted = updatedSteps.every(s =>
        s.id === stepId ? completed : s.completed
      );

      if (willAllBeCompleted) {
        // Mostra dialogo di archiviazione
        const shouldArchive = await showConfirmDialog({
          title: 'Task Completato',
          message: 'Tutte le fasi sono state completate. Vuoi archiviare questo task?',
          confirmText: 'Archivia',
          cancelText: 'Non ancora',
          confirmColor: 'success'
        });

        if (shouldArchive) {
          await completeTaskMutation.mutateAsync(task.id);
        }
      } else {
        showSuccess('Fase aggiornata');
      }
    } catch (error) {
      // Rollback in caso di errore
      setLocalTask(task);
      console.error('Error toggling step:', error);
      showError('Errore nell\'aggiornamento della fase');
    }
  }, [updateStepMutation, completeTaskMutation, localTask, task, showSuccess, showInfo, showError, showConfirmDialog]);

  const getStepStatusButton = useCallback((step) => {
    if (!step || !stepValidations[step.id]) return null;

    const validation = stepValidations[step.id];
    const canComplete = validation.canComplete;
    const isUpdating = updateStepMutation.isLoading &&
      updateStepMutation.variables?.stepId === step.id;

    return (
      <CTooltip
        content={
          !canComplete && !step.completed
            ? "Completa prima le fasi precedenti"
            : step.completed
              ? "Marca come non completata"
              : "Marca come completata"
        }
      >
        <span className="d-inline-block">
          <CButton
            color={step.completed ? "success" : canComplete ? "primary" : "secondary"}
            size="sm"
            variant={step.completed ? "ghost" : "outline"}
            onClick={() => canComplete && handleToggleStep(step.id, !step.completed)}
            disabled={!canComplete && !step.completed || isUpdating}
            className={isUpdating ? 'position-relative' : ''}
          >
            {isUpdating ? (
              <CSpinner size="sm" />
            ) : (
              <CIcon
                icon={step.completed ? icon.cilCheckCircle : icon.cilXCircle}
                className={canComplete ? 'transition-icon' : ''}
              />
            )}
          </CButton>
        </span>
      </CTooltip>
    );
  }, [stepValidations, updateStepMutation, handleToggleStep]);

  const handleArchiveTask = useCallback(async (taskId) => {
    try {
      const shouldArchive = await showConfirmDialog({
        title: 'Archivia Task',
        message: 'Vuoi archiviare questo task? Non sarà più visibile nella dashboard.',
        confirmText: 'Archivia',
        cancelText: 'Annulla',
        confirmColor: 'success'
      });

      if (shouldArchive) {
        await completeTaskMutation.mutateAsync(taskId);
      }
    } catch (error) {
      console.error('Error archiving task:', error);
      showError('Errore durante l\'archiviazione del task');
    }
  }, [completeTaskMutation, showConfirmDialog, showError]);


  if (!task) return null;

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="lg"
      backdrop="static"
      keyboard={!updateStepMutation.isLoading}
    >
      <CModalHeader closeButton={!updateStepMutation.isLoading}>
        <CModalTitle>
          <div className="d-flex align-items-center">
            <span className="me-2">Fasi della lavorazione:</span>
            <CBadge
              color="info"
              style={{
                backgroundColor: localTask?.work?.category?.color || '#6c757d',
                padding: '0.5em 1em'
              }}
            >
              {localTask?.work?.name || 'N/D'}
            </CBadge>
            <span className="mx-2">-</span>
            <span className="text-muted">Paziente: {localTask?.patient || 'N/D'}</span>
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {areAllStepsCompleted && (
          <CAlert color="info" className="d-flex align-items-center mb-3">
            <CIcon icon={icon.cilCheckCircle} className="me-2" />
            Tutte le fasi sono state completate
            <CButton
              color="success"
              variant="ghost"
              size="sm"
              className="ms-auto"
              onClick={() => handleArchiveTask(task.id)}
            >
              <CIcon icon={icon.cilArchive} className="me-2" />
              Archivia Task
            </CButton>
          </CAlert>
        )}
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell width="80">Ordine</CTableHeaderCell>
              <CTableHeaderCell>Fase</CTableHeaderCell>
              <CTableHeaderCell>Operatore</CTableHeaderCell>
              <CTableHeaderCell width="100" className="text-center">Stato</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {!sortedSteps.length ? (
              <CTableRow>
                <CTableDataCell colSpan="4" className="text-center text-muted py-4">
                  <CIcon icon={icon.cilBan} className="me-2" />
                  Nessuna fase disponibile
                </CTableDataCell>
              </CTableRow>
            ) : (
              sortedSteps.map((step) => (
                <CTableRow
                  key={step.id}
                  id={`step-${step.id}`}
                  className={`
                    ${stepValidations[step.id]?.hasIncompletePrerequisites ? 'text-muted' : ''} 
                    ${step.completed ? 'table-success' : ''}
                    ${step.id === focusedStepId ? 'highlight-step' : ''}
                  `}
                >
                  <CTableDataCell className="text-center">
                    <CBadge color={step.completed ? "success" : "primary"} shape="rounded-pill">
                      {step.order}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex align-items-center">
                      {step.name}
                      {stepValidations[step.id]?.hasIncompletePrerequisites && (
                        <CTooltip content="Richiede il completamento delle fasi precedenti">
                          <CIcon icon={icon.cilWarning} className="ms-2 text-warning" size="sm" />
                        </CTooltip>
                      )}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex align-items-center">
                      <CIcon icon={icon.cilUser} className="me-2" size="sm" />
                      {step.user?.name || 'N/D'}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {getStepStatusButton(step)}
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        {(updateStepMutation.isLoading || completeTaskMutation.isLoading) && (
          <CAlert color="info" className="d-flex align-items-center mt-3">
            <CSpinner size="sm" className="me-2" />
            {completeTaskMutation.isLoading
              ? 'Archiviazione task in corso...'
              : 'Aggiornamento in corso...'
            }
          </CAlert>
        )}
      </CModalBody>
      <ConfirmDialog />

    </CModal>
  );
};

export default ModalSteps;
