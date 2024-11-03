import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CContainer,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CCard,
  CCardHeader,
  CCardBody,
} from '@coreui/react'
import FilterGroupButton from '../../components/FilterGroupButton'
import TaskPhaseModal from '../../components/TaskPhaseModal'

import * as Controller from '../../axioService';

const TaskManagement = () => {
  const [loading, setLoading] = useState(true) // Stato per lo spinner
  const [tasks, setTasks] = useState([]) // Tutti i task
  const [filteredTasks, setFilteredTasks] = useState([]) // Task filtrati
  const [selectedFilter, setSelectedFilter] = useState('all') // Filtro selezionato
  const [selectedTaskId, setSelectedTaskId] = useState(null) // Task selezionato per le fasi
  const [isModalVisible, setIsModalVisible] = useState(false) // Controlla la visibilità della modal
  const [error, setError] = useState(null) // Stato per gestire eventuali errori

  // Funzione per ricaricare i dati
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Controller.task.getTasks();
      setTasks(data)
    } catch (error) {
      console.error('Errore nel recupero dei task:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData() // Recupera i dati all'avvio del componente
  }, [])

  // Funzione per filtrare i task localmente
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter)
    let filtered
    switch (filter) {
      case 'completed':
        filtered = tasks.filter((task) => task.status === 'Completato')
        break
      case 'incomplete':
        filtered = tasks.filter((task) => task.status !== 'Completato')
        break
      default:
        filtered = tasks
    }
    setFilteredTasks(filtered)
  }

  // Funzione per aprire la modal delle fasi del task
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId)
    setIsModalVisible(true)
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>Gestione Tasks
            <FilterGroupButton
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
              onReload={loadTasks} // Passiamo la funzione di reload come prop
            />
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
                Nessun task disponibile.
              </CAlert>
            ) : (
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Descrizione</CTableHeaderCell>
                    <CTableHeaderCell>Utente Assegnato</CTableHeaderCell>
                    <CTableHeaderCell>Stato</CTableHeaderCell>
                    <CTableHeaderCell>Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredTasks.map((task) => (
                    <CTableRow key={task.id}>
                      <CTableDataCell>{task.id}</CTableDataCell>
                      <CTableDataCell>{task.description}</CTableDataCell>
                      <CTableDataCell>{task.assigned_user_id}</CTableDataCell>
                      <CTableDataCell>{task.status}</CTableDataCell>
                      <CTableDataCell>
                        <CButton size="sm" color="success" onClick={() => handleTaskClick(task.id)}>
                          Fasi
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
      {selectedTaskId && (
        <TaskPhaseModal
          taskId={selectedTaskId}
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </CRow>
  )
}

export default TaskManagement
