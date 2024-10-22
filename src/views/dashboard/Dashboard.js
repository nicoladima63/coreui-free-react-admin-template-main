import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import {
  CCard,
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
import ModalNew from './ModalNew'
import { RefreshCw } from 'lucide-react';
const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('completed'); // Filtro selezionato
  const [loading, setLoading] = useState(true); // Stato per lo spinner
  const [error, setError] = useState(null); // Stato per gli errori
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = () => {
    setLoading(true);
    setError(null);
    axios
      .get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setTasks(response.data);
        setFilteredTasks(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Errore nel recupero dei task:', error);
        setError('Errore nel recupero dei dati o connessione al server assente.');
        setLoading(false);
      });
  };

  const loadTaskSteps = async (taskId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/steps?task_id=${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero delle fasi:', error);
      return [];
    }
  };

  // Carica i task al primo rendering
  useEffect(() => {
    loadTasks();
  }, []);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    let filtered;
    switch (filter) {
      case 'completed':
        filtered = tasks.filter((task) => task.status === 'Completato');
        break;
      case 'incomplete':
        filtered = tasks.filter((task) => task.status !== 'Completato');
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
          <CCol xs={ 10}>
            <FilterGroupButton
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
              onReload={loadTasks} // Passiamo la funzione di reload come prop
            />

          </CCol>
          <CCol xs={2}>
            <CButton color="success" size="sm"
              onClick={() => handleOpenModal()}
            >
              Nuovo
            </CButton>
            <CButton size="sm"
              color="primary"
              variant="outline"
              onClick={() => loadTasks(true)}
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
        refresData={loadTasks}
      />

    </CCard>
  );
};

const TaskWidget = ({ task, loadTaskSteps }) => {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  useEffect(() => {
    const fetchTaskSteps = async () => {
      const steps = await loadTaskSteps(task.id);
      const completed = steps.filter((step) => step.status === 'Completato').length;
      setCompletedSteps(completed);
      setTotalSteps(steps.length);
    };

    fetchTaskSteps();
  }, [task.id, loadTaskSteps]);

  return (
    <CCol xs={12} sm={6} xl={4} xxl={3}>
      <CWidgetStatsF
        icon={<CIcon width={24} icon={cilSettings} size="xl" />}
        value={task.patient}
        title={`${completedSteps} fasi su ${totalSteps}`}
        color="primary"
        footer={
          <>
            <CProgress value={(completedSteps / totalSteps) * 100 || 0} />
            <CNavLink to="/steps" as={NavLink}>
              Vai alle fasi
              <CIcon icon={cilArrowRight} className="float-end" width={16} />
            </CNavLink>
          </>
        }
      />
    </CCol>
  );
};

export default Dashboard;
