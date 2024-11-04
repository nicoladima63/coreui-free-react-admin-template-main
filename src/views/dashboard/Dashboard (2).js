import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CCard, CCardText, CCardTitle, CCardFooter,
  CCardBody,
  CCardHeader,
  CCol,
  CNavLink,
  CRow,
  CWidgetStatsF,
  CSpinner,
  CAlert,
  CProgress,
  CButton,
  CButtonGroup,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import FilterGroupButton from '../../components/FilterGroupButton';
import ModalNew from './ModalNew';

import * as Controller from '../../axioService';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('incomplete'); // Filtro selezionato
  const [loading, setLoading] = useState(true); // Stato per lo spinner
  const [error, setError] = useState(null); // Stato per gli errori
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);


  const loadTasksForDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Controller.task.getTasksForDashboard();
      setTasks(data);
    } catch (error) {
      console.error('Errore nel recupero dei task:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await Controller.task.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskSteps = async (taskid) => {
    try {
      const data = await Controller.stepsForTask.getStepsForTask(taskid);
      return data;
    } catch (error) {
      console.error('Errore nel recupero delle fasi:', error);
      return [];
    }
  };

  // Carica i task al primo rendering
  useEffect(() => {
    loadTasksForDashboard();
    //loadTasks();
  }, []);

  useEffect(() => {
    handleFilterChange(selectedFilter); // Carica i task filtrati iniziali
  }, [tasks]); // Carica i task filtrati quando "tasks" cambia

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    let filtered;
    switch (filter) {
      case 'completed':
        filtered = tasks.filter((task) => task.completed === true);
        break;
      case 'incomplete':
        filtered = tasks.filter((task) => task.completed === false);
        break;
      default:
        filtered = tasks;
    }
    setFilteredTasks(filtered);
  };

  const handleOpenModal = () => {
    setModalAddVisible(true);
  };

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
                <CButton color="primary" size="sm" onClick={handleOpenModal}>
                  <CIcon icon={icon.cilPlus} />
                </CButton>

                <CButton
                  size="sm"
                  color="info"
                  onClick={() => loadTasksForDashboard(true)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <CSpinner size="sm" />
                  ) : (
                    <CIcon icon={icon.cilHistory} size='sm' />
                  )}
                </CButton>

              </CButtonGroup>

            </div>
          </CCardHeader>

          <CCardBody>
            {loading ? (
              <div className="text-center">
                <CSpinner color="primary" />
              </div>
            ) : error ? (
              // Mostra errore se c'è stato un problema con la richiesta
              <CAlert color="danger" className="text-center">
                {error}
              </CAlert>
            ) : tasks.length === 0 ? (
              // Mostra avviso se non ci sono dati
              <CAlert color="warning" className="text-center">
                Nessuna fase disponibile.
              </CAlert>
            ) : (
              <CRow xs={{ gutter: 4 }}>
                {filteredTasks.map((task) => (
                  <TaskWidget key={task.id} task={task} />
                ))}
              </CRow>
            )}
          </CCardBody>
          <ModalNew
            visible={modalAddVisible}
            onClose={() => setModalAddVisible(false)}
            refresData={loadTasksForDashboard}
          />
        </CCard>
      </CCol>
    </CRow>
  );
};

const TaskWidget = ({ task }) => {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  useEffect(() => {
    if (task.steps) {
      const completed = task.steps.filter((step) => step.completed).length; // Supponendo che 'completed' sia il campo che indica se lo step è completato
      setCompletedSteps(completed);
      setTotalSteps(task.steps.length); // Usa la lunghezza dell'array degli step
    }
  }, [task]); // Esegui questa logica ogni volta che 'task' cambia

  const formatDeliveryDate = (dateStr) => {
    const date = new Date(dateStr); // Crea un'istanza di Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' }; // Opzioni di formattazione
    return date.toLocaleDateString('it-IT', options); // Restituisce la data formattata
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
