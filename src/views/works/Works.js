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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      showSuccess('Lavorazione eliminata con successo');
    },
    onError: (error) => {
      showError(error);
    }
  });

  const deleteStepMutation = useMutation({
    mutationFn: StepsTempService.deleteStep,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP, activeWorkId]);
      showSuccess('Fase eliminata con successo');
    },
    onError: (error) => {
      showError(error);
    }
  });

  const reorderStepsMutation = useMutation({
    mutationFn: WorksService.reorderSteps,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.STEPSTEMP, activeWorkId]);
      showSuccess('Ordine fasi aggiornato');
    },
    onError: (error) => {
      showError(error);
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        showSuccess('Lavorazione duplicata con successo');
        queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
      }
    } catch (error) {
      showError(error);
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
      showError(error);
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
          showSuccess('Lavorazione importata con successo');
          queryClient.invalidateQueries([QUERY_KEYS.WORKS]);
        };
        reader.readAsText(file);
      } catch (error) {
        showError(error);
      }
    };
    input.click();
  };

  const handleDeleteStep = async (stepId) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questa fase? L\'operazione non può essere annullata.',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      confirmColor: 'danger'
    });

    if (confirmed) {
      try {
        await deleteStepMutation.mutateAsync(stepId);
      } catch (error) {
        // L'errore verrà gestito dal onError della mutation
        console.error('Error deleting step:', error);
      }
    }
  };
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) return;

    const oldIndex = steps.findIndex(step => step.id === active.id);
    const newIndex = steps.findIndex(step => step.id === over.id);

    // Prendiamo tutti gli step originali
    const origSteps = [...steps];

    // Rimuoviamo lo step dalla vecchia posizione
    const [movedStep] = origSteps.splice(oldIndex, 1);

    // Lo inseriamo nella nuova posizione
    origSteps.splice(newIndex, 0, movedStep);

    // Ora ricalcoliamo gli order per mantenere la sequenza 1,2,3,4,5...
    const updatedSteps = origSteps.map((step, index) => ({
      id: step.id,
      workid: activeWorkId,
      order: index + 1  // Questo garantisce la sequenza 1,2,3,4,5
    }));

    try {
      await reorderStepsMutation.mutateAsync({
        workId: activeWorkId,
        steps: updatedSteps
      });
    } catch (error) {
      console.error('Error reordering steps:', error);
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
        ) : !steps?.length ? (
          <CAlert color="info">
            Nessuna fase presente per questa lavorazione
          </CAlert>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            disabled={reorderStepsMutation.isLoading}
          >
            <CTable small bordered borderColor="secondary">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: '50px' }}></CTableHeaderCell>
                  <CTableHeaderCell className="text-center" style={{ width: '80px' }}>Ordine</CTableHeaderCell>
                  <CTableHeaderCell>Nome fase</CTableHeaderCell>
                  <CTableHeaderCell>Operatore</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Azioni</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <SortableContext
                  items={steps.map(step => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {steps
                    .sort((a, b) => (a.order || 0) - (b.order || 0)) // Garantiamo l'ordinamento corretto
                    .map((step) => (
                      <SortableStepRow
                        key={step.id}
                        step={step}
                        onEdit={(step) => {
                          setSelectedStep(step);
                          setIsStepModalVisible(true);
                        }}
                        onDelete={handleDeleteStep}
                        isReordering={reorderStepsMutation.isLoading}
                      />
                    ))}
                </SortableContext>
              </CTableBody>
            </CTable>
          </DndContext>
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

  // Sortable Step Row Component
  const SortableStepRow = ({ step, onEdit, onDelete, isReordering }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: step.id,
      disabled: isReordering
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : isReordering ? 0.7 : 1,
      backgroundColor: isDragging ? '#f8f9fa' : undefined,
      cursor: isReordering ? 'wait' : undefined,
    };

    return (
      <CTableRow
        ref={setNodeRef}
        style={style}
        {...attributes}
      >
        <CTableDataCell style={{ width: '50px', color: 'lightgray' }}>
          <div
            {...listeners}
            style={{
              cursor: isReordering ? 'wait' : 'grab',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CIcon icon={icon.cilMenu} />
          </div>
        </CTableDataCell>
        <CTableDataCell style={{ width: '80px' }} className="text-center">
          {step.order || '-'}
        </CTableDataCell>
        <CTableDataCell>{step.name}</CTableDataCell>
        <CTableDataCell>{step.user?.name || '-'}</CTableDataCell>
        <CTableDataCell className="text-end">
          <CButtonGroup size="sm">
            <CTooltip content="Modifica">
              <CButton
                color="warning"
                onClick={() => onEdit(step)}
                disabled={isReordering}
              >
                <CIcon icon={icon.cilPencil} />
              </CButton>
            </CTooltip>
            <CTooltip content="Elimina">
              <CButton
                color="danger"
                onClick={() => onDelete(step.id)}
                disabled={isReordering}
              >
                <CIcon icon={icon.cilTrash} />
              </CButton>
            </CTooltip>
          </CButtonGroup>
        </CTableDataCell>
      </CTableRow>
    );
  };

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
