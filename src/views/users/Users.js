import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton, CButtonGroup,
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
} from '@coreui/react'
import ModalUser from './ModalUser'

const apiUrl = import.meta.env.VITE_API_URL;

const UsersView = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Funzione per recuperare i dati
  const fetchData = () => {
    setLoading(true)
    setError(null)
    axios
      .get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setUsers(response.data)
        setLoading(false) // Fine caricamento
      })
      .catch((error) => {
        console.error('Errore nel recupero utenti:', error)
        setError('Errore nel recupero dei dati o connessione al server assente.')
        setLoading(false) // Fine caricamento
      })
  }

  useEffect(() => {
    fetchData() // Recupera i dati all'avvio del componente
  }, [])

  const handleOpenModal = () => {
    setIsModalVisible(true)
  }



  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>Gestione Utenti
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
              <CButtonGroup>
                <CButton color="primary" className="mb-3" size="sm" onClick={() => handleOpenModal()}>
                  Nuovo
                </CButton>
                <CButton color="info" className="mb-3" size="sm" onClick={fetchData}>
                  Reload
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
            ) : users.length === 0 ? (
              // Mostra avviso se non ci sono dati
              <CAlert color="warning" className="text-center">
                Nessun utente disponibile.
              </CAlert>
            ) : (
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Nome</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>PC Assegnato</CTableHeaderCell>
                    <CTableHeaderCell>Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.map((user) => (
                    <CTableRow key={user.id}>
                      <CTableDataCell>{user.id}</CTableDataCell>
                      <CTableDataCell>{user.name}</CTableDataCell>
                      <CTableDataCell>{user.email}</CTableDataCell>
                      <CTableDataCell>{user.pc_id}</CTableDataCell>
                      <CTableDataCell>
                        <CButton color="warning" className="me-2" size="sm">
                          Modifica
                        </CButton>
                        <CButton color="danger" size="sm">
                          Elimina
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
      <ModalUser
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onreload={fetchData}
      />
    </CRow>
  )
}

export default UsersView
