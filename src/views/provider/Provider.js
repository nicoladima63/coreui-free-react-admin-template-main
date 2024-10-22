import React, { useEffect, useState,useRef } from 'react'
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
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  } from '@coreui/react'
import ModalNew from "./ModalNewProvider";

const apiUrl = import.meta.env.VITE_API_URL;

const ProvidersView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);


  const fetchData = () => {
    setLoading(true);
    setError(null);
    axios
      .get('http://localhost:5000/api/providers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setItems(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Errore nel recupero dei fornitori:', error);
        setError('Errore nel recupero dei dati o connessione al server assente.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    setSelectedItem(item); // Passiamo l'elemento selezionato o `null` per un nuovo provider
    setIsModalVisible(true);
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Sei sicuro di voler eliminare questo fornitore?')) {
      try {
        await axios.delete(`${apiUrl}/api/providers/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchData();
      } catch (error) {
        console.error('Errore durante l\'eliminazione del fornitore:', error);
      }
    }

  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            Gestione Fornitori
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
              <CAlert color="danger" className="text-center">
                {error}
              </CAlert>
            ) : items.length === 0 ? (
              <CAlert color="warning" className="text-center">
                Nessun fornitore disponibile.
              </CAlert>
            ) : (
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Telefono</CTableHeaderCell>
                    <CTableHeaderCell>Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {items.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>{item.id}</CTableDataCell>
                      <CTableDataCell>{item.name}</CTableDataCell>
                      <CTableDataCell>{item.email}</CTableDataCell>
                      <CTableDataCell>{item.phone}</CTableDataCell>
                      <CTableDataCell>
                        <CButton color="warning" className="me-2" size="sm" onClick={() => handleOpenModal(item)}>
                          Modifica
                        </CButton>
                        <CButton color="danger" size="sm" onClick={() => handleDeleteItem(item.id)}>
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
      <ModalNew
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        item={selectedItem} // Passiamo l'item selezionato alla modal
        refreshData={fetchData} // Funzione per aggiornare i dati dopo l'inserimento o la modifica
      />
    </CRow>
  );
};

export default ProvidersView;
