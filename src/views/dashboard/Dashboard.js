import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CCard,CCardText,CCardTitle,CCardFooter,
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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowRight, cilSettings } from '@coreui/icons';
import FilterGroupButton from '../../components/FilterGroupButton';
import ModalNew from './ModalNew';
import { RefreshCw } from 'lucide-react';

import * as Controller from '../../axioService';
import { connectWebSocket } from '../../websocket';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('incomplete'); // Filtro selezionato
  const [loading, setLoading] = useState(true); // Stato per lo spinner
  const [error, setError] = useState(null); // Stato per gli errori
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const handleNewNotification = (notification) => {
    setNotifications((prev) => [...prev, notification]);
  };
  // Aggiorna il websocket per usare questa funzione
  useEffect(() => {
    const wsUrl = 'ws://localhost:5000';
    const ws = connectWebSocket(wsUrl, handleNewNotification); // Passa la funzione di gestione notifiche

    return () => {
      ws.close();
    };
  }, []);

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
    <CCard className="mb-4">
      <CCardHeader>WorkFlows
        <CRow>
          <CCol xs={10}>
            <FilterGroupButton
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
              onReload={loadTasksForDashboard} // Associa la funzione di reload alla dashboard
            />
          </CCol>
          <CCol xs={2}>
            <CButton color="success" size="sm" onClick={handleOpenModal}>
              Nuovo
            </CButton>
            <CButton
              size="sm"
              color="primary"
              variant="outline"
              onClick={() => loadTasksForDashboard(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <CSpinner size="sm" className="me-2" />
              ) : (
                <RefreshCw className="me-2" size={20} />
              )}
              Aggiorna
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>

      <CCardBody>
        {notifications.length > 0 && (
          <div>
            {notifications.map((note, index) => (
              <CAlert key={index} color="info">
                {note.message}
              </CAlert>
            ))}
          </div>
        )}

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
              <TaskWidget key={task.id} task={task} loadTaskSteps={loadTaskSteps} />
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
        <CCardHeader style={{ backgroundColor: task.work.category.color, fontWeight: 'bold', color: 'white' }}>
          {task.work.name}
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
              <CIcon icon={cilArrowRight} className="float-end" width={16} />
            </div>
          </CNavLink>
        </CCardFooter>
      </CCard>
    </CCol>
  );
};

export default Dashboard;
