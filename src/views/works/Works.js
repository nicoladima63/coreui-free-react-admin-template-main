import React, { useState, useCallback, useMemo } from 'react';
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
  CSpinner,
  CAlert,
  CFormInput,
  CInputGroup,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CBadge,
  CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import ModalWork from './ModalWork';
import ModalStep from './ModalStep';
import { WorksService, StepsTempService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';

const WorksView = () => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showError, showSuccess, showInfo } = useToast();

  // Stati locali
  const [selectedWork, setSelectedWork] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isWorkModalVisible, setIsWorkModalVisible] = useState(false);
  const [isStepModalVisible, setIsStepModalVisible] = useState(false);
  const [activeWorkId, setActiveWorkId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categoryid: '',
    providerid: '',
    status: ''
  });
  const [sort, setSort] = useState({ field: 'id', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Query principale per i works con filtri, ordinamento e paginazione
  const {
    data: worksData = { works: [], total: 0, pages: 0 },
    isLoading: isWorksLoading,
    error: worksError,
    isFetching: isWorksFetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.WORKS, filters, sort, page, pageSize, searchTerm],
    queryFn: () => WorksService.getWorks({
      page,
      limit: pageSize,
      search: searchTerm,
      ...filters,
      sort: sort.field,
      order: sort.direction.toUpperCase()
    }),
    keepPreviousData: true
  });

  // Query per gli step di un work
  const {
    data: steps = [],
    isLoading: isStepsLoading,
    error: stepsError,
  } = useQuery({
    queryKey: [QUERY_KEYS.STEPSTEMP, activeWorkId],
    queryFn: () => StepsTempService.getStepsForWork(activeWorkId),
    enabled: !!activeWorkId,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: WorksService.deleteWork,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
      showToast({
        message: 'Lavorazione eliminata con successo',
        type: 'success'
      });
    },
    onError: (error) => {
      showToast({
        message: `Errore durante l'eliminazione: ${error.message}`,
        type: 'error'
      });
    }
  });


  const reorderStepsMutation = useMutation({
    mutationFn: WorksService.reorderSteps,
    onSuccess: (data) => {

      // Invalida la query per ricaricare i dati aggiornati
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP, activeWorkId]);

      // Mostra il messaggio di successo
      showSuccess({
        message: 'Ordine fasi aggiornato',
        type: 'success'
      });

      // Aggiorna lo stato locale con i dati aggiornati (usando i passi riordinati)
      setSteps(data.steps);  // Utilizza i passi restituiti dalla risposta della mutazione
    },
    onError: (error) => {
      // Gestione degli errori
      showError({
        message: error.message || 'Errore durante l\'aggiornamento degli steps',
        type: 'error'
      });
    }
  });

  // Handlers
  const handleDeleteWork = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questa lavorazione? Verranno eliminate anche tutte le fasi associate.',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      confirmColor: 'danger'
    });

    if (confirmed) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleDuplicateWork = async (work) => {
    try {
      const newName = await showConfirmDialog({
        title: 'Duplica lavorazione',
        message: 'Inserisci il nome per la nuova lavorazione:',
        input: true,
        inputValue: `${work.name} (Copy)`,
        confirmText: 'Duplica',
        cancelText: 'Annulla'
      });

      if (newName) {
        const result = await WorksService.duplicateWork(work.id, newName);
        showToast({
          message: 'Lavorazione duplicata con successo',
          type: 'success'
        });
        queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
      }
    } catch (error) {
      showToast({
        message: `Errore durante la duplicazione: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleExportWork = async (work) => {
    try {
      const data = await WorksService.exportWork(work.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-${work.name}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        message: `Errore durante l'esportazione: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleImportWork = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
          const data = JSON.parse(event.target.result);
          await WorksService.importWork(data);
          showToast({
            message: 'Lavorazione importata con successo',
            type: 'success'
          });
          queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
        };
        reader.readAsText(file);
      } catch (error) {
        showToast({
          message: `Errore durante l'importazione: ${error.message}`,
          type: 'error'
        });
      }
    };
    input.click();
  };

  const handleDragEnd2 = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Crea una copia dell'array `steps`
    const reorderedSteps = Array.from(steps);

    // Rimuove l'elemento dalla posizione `source.index`
    const [movedStep] = reorderedSteps.splice(source.index, 1);

    // Inserisce l'elemento nella nuova posizione `destination.index`
    reorderedSteps.splice(destination.index, 0, movedStep);

    // Aggiorna gli indici di `order` degli elementi
    const updatedSteps = reorderedSteps.map((step, index) => ({
      ...step,
      order: index + 1, // Aggiorna l'ordine in base alla nuova posizione
    }));

    // Aggiorna lo stato di steps con il nuovo array riordinato
    setSteps(updatedSteps);

    // Se desiderato, puoi inviare l'array riordinato al server
    // await updateStepsOrderInServer(updatedSteps);
  };

  const handleDragEnd1 = async (result) => {

    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const reorderedSteps = Array.from(steps);
    const [removed] = reorderedSteps.splice(sourceIndex, 1);
    reorderedSteps.splice(destIndex, 0, removed);

    // Aggiorna gli ordini
    const updatedSteps = reorderedSteps.map((step, index) => ({
      ...step,
      order: index + 1
    }));

    try {
      await reorderStepsMutation.mutateAsync({
        workId: activeWorkId,
        steps: updatedSteps
      });
    } catch (error) {
      showToast({
        message: `Errore durante il riordino: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleDragEnd3 = async (result) => {
    if (!result.destination) return;
    console.log('activeworkid', activeWorkId);
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const reorderedSteps = Array.from(steps);
    const [removed] = reorderedSteps.splice(sourceIndex, 1);
    reorderedSteps.splice(destIndex, 0, removed);

    // Aggiorna gli ordini
    const updatedSteps = reorderedSteps.map((step, index) => ({
      ...step,
      order: index + 1
    }));

    // Chiamata alla mutazione
    try {
      await reorderStepsMutation.mutateAsync({
        workId: activeWorkId,
        steps: updatedSteps
      });
    } catch (error) {
      showError({
        message: `Errore durante il riordino: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const reorderedSteps = Array.from(steps);
    const [removed] = reorderedSteps.splice(sourceIndex, 1); // Rimuoviamo l'elemento
    reorderedSteps.splice(destIndex, 0, removed); // Inseriamo nella nuova posizione

    // Ora aggiorniamo l'ordine per tutti i passi
    const updatedSteps = reorderedSteps.map((step, index) => ({
      ...step,
      order: index + 1  // Impostiamo l'ordine (1-based)
    }));

    // Inviamo la richiesta per riordinare tutti i passi
    try {
      await reorderStepsMutation.mutateAsync({
        workId: activeWorkId,
        steps: updatedSteps
      });
    } catch (error) {
      showToast({
        message: `Errore durante il riordino: ${error.message}`,
        type: 'error'
      });
    }
  };


  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleSort = useCallback((field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  // Computed values
  const filteredWorks = useMemo(() => worksData.works, [worksData]);

  // Render helpers
  const renderError = (error) => (
    <CAlert color="danger" className="text-center">
      {error?.message || 'Si è verificato un errore'}
    </CAlert>
  );

  const renderLoading = () => (
    <div className="text-center p-3">
      <CSpinner color="primary" />
    </div>
  );

  const renderEmptyState = () => (
    <CAlert color="warning" className="text-center">
      Nessuna lavorazione disponibile
    </CAlert>
  );

  const CategoryBadge = ({ category }) => {
    if (!category) return <CBadge color="light">Non assegnata</CBadge>;

    return (
      <CBadge
        style={{
          backgroundColor: category.color || '#6c757d',
          color: isLightColor(category.color) ? '#000' : '#fff'
        }}
      >
        {category.name}
      </CBadge>
    );
  };

  // Funzione helper per determinare se un colore è chiaro
  const isLightColor = (color) => {
    if (!color) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };


  const renderStepsTable = (workId) => (
    <CTableRow>
      <CTableDataCell colSpan="5">
        {isStepsLoading ? (
          renderLoading()
        ) : stepsError ? (
          renderError(stepsError)
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`work-${workId}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <CTable small bordered borderColor="secondary">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: '50px' }}>#</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Ordine</CTableHeaderCell>
                        <CTableHeaderCell>Nome fase</CTableHeaderCell>
                        <CTableHeaderCell>Operatore</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Azioni</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {steps.map((step, index) => (
                        <Draggable
                          key={step.id}
                          draggableId={`step-${step.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <CTableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'dragging' : ''}
                            >
                              <CTableDataCell style={{ width: '50px', color: 'lightgray' }}>{step.id}</CTableDataCell>
                              <CTableDataCell style={{ width: '50px' }} className="text-center">
                                {step.order}
                              </CTableDataCell>
                              <CTableDataCell>{step.name}</CTableDataCell>
                              <CTableDataCell>{step.user?.name}</CTableDataCell>
                              <CTableDataCell className="text-end">
                                <CButtonGroup size="sm">
                                  <CButton
                                    color="warning"
                                    onClick={() => {
                                      setSelectedStep(step);
                                      setIsStepModalVisible(true);
                                    }}
                                  >
                                    <CIcon icon={icon.cilPencil} />
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    onClick={() => handleDeleteStep(step.id)}
                                  >
                                    <CIcon icon={icon.cilTrash} />
                                  </CButton>
                                </CButtonGroup>
                              </CTableDataCell>
                            </CTableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
        <div className="text-end mt-2">
          <CButton
            color="primary"
            size="sm"
            onClick={() => {
              setSelectedStep(null);
              setIsStepModalVisible(true);
            }}
          >
            <CIcon icon={icon.cilPlus} className="me-2" />
            Nuova Fase
          </CButton>
        </div>
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

              <div className="d-flex gap-2">
                <CInputGroup size="sm" className="w-auto">
                  <CFormInput
                    placeholder="Cerca..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchTerm && (
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => handleSearch('')}
                    >
                      <CIcon icon={icon.cilX} />
                    </CButton>
                  )}
                </CInputGroup>

                <CButtonGroup size="sm">
                  <CButton
                    color="primary"
                    onClick={() => {
                      setSelectedWork(null);
                      setIsWorkModalVisible(true);
                    }}
                  >
                    <CIcon icon={icon.cilPlus} className="me-2" />
                    Nuova
                  </CButton>

                  <CButton
                    color="success"
                    onClick={handleImportWork}
                  >
                    <CIcon icon={icon.cilCloudUpload} className="me-2" />
                    Importa
                  </CButton>

                  <CButton
                    color="info"
                    onClick={() => queryClient.invalidateQueries([QUERY_KEYS.WORKS])}
                  >
                    <CIcon icon={icon.cilReload} />
                  </CButton>
                </CButtonGroup>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {isWorksLoading ? (
              renderLoading()
            ) : worksError ? (
              renderError(worksError)
            ) : filteredWorks.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell
                        className="cursor-pointer"
                        onClick={() => handleSort('id')}
                      >
                        #ID
                        {sort.field === 'id' && (
                          <CIcon
                            icon={sort.direction === 'asc' ? icon.cilArrowTop : icon.cilArrowBottom}
                            className="ms-1"
                          />
                        )}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        className="cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        Nome Lavorazione
                        {sort.field === 'name' && (
                          <CIcon
                            icon={sort.direction === 'asc' ? icon.cilArrowTop : icon.cilArrowBottom}
                            className="ms-1"
                          />
                        )}
                      </CTableHeaderCell>
                      <CTableHeaderCell>Categoria</CTableHeaderCell>
                      <CTableHeaderCell>Fornitore</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Azioni</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredWorks.map((work) => (
                      <React.Fragment key={work.id}>
                        <CTableRow>
                          <CTableDataCell>{work.id}</CTableDataCell>
                          <CTableDataCell>
                            <strong>{work.name}</strong>
                            {work.description && (
                              <div className="small text-muted">
                                {work.description}
                              </div>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CategoryBadge category={work.category} />
                          </CTableDataCell>
                          <CTableDataCell>{work.provider?.name}</CTableDataCell>
                          <CTableDataCell className="text-end">
                            <CButtonGroup size="sm">
                              <CTooltip content="Modifica">
                                <CButton
                                  color="warning"
                                  onClick={() => {
                                    setSelectedWork(work);
                                    setIsWorkModalVisible(true);
                                  }}
                                >
                                  <CIcon icon={icon.cilPencil} />
                                </CButton>
                              </CTooltip>

                              <CTooltip content="Elimina">
                                <CButton
                                  color="danger"
                                  onClick={() => handleDeleteWork(work.id)}
                                >
                                  <CIcon icon={icon.cilTrash} />
                                </CButton>
                              </CTooltip>

                              <CTooltip content="Duplica">
                                <CButton
                                  color="info"
                                  onClick={() => handleDuplicateWork(work)}
                                >
                                  <CIcon icon={icon.cilCopy} />
                                </CButton>
                              </CTooltip>

                              <CTooltip content="Esporta">
                                <CButton
                                  color="success"
                                  onClick={() => handleExportWork(work)}
                                >
                                  <CIcon icon={icon.cilCloudDownload} />
                                </CButton>
                              </CTooltip>

                              <CTooltip content="Gestisci fasi">
                                <CButton
                                  color="primary"
                                  onClick={() => setActiveWorkId(
                                    activeWorkId === work.id ? null : work.id
                                  )}
                                >
                                  <CIcon icon={icon.cilList} />
                                </CButton>
                              </CTooltip>
                            </CButtonGroup>
                          </CTableDataCell>
                        </CTableRow>
                        {activeWorkId === work.id && renderStepsTable(work.id)}
                      </React.Fragment>
                    ))}
                  </CTableBody>
                </CTable>

                {/* Paginazione */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                      {[10, 20, 30, 50].map(size => (
                        <option key={size} value={size}>
                          {size} per pagina
                        </option>
                      ))}
                    </select>
                    <span className="text-muted">
                      {`${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, worksData.total)} di ${worksData.total}`}
                    </span>
                  </div>

                  <CButtonGroup size="sm">
                    <CButton
                      color="primary"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <CIcon icon={icon.cilChevronLeft} />
                    </CButton>
                    <CButton
                      color="primary"
                      disabled={page === worksData.pages}
                      onClick={() => setPage(p => Math.min(worksData.pages, p + 1))}
                    >
                      <CIcon icon={icon.cilChevronRight} />
                    </CButton>
                  </CButtonGroup>
                </div>
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Modals */}
      <ModalWork
        visible={isWorkModalVisible}
        onClose={() => setIsWorkModalVisible(false)}
        selectedWork={selectedWork}
      />

      <ModalStep
        visible={isStepModalVisible}
        onClose={() => setIsStepModalVisible(false)}
        selectedStep={selectedStep}
        workId={activeWorkId}
      />

      <ConfirmDialog />
    </CRow>
  );
};

export default WorksView;
