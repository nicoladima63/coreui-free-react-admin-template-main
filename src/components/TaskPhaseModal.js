import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react';

const TaskPhaseModal = ({ taskId, visible, onClose }) => {
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    if (visible) {
      // Carica le fasi del task quando la modal è visibile
      axios
        .get(`http://localhost:5000/api/tasks/${taskId}/phases`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((response) => {
          setPhases(response.data);
        })
        .catch((error) => {
          console.error('Errore nel recupero delle fasi:', error);
        });
    }
  }, [taskId, visible]);

  // Funzione per completare una fase
  const handleCompletePhase = (phaseId) => {
    axios
      .put(
        `http://localhost:5000/api/tasks/phases/${phaseId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      .then(() => {
        // Aggiorna lo stato della fase localmente
        setPhases((prevPhases) =>
          prevPhases.map((phase) =>
            phase.id === phaseId ? { ...phase, status: 'completato' } : phase
          )
        );
      })
      .catch((error) => {
        console.error('Errore nell\'aggiornamento della fase:', error);
      });
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>Fasi del Task {taskId}</h5>
      </CModalHeader>
      <CModalBody>
        <CTable>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>ID Fase</CTableHeaderCell>
              <CTableHeaderCell>Descrizione</CTableHeaderCell>
              <CTableHeaderCell>Stato</CTableHeaderCell>
              <CTableHeaderCell>Azioni</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {phases.map((phase) => (
              <CTableRow key={phase.id}>
                <CTableDataCell>{phase.id}</CTableDataCell>
                <CTableDataCell>{phase.description}</CTableDataCell>
                <CTableDataCell>{phase.status}</CTableDataCell>
                <CTableDataCell>
                  {phase.status !== 'completato' && (
                    <CButton
                      color="success"
                      onClick={() => handleCompletePhase(phase.id)}
                    >
                      Completa
                    </CButton>
                  )}
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CModalBody>
    </CModal>
  );
};

export default TaskPhaseModal;
