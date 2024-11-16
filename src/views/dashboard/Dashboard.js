import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
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
  CProgress, CProgressBar, CTooltip
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

// Dashboard.js
const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError, showInfo } = useToast();
  const auth = useSelector(state => state.auth);
  const { isConnected, socket } = useWebSocket();

  useEffect(() => {
    if (!auth?.user?.id) {
      navigate('/login');
      return;
    }

    // Gestione eventi WebSocket per i messaggi
    if (socket) {
      // Evento per nuovo messaggio ricevuto
      socket.on('newMessage', (message) => {
        // Mostra notifica toast
        if (message.recipientId === auth.user.id) {
          showInfo(`Nuovo messaggio da ${message.senderName}`);
          // Invalida la query dei messaggi per forzare il refresh
          queryClient.invalidateQueries([QUERY_KEYS.MESSAGES]);
        }
      });

      // Evento per messaggio letto
      socket.on('messageRead', (messageId) => {
        // Invalida la query dei messaggi per aggiornare lo stato
        queryClient.invalidateQueries([QUERY_KEYS.MESSAGES]);
      });

      // Pulizia listener al dismount
      return () => {
        socket.off('newMessage');
        socket.off('messageRead');
      };
    }
  }, [socket, auth?.user?.id, queryClient, showInfo, navigate]);

  // Se non autenticato, non renderizzare
  if (!auth?.user?.id) {
    return null;
  }

  const [selectedFilter, setSelectedFilter] = useState('incomplete');
  const [modalState, setModalState] = useState({
    addVisible: false,
    stepsVisible: false,
    selectedTask: null
  });

  // Query principale
  const {
    data: tasks = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: [QUERY_KEYS.TASKS],
    queryFn: TasksService.getTasksForDashboard,
    staleTime: 30000, // 30 secondi
    cacheTime: 5 * 60 * 1000, // 5 minuti
  });

  // Filtraggio tasks
  const filteredTasks = useMemo(() => {
    switch (selectedFilter) {
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'incomplete':
        return tasks.filter(task => !task.completed);
      default:
        return tasks;
    }
  }, [tasks, selectedFilter]);

  // Mutation per nuovo task
  const createTaskMutation = useMutation({
    mutationFn: TasksService.createTaskWithSteps,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      showSuccess('Task creato con successo');
      setModalState(prev => ({ ...prev, addVisible: false }));
    },
    onError: (error) => {
      showError(error);
    }
  });

  const handleOpenSteps = useCallback((task) => {
    setModalState(prev => ({
      ...prev,
      stepsVisible: true,
      selectedTask: task
    }));
  }, []);

  const handleCloseModal = useCallback((modalType) => {
    setModalState(prev => ({
      ...prev,
      [modalType]: false,
      selectedTask: null
    }));
  }, []);

  // Renderers
  const renderError = useCallback((error) => (
    <CAlert color="danger" className="text-center">
      {error?.message || 'Si è verificato un errore'}
    </CAlert>
  ), []);

  const renderLoading = useCallback(() => (
    <div className="text-center p-3">
      <CSpinner color="primary" />
    </div>
  ), []);

  const renderEmptyState = useCallback(() => (
    <CAlert color="info" className="text-center">
      Nessun task disponibile
    </CAlert>
  ), []);

  return (
    <CRow>
      {/* Sezione messaggi */}
      <CCol xs={12} xl={2}>
        <MessagesSection
          userId={auth.user.id}
          onNewMessage={(message) => {
            // Emetti evento WebSocket quando invii un nuovo messaggio
            socket?.emit('sendMessage', message);
          }}
          onMessageRead={(messageId) => {
            // Emetti evento WebSocket quando leggi un messaggio
            socket?.emit('markMessageAsRead', messageId);
          }}
        />
      </CCol>
      {/* Sezione principale */}
      <CCol xs={12} lg={10}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Flussi di lavoro</h4>

              <div className="d-flex gap-2 align-items-center">
                <FilterGroupButton
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                  disabled={isLoading || isFetching}
                />

                <CButtonGroup>
                  <CTooltip content="Nuovo task">
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={() => setModalState(prev => ({ ...prev, addVisible: true }))}
                      disabled={isLoading || isFetching}
                    >
                      <CIcon icon={icon.cilPlus} className="me-2" />
                      Nuova
                    </CButton>
                  </CTooltip>

                  <CTooltip content="Aggiorna">
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries([QUERY_KEYS.TASKS])}
                      disabled={isFetching}
                    >
                      <CIcon
                        icon={isFetching ? icon.cilReload : icon.cilSync}
                        className={isFetching ? 'spinner' : ''}
                      />
                    </CButton>
                  </CTooltip>
                </CButtonGroup>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {isLoading ? (
              renderLoading()
            ) : error ? (
              renderError(error)
            ) : filteredTasks.length === 0 ? (
              renderEmptyState()
            ) : (
              <CRow xs={{ gutter: 4 }}>
                {filteredTasks.map((task) => (
                  <TaskWidget
                    key={task.id}
                    task={task}
                    onOpenSteps={handleOpenSteps}
                  />
                ))}
              </CRow>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Modals */}
      <ModalNew
        visible={modalState.addVisible}
        onClose={() => handleCloseModal('addVisible')}
        onSave={createTaskMutation.mutateAsync}
      />

      <ModalSteps
        visible={modalState.stepsVisible}
        onClose={() => handleCloseModal('stepsVisible')}
        task={modalState.selectedTask}
      />

      <ConfirmDialog />
    </CRow>
  );
};


// components/TaskWidget.js
const TaskWidget = ({ task, onOpenSteps }) => {
  const queryClient = useQueryClient();
  const { showError } = useToast();

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, completed }) => StepsService.updateStepStatus(stepId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
    },
    onError: (error) => {
      showError(error);
    }
  });

  // Ordinamento e calcoli
  const sortedSteps = useMemo(() =>
    [...task.steps].sort((a, b) => a.order - b.order)
    , [task.steps]);

  const { completedSteps, totalSteps, lastCompletedStep, completionPercentage } = useMemo(() => {
    const completed = task.steps?.filter(step => step.completed).length || 0;
    const total = task.steps?.length || 0;
    const lastCompleted = sortedSteps
      .filter(step => step.completed)
      .sort((a, b) => b.order - a.order)[0]?.order || 0;
    const percentage = (lastCompleted / total) * 100;

    return {
      completedSteps: completed,
      totalSteps: total,
      lastCompletedStep: lastCompleted,
      completionPercentage: percentage
    };
  }, [task.steps, sortedSteps]);

  const getProgressColor = useCallback(() => {
    if (completionPercentage === 100) return 'success';
    if (completionPercentage > 66) return 'info';
    if (completionPercentage > 33) return 'warning';
    return 'danger';
  }, [completionPercentage]);

  const formatDeliveryDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  return (
    <CCol xs={12} sm={6} lg={3} xl={4} xxl={2}>
      <CCard
        className="text-center h-100 d-flex flex-column"
        style={{ transition: 'all 0.3s ease' }}
      >
        <CCardHeader
          style={{
            backgroundColor: task.work.category.color,
            borderBottom: 'none'
          }}
        >
          <div className="d-flex justify-content-between align-items-center text-white">
            <CTooltip content={task.work.name}>
              <h6 className="mb-0 text-truncate">{task.work.name}</h6>
            </CTooltip>
          </div>
        </CCardHeader>

        <CCardBody className="d-flex flex-column">
          <CCardTitle className="text-truncate">
            <CTooltip content={`Paziente: ${task.patient}`}>
              <span>Paz: {task.patient}</span>
            </CTooltip>
          </CCardTitle>

          <CCardText className="text-muted mb-3">
            Consegna per <br />
            {formatDeliveryDate(task.deliveryDate)}
          </CCardText>

        </CCardBody>

        <CCardFooter
          className="text-body-secondary"
          onClick={() => onOpenSteps(task)}
          style={{
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
        >
          <div className="d-flex justify-content-between align-items-center">
            <span>
              {completedSteps} di {totalSteps} fasi completate
            </span>
            <CIcon
              icon={icon.cilArrowRight}
              className="ms-2"
              style={{ transition: 'transform 0.3s ease' }}
            />
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  );
};
export default Dashboard;
