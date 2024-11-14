import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';

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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

// ModalSteps.js
const ModalSteps = ({ visible, onClose, task, onToggleStep }) => {
  const queryClient = useQueryClient();
  const { showError } = useToast();

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

  // Computed values with useMemo e controllo sicuro
  const sortedSteps = useMemo(() => {
    if (!task?.steps) return [];
    return [...task.steps].sort((a, b) => a.order - b.order);
  }, [task?.steps]);

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
      await updateStepMutation.mutateAsync({ stepId, completed });
    } catch (error) {
      console.error('Error toggling step:', error);
    }
  }, [updateStepMutation]);

  const getStepStatusButton = useCallback((step) => {
    if (!step || !stepValidations[step.id]) return null;

    const validation = stepValidations[step.id];
    const canComplete = validation.canComplete;

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
            disabled={!canComplete && !step.completed || updateStepMutation.isLoading}
            className={updateStepMutation.isLoading ? 'position-relative' : ''}
          >
            {updateStepMutation.isLoading && step.id === updateStepMutation.variables?.stepId ? (
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

  // Early return se non c'è task
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
                backgroundColor: task.work?.category?.color || '#6c757d',
                padding: '0.5em 1em'
              }}
            >
              {task.work?.name || 'N/D'}
            </CBadge>
            <span className="mx-2">-</span>
            <span className="text-muted">Paziente: {task.patient || 'N/D'}</span>
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
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
                  className={`${stepValidations[step.id]?.hasIncompletePrerequisites ? 'text-muted' : ''} ${step.completed ? 'table-success' : ''
                    }`}
                >
                  <CTableDataCell className="text-center">
                    <CBadge
                      color={step.completed ? "success" : "primary"}
                      shape="rounded-pill"
                    >
                      {step.order}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex align-items-center">
                      {step.name}
                      {stepValidations[step.id]?.hasIncompletePrerequisites && (
                        <CTooltip content="Richiede il completamento delle fasi precedenti">
                          <CIcon
                            icon={icon.cilWarning}
                            className="ms-2 text-warning"
                            size="sm"
                          />
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

        {updateStepMutation.isLoading && (
          <CAlert color="info" className="d-flex align-items-center mt-3">
            <CSpinner size="sm" className="me-2" />
            Aggiornamento in corso...
          </CAlert>
        )}
      </CModalBody>
    </CModal>
  );
};

export default ModalSteps;
