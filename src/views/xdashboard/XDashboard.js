import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CProgress,
  CModal,
  CModalHeader,
  CModalBody,
  CModalTitle,
  CForm,
  CFormCheck,
  CBadge,
  CButton,
  CSpinner,
  CAlert
} from '@coreui/react';
import { RefreshCw } from 'lucide-react';

const DashboardTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [works, setWorks] = useState([]);
  const [providers, setProviders] = useState([]);
  const [steps, setSteps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState(null);

  // Stati per loading ed errori
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepError, setStepError] = useState(null);

  // Carica i dati iniziali
  const fetchData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Carica tutti i dati in parallelo per ottimizzare
      const [worksResponse, providersResponse, tasksResponse] = await Promise.all([
        fetch('http://localhost:5000/api/works'),
        fetch('http://localhost:5000/api/providers'),
        fetch('http://localhost:5000/api/tasks')
      ]);


      // Verifica se tutte le risposte sono ok
      if (!worksResponse.ok) throw new Error(`Errore nel caricamento dei lavori: ${worksResponse.statusText}`);
      if (!providersResponse.ok) throw new Error(`Errore nel caricamento dei fornitori: ${providersResponse.statusText}`);
      if (!tasksResponse.ok) throw new Error(`Errore nel caricamento dei task: ${tasksResponse.statusText}`);

      const [worksData, providersData, tasksData] = await Promise.all([
        worksResponse.json(),
        providersResponse.json(),
        tasksResponse.json()
      ]);

      setWorks(worksData);
      setProviders(providersData);
      setTasks(tasksData);
    } catch (error) {
      setError(error.message);
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ottiene i dati completi per un task
  const getEnrichedTask = (task) => {
    const work = works.find(w => w.id === task.work_id) || {};
    const provider = providers.find(p => p.id === work.provider_id) || {};

    return {
      ...task,
      workname: work.name || 'Lavoro sconosciuto',
      providername: provider.name || 'Fornitore sconosciuto',
      providercolor: provider.color || '#ccc'
    };
  };

  // Carica gli step quando viene selezionato un work
  const loadSteps = async (workId) => {
    setStepsLoading(true);
    setStepError(null);

    try {
      const response = await fetch(`/api/steps?workId=${workId}`);
      if (!response.ok) throw new Error(`Errore nel caricamento delle fasi: ${response.statusText}`);

      const data = await response.json();
      setSteps(data);
    } catch (error) {
      setStepError(error.message);
      console.error('Errore nel caricamento degli step:', error);
    } finally {
      setStepsLoading(false);
    }
  };

  // Gestisce l'apertura della modal con gli step
  const handleShowSteps = async (workId) => {
    setSelectedWorkId(workId);
    setShowModal(true);
    await loadSteps(workId);
  };

  // Gestisce il completamento di uno step
  const handleStepComplete = async (stepId, completed) => {
    setStepError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/steps${stepId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) throw new Error(`Errore nell'aggiornamento della fase: ${response.statusText}`);

      // Aggiorna la lista degli step
      await loadSteps(selectedWorkId);
    } catch (error) {
      setStepError(error.message);
      console.error('Errore nell\'aggiornamento dello step:', error);
    }
  };

  // Calcola il progresso degli step per un work
  const calculateProgress = (workId) => {
    const workSteps = steps.filter(step => step.workid === workId);
    if (workSteps.length === 0) return 0;
    const completed = workSteps.filter(step => step.completed).length;
    return Math.round((completed / workSteps.length) * 100);
  };

  // Funzione per generare uno stile di bordo basato sul colore del fornitore
  const getCardStyle = (providerColor) => ({
    borderTop: `3px solid ${providerColor}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <CAlert color="danger" className="d-flex align-items-center">
        <div className="flex-grow-1">{error}</div>
        <CButton
          color="danger"
          variant="ghost"
          onClick={() => fetchData()}
        >
          Riprova
        </CButton>
      </CAlert>
    );
  }

  return (
    <>
      {/* Header con pulsante di refresh */}
      <div className="d-flex justify-content-end mb-3">
        <CButton
          color="primary"
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <CSpinner size="sm" className="me-2" />
          ) : (
            <RefreshCw className="me-2" size={20} />
          )}
          Aggiorna
        </CButton>
      </div>

      <CRow>
        {tasks.map(task => {
          const enrichedTask = getEnrichedTask(task);
          return (
            <CCol key={task.id} sm={12} lg={6} xl={4}>
              <CCard
                className="mb-4"
                style={getCardStyle(enrichedTask.providercolor)}
              >
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>{enrichedTask.workname}</strong>
                  <CBadge color={enrichedTask.providercolor} className="text-dark">
                    {enrichedTask.providername}
                  </CBadge>
                </CCardHeader>
                <CCardBody>
                  <div className="mb-3">
                    <div>Paziente: {task.patient}</div>
                    <div>Consegna: {new Date(task.dateDelivery).toLocaleDateString()}</div>
                  </div>
                  <div
                    className="d-flex align-items-center justify-content-between cursor-pointer"
                    onClick={() => handleShowSteps(task.workid)}
                  >
                    <span>Progresso fasi:</span>
                    <CProgress
                      className="w-75"
                      value={calculateProgress(task.workid)}
                    />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          );
        })}
      </CRow>

      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Fasi del lavoro</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {stepsLoading ? (
            <div className="text-center py-3">
              <CSpinner />
            </div>
          ) : stepError ? (
            <CAlert color="danger" className="d-flex align-items-center">
              <div className="flex-grow-1">{stepError}</div>
              <CButton
                color="danger"
                variant="ghost"
                onClick={() => loadSteps(selectedWorkId)}
              >
                Riprova
              </CButton>
            </CAlert>
          ) : (
            <CForm>
              {steps.map(step => (
                <div key={step.id} className="mb-3">
                  <CFormCheck
                    id={`step-${step.id}`}
                    label={step.description}
                    checked={step.completed}
                    onChange={(e) => handleStepComplete(step.id, e.target.checked)}
                  />
                </div>
              ))}
            </CForm>
          )}
        </CModalBody>
      </CModal>
    </>
  );
};

export default DashboardTasks;
