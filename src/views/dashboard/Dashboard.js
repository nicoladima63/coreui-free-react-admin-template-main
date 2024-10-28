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

const CustomProgress = ({ value, color }) => {
  const progressStyle = {
    width: `${value}%`,
    backgroundColor: color, // Utilizza il colore personalizzato qui
    height: '1rem', // Puoi modificare l'altezza a tuo piacimento
  };

  return (
    <div style={{ backgroundColor: color, borderRadius: '0.25rem' }}>
      <div style={progressStyle}></div>
    </div>
  );
};

const TaskWidget = ({ task, loadTaskSteps }) => {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const fetchTaskSteps = async () => {
    const steps = await loadTaskSteps(task.id);
    const completed = steps.filter((step) => step.status === 'Completato').length;
    setCompletedSteps(completed);
    setTotalSteps(steps.length);
  };


  return (
    <CCol xs={12} sm={6} lg={3} xl={4} xxl={3}>
      <CCard className="text-center" >
        <CCardHeader style={{ backgroundColor: task.work.category.color,fontWeight: 'bold',color: 'white' }}>{task.work.name}</CCardHeader>
        <CCardBody >
          <CCardTitle>Paz: {task.patient}</CCardTitle>
          <CCardText>Consegna il: {task.deliveryDate}</CCardText>
        </CCardBody>
        <CCardFooter className="text-body-secondary">
          <CNavLink onClick={fetchTaskSteps} to="/steps" as={NavLink}>
            {`${completedSteps} fasi completate su ${totalSteps}`}
            <CIcon icon={cilArrowRight} className="float-end" width={16} />
          </CNavLink>
        </CCardFooter>
      </CCard>
    </CCol>
  );
};

export default Dashboard;
