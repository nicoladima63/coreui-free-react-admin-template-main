import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';

import {
  CCard, CCardText, CCardTitle, CCardFooter, CBadge,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup,
  CProgress, CProgressBar
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import FilterGroupButton from '../../components/FilterGroupButton';
import ModalNew from './ModalNew';
import ModalSteps from './ModalSteps';
import MessagesSection from './MessagesSection';
import { TasksService, StepsService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('incomplete');
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const currentUser = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { isConnected } = useWebSocket();

  // Query per ottenere i task della dashboard
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.TASKS],
    queryFn: TasksService.getTasksForDashboard,
  });

  // Mutation per creare un nuovo task
  const createTaskMutation = useMutation({
    mutationFn: TasksService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      setModalAddVisible(false);
    },
    onError: (error) => {
      console.error('Errore durante la creazione del task:', error);
    },
  });


  // Filtra i task in base al filtro selezionato
  const getFilteredTasks = () => {
    switch (selectedFilter) {
      case 'completed':
        return tasks.filter((task) => task.completed === true);
      case 'incomplete':
        return tasks.filter((task) => task.completed === false);
      default:
        return tasks;
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const handleSaveTask = async (taskData) => {
    await createTaskMutation.mutateAsync(taskData);
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
      Nessuna fase disponibile.
    </CAlert>
  );

  const filteredTasks = getFilteredTasks();

  return (
    <CRow>
      <CCol xs={12} xl={2}>
        <div>
          <CBadge color={isConnected ? 'success' : 'danger'}>
            {isConnected ? 'Connesso' : 'Disconnesso'}
          </CBadge>

        {/*  {currentUser && <MessagesSection userId={currentUser.id} />}*/}
        </div>
      </CCol>

      <CCol xs={12} lg={10}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Flussi di lavoro</h4>
              <FilterGroupButton
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
              />
              <CButtonGroup>
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => setModalAddVisible(true)}
                >
                  <CIcon icon={icon.cilPlus} />
                </CButton>
                <CButton
                  size="sm"
                  color="info"
                  onClick={() => queryClient.invalidateQueries([QUERY_KEYS.TASKS])}
                >
                  <CIcon icon={icon.cilHistory} size="sm" />
                </CButton>
              </CButtonGroup>
            </div>
          </CCardHeader>

          <CCardBody>
            {isLoading ? (
              renderLoading()
            ) : error ? (
              renderError(error)
            ) : tasks.length === 0 ? (
              renderEmptyState()
            ) : (
              <CRow xs={{ gutter: 4 }}>
                {filteredTasks.map((task) => (
                  <TaskWidget key={task.id} task={task} />
                ))}
              </CRow>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {modalAddVisible && (
        <ModalNew
          visible={modalAddVisible}
          onClose={() => setModalAddVisible(false)}
          onSave={handleSaveTask}
        />
      )}
      <ConfirmDialog />
    </CRow>
  );
};

const TaskWidget = ({ task }) => {
  const queryClient = useQueryClient();
  const [isStepsModalVisible, setIsStepsModalVisible] = useState(false);

  // Ordina le fasi per order e calcola l'ultima fase completata
  const sortedSteps = [...task.steps].sort((a, b) => a.order - b.order);
  const completedSteps = task.steps?.filter((step) => step.completed).length || 0;
  const totalSteps = task.steps?.length || 0;

  // Trova l'ultimo step completato per mostrare il suo order nella progress bar
  const lastCompletedStep = sortedSteps
    .filter(step => step.completed)
    .sort((a, b) => b.order - a.order)[0]?.order || 0;

  // Calcola la percentuale di completamento per la progress bar
  const completionPercentage = (lastCompletedStep / totalSteps) * 100;

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, completed }) =>
      StepsService.updateStepStatus(stepId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento della fase:', error);
    },
  });

  const handleToggleStep = async (stepId, completed) => {
    await updateStepMutation.mutateAsync({ stepId, completed });
  };

  const formatDeliveryDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
  };

  // Calcola il colore della progress bar in base alla percentuale
  const getProgressColor = () => {
    if (completionPercentage === 100) return 'success';
    if (completionPercentage > 66) return 'info';
    if (completionPercentage > 33) return 'warning';
    return 'danger';
  };

  return (
    <>
      <CCol xs={12} sm={6} lg={3} xl={4} xxl={2}>
        <CCard className="text-center">
          <CCardHeader style={{ backgroundColor: task.work.category.color }}>
            <div className="d-flex justify-content-between align-items-center text-white bold">
              <h6 className="mb-0">{task.work.name}</h6>
            </div>
          </CCardHeader>
          <CCardBody>
            <CCardTitle>Paz: {task.patient}</CCardTitle>
            <CCardText>
              Consegna per <br /> {formatDeliveryDate(task.deliveryDate)}
            </CCardText>
            <div className="mt-3">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>0</span>
                <span>{totalSteps}</span>
              </div>
              <CProgress className="mb-1">
                <CProgressBar
                  color={getProgressColor()}
                  value={completionPercentage}
                />
              </CProgress>
              <div className="text-center small">
                Fase {lastCompletedStep} di {totalSteps}
              </div>
            </div>
          </CCardBody>
          <CCardFooter
            className="text-body-secondary"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsStepsModalVisible(true)}
          >
            <div>
              {`${completedSteps} fasi completate`}
              <br />
              {`su ${totalSteps}`}
              <CIcon icon={icon.cilArrowRight} className="float-end" width={16} />
            </div>
          </CCardFooter>
        </CCard>
      </CCol>
      <ModalSteps
        visible={isStepsModalVisible}
        onClose={() => setIsStepsModalVisible(false)}
        task={task}
        onToggleStep={handleToggleStep}
      />
    </>
  );
};

export default Dashboard;
