import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CButtonGroup,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
  CTableCaption,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import ModalWork from './ModalWork';
import ModalStep from './ModalStep';
import { WorksService, StepsTempService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';

const WorksView = () => {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isWorkModalVisible, setIsWorkModalVisible] = useState(false);
  const [isStepModalVisible, setIsStepModalVisible] = useState(false);
  const [activeWorkId, setActiveWorkId] = useState(null);
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Query per le lavorazioni
  const {
    data: works = [],
    isLoading: isWorksLoading,
    error: worksError,
  } = useQuery({
    queryKey: [QUERY_KEYS.WORKS],
    queryFn: WorksService.getWorks,
  });

  // Query per le fasi di una lavorazione
  const {
    data: steps = [],
    isLoading: isStepsLoading,
    error: stepsError,
  } = useQuery({
    queryKey: [QUERY_KEYS.STEPSTEMP, activeWorkId],
    queryFn: () => StepsTempService.getStepsForWork(activeWorkId),
    enabled: !!activeWorkId,
  });

  // Mutation per creare un nuovo work
  const createWorkMutation = useMutation({
    mutationFn: WorksService.createWork,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
      setIsWorkModalVisible(false); // Chiudi il modale alla creazione
    },
    onError: (error) => {
      console.error('Errore durante la creazione della lavorazione:', error);
    },
  });

  // Mutation per aggiornare un work
  const updateWorkMutation = useMutation({
    mutationFn: WorksService.updateWork,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
      setIsWorkModalVisible(false); // Chiudi il modale dopo l'aggiornamento
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento della lavorazione:', error);
    },
  });

  // Mutation per eliminazione lavorazione
  const deleteMutation = useMutation({
    mutationFn: WorksService.deleteWork,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
    },
  });

  const handleDeleteWork = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questa lavorazione?',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
      }
    }
  };
  const handleSaveWork = async (workData) => {
    if (workData.id) {
      await updateWorkMutation.mutateAsync(workData); // Modifica esistente
    } else {
      await createWorkMutation.mutateAsync(workData); // Creazione nuova
    }
  };





  // Mutation per creare un nuova fase
  const createStepMutation = useMutation({
    mutationFn: StepsTempService.createStep,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP]);
      setIsStepModalVisible(false); // Chiudi il modale alla creazione
    },
    onError: (error) => {
      console.error('Errore durante la creazione della fase:', error);
    },
  });

  // Mutation per aggiornare una fase
  const updateStepMutation = useMutation({
    mutationFn: StepsTempService.updateStep,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP]);
      setIsStepModalVisible(false); // Chiudi il modale dopo l'aggiornamento
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento della fase:', error);
    },
  });

  // Mutation per eliminazione fase
  const deleteStepMutation = useMutation({
    mutationFn: StepsTempService.deleteStep,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP, activeWorkId]);
    },
  });

  // Funzione per aprire e chiudere la grid delle fasi
  const handleOpenSteps = useCallback((workId) => {
    setActiveWorkId((prevId) => (prevId === workId ? null : workId));
  }, []);


  const handleDeleteStep = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questa fase?',
    });

    if (confirmed) {
      try {
        await deleteStepMutation.mutateAsync(id);
      } catch (error) {
        console.error('Errore durante l\'eliminazione della fase:', error);
      }
    }
  };


  const handleSaveStep = async (stepData) => {
    if (stepData.id) {
      await updateStepMutation.mutateAsync(stepData); // Modifica esistente
    } else {
      await createStepMutation.mutateAsync(stepData); // Creazione nuova
    }
  };



  const renderError = (error) => (
    <CAlert color="danger" className="text-center">
      {error?.message || API_ERROR_MESSAGES.GENERIC_ERROR}
    </CAlert>
  );

  const renderLoading = () => (
    <div className="text-center">
      <CSpinner color="primary" />
    </div>
  );

  const renderEmptyState = () => (
    <CAlert color="warning" className="text-center">
      Nessuna lavorazione disponibile.
    </CAlert>
  );

  const renderStepsTable = (workId) => (
    <CTableRow>
      <CTableDataCell colSpan="5">
        {isStepsLoading ? (
          renderLoading()
        ) : stepsError ? (
          renderError(stepsError)
        ) : (
          <CTable small bordered borderColor="secondary">
            <CTableCaption>Fasi della lavorazione</CTableCaption>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#ID Fase</CTableHeaderCell>
                <CTableHeaderCell>Ordine</CTableHeaderCell>
                <CTableHeaderCell>Nome fase</CTableHeaderCell>
                <CTableHeaderCell>Operatore</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Stato</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Azioni</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {steps.map((step) => (
                <CTableRow key={step.id}>
                  <CTableDataCell>{step.id}</CTableDataCell>
                  <CTableDataCell>{step.order}</CTableDataCell>
                  <CTableDataCell>{step.name}</CTableDataCell>
                  <CTableDataCell>{step.user.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    {step.completed ? (
                      <CIcon icon={icon.cilCheckCircle} className="text-success" />
                    ) : (
                      <CIcon icon={icon.cilXCircle} className="text-danger" />
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CButtonGroup>
                      <CButton color="warning" size="sm"
                        onClick={() => {
                          setSelectedItem(step);
                          setIsStepModalVisible(true);
                        }}
                      >
                        <CIcon icon={icon.cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        size="sm"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        <CIcon icon={icon.cilTrash} />
                      </CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>
              ))}

              <CTableHead>
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-end">
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(null);

                        setIsStepModalVisible(true);
                      }}
                    >Nuova Fase
                      <CIcon icon={icon.cilPlus} />
                    </CButton>

                  </CTableDataCell>
                </CTableRow>
              </CTableHead>


            </CTableBody>
          </CTable>
        )}
      </CTableDataCell>
    </CTableRow>
  );

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestione Lavorazioni</h4>
              <CButtonGroup>
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(null);
                    setIsWorkModalVisible(true);
                  }}
                >
                  <CIcon icon={icon.cilPlus} className="me-2" />
                  Nuova
                </CButton>
                <CButton
                  color="info"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries([QUERY_KEYS.WORKS])}
                >
                  <CIcon icon={icon.cilReload} />
                </CButton>
              </CButtonGroup>
            </div>
          </CCardHeader>
          <CCardBody>
            {isWorksLoading ? (
              renderLoading()
            ) : worksError ? (
              renderError(worksError)
            ) : works.length === 0 ? (
              renderEmptyState()
            ) : (
              <CTable hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#ID Lavorazione</CTableHeaderCell>
                    <CTableHeaderCell>Nome Lavorazione</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Stato</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {works.map((work) => (
                    <React.Fragment key={work.id}>
                      <CTableRow>
                        <CTableDataCell>{work.id}</CTableDataCell>
                        <CTableDataCell>{work.name}</CTableDataCell>
                        <CTableDataCell className="text-center">
                          {work.completed ? (
                            <CIcon icon={icon.cilCheckCircle} className="text-success" />
                          ) : (
                            <CIcon icon={icon.cilXCircle} className="text-danger" />
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButtonGroup>
                            <CButton color="warning" size="sm"
                              onClick={() => {
                                setSelectedItem(work);
                                setIsWorkModalVisible(true);
                              }}
                            >
                              <CIcon icon={icon.cilPencil} />
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              onClick={() => handleDeleteWork(work.id)}
                            >
                              <CIcon icon={icon.cilTrash} />
                            </CButton>
                            <CButton
                              color="info"
                              size="sm"
                              onClick={() => handleOpenSteps(work.id)}
                            >
                              <CIcon icon={icon.cilList} />
                            </CButton>
                          </CButtonGroup>
                        </CTableDataCell>
                      </CTableRow>
                      {activeWorkId === work.id && renderStepsTable(work.id)}
                    </React.Fragment>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {isWorkModalVisible && (
        <ModalWork
          visible={isWorkModalVisible}
          onClose={() => setIsWorkModalVisible(false)}
          onSave={handleSaveWork}
          selectedWork={selectedItem} // Passa il work selezionato per l'aggiornamento
        />
      )}
      {isStepModalVisible && (
        <ModalStep
          visible={isStepModalVisible}
          onClose={() => setIsStepModalVisible(false)}
          onSave={handleSaveStep}
          selectedStep={selectedItem} // Passa la fase selezionata per l'aggiornamento
        />
      )}
      <ConfirmDialog />
    </CRow>
  );
};

export default WorksView;
