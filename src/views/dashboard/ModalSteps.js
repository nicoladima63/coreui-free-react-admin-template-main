import React from 'react';
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

const ModalSteps = ({ visible, onClose, task, onToggleStep }) => {
  // Ordina le fasi per il campo order
  const sortedSteps = [...task.steps].sort((a, b) => a.order - b.order);

  // Controlla se una fase può essere completata
  const canCompleteStep = (currentStep) => {
    // Trova tutte le fasi precedenti
    const previousSteps = sortedSteps.filter(step => step.order < currentStep.order);
    // Verifica se tutte le fasi precedenti sono completate
    return previousSteps.length === 0 || previousSteps.every(step => step.completed);
  };

  const getStepStatusButton = (step) => {
    const canComplete = canCompleteStep(step);

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
        <span>
          <CButton
            color={step.completed ? "success" : canComplete ? "danger" : "secondary"}
            size="sm"
            variant="ghost"
            onClick={() => canComplete && onToggleStep(step.id, !step.completed)}
            disabled={!canComplete && !step.completed}
          >
            <CIcon
              icon={step.completed ? icon.cilCheckCircle : icon.cilXCircle}
            />
          </CButton>
        </span>
      </CTooltip>
    );
  };

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader>
        <CModalTitle>
          Fasi della lavorazione: {task.work.name} - Paziente: {task.patient}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CTable small>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Ordine</CTableHeaderCell>
              <CTableHeaderCell>Fase</CTableHeaderCell>
              <CTableHeaderCell>Operatore</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Stato</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {sortedSteps.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan="4" className="text-center">
                  Nessuna fase disponibile
                </CTableDataCell>
              </CTableRow>
            ) : (
              sortedSteps.map((step) => (
                <CTableRow
                  key={step.id}
                  className={!canCompleteStep(step) && !step.completed ? "text-muted" : ""}
                >
                  <CTableDataCell>{step.order}</CTableDataCell>
                  <CTableDataCell>{step.name}</CTableDataCell>
                  <CTableDataCell>{step.user.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    {getStepStatusButton(step)}
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      </CModalBody>
    </CModal>
  );
};

export default ModalSteps;
