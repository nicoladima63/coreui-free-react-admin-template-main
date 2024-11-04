import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CCard, CCardText, CCardTitle, CCardFooter,
  CCardBody,
  CCardHeader,
  CCol,
  CNavLink,
  CRow,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import FilterGroupButton from '../../components/FilterGroupButton';
import ModalNew from './ModalNew';
import { TasksService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState('incomplete');
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

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
      <CCol xs={12}>
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
  const completedSteps = task.steps?.filter((step) => step.completed).length || 0;
  const totalSteps = task.steps?.length || 0;

  const formatDeliveryDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
  };

  return (
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
        </CCardBody>
        <CCardFooter className="text-body-secondary">
          <CNavLink to="/steps" as={NavLink}>
            <div>
              {`${completedSteps} fasi completate`}
              <br />
              {`su ${totalSteps}`}
              <CIcon icon={icon.cilArrowRight} className="float-end" width={16} />
            </div>
          </CNavLink>
        </CCardFooter>
      </CCard>
    </CCol>
  );
};

export default Dashboard;
