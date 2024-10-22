import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableCaption,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { DocsExample } from 'src/components'

const apiUrl = import.meta.env.VITE_API_URL;

const Works = () => {
  const [loading, setLoading] = useState(true) // Stato per lo spinner
  const [works, setWorks] = useState([]) // Tutti i task
  const [filteredWorks, setFilteredWorks] = useState([]) // Task filtrati
  const [selectedFilter, setSelectedFilter] = useState('all') // Filtro selezionato
  const [selectedWorkId, setSelectedWorkId] = useState(null) // Task selezionato per le fasi
  const [error, setError] = useState(null) // Stato per gestire eventuali errori

  const loadData = () => {
    setLoading(true)
    setError(null)
    axios
      .get('http://localhost:5000/api/works', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setWorks(response.data)
        setFilteredWorks(response.data) // Inizialmente mostra tutti i task
        setLoading(false) // Fine caricamento
      })
      .catch((error) => {
        console.error('Errore nel recupero dei task:', error)
        setError('Errore nel recupero dei dati o connessione al server assente.')
        setLoading(false) // Fine caricamento
      })
  }

  // Carica i task al primo rendering
  useEffect(() => {
    loadData()
  }, [])


  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>Works Table 
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Elenco delle lavorazioni inserite nel database.
            </p>
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Cognome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Ruolo</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableHeaderCell scope="row">1</CTableHeaderCell>
                    <CTableDataCell>wNicola</CTableDataCell>
                    <CTableDataCell>wDi Martino</CTableDataCell>
                    <CTableDataCell>wTitolare</CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableHeaderCell scope="row">2</CTableHeaderCell>
                    <CTableDataCell>wCristina</CTableDataCell>
                    <CTableDataCell>wBaldi</CTableDataCell>
                    <CTableDataCell>wSegretaria</CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableHeaderCell scope="row">3</CTableHeaderCell>
                  <CTableDataCell>Cristina</CTableDataCell>
                  <CTableDataCell>Ponzecchi</CTableDataCell>
                  <CTableDataCell>Assistente</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
};
export default Works;
