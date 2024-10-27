import React from 'react'
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
import ModalNew from "./ModalStep";

const StepsView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchData = () => {
    setLoading(true)
    setError(null)
    axios
      .get('http://localhost:5000/api/stepstemp', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setItems(response.data) // Inizialmente mostra tutti i task
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
    fetchData()
  }, [])

  const handleOpenModal = (item = null) => {
    setSelectedItem(item); // Passiamo l'elemento selezionato o `null` per un nuovo provider
    setIsModalVisible(true);
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Sei sicuro di voler eliminare questo record?')) {
      try {
        await axios.delete(`${apiUrl}/api/works/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchData();
      } catch (error) {
        console.error('Errore durante l\'eliminazione del record:', error);
      }
    }

  };


  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            Gestione Fasi lavorazione
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
              <CTable striped responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Lavorazione</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Utente</CTableHeaderCell>
                    <CTableHeaderCell className="text-end" scope="col">Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {items.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>{item.id}</CTableDataCell>
                      <CTableDataCell>{item.name}</CTableDataCell>
                      <CTableDataCell>{item.workid}</CTableDataCell>
                      <CTableDataCell>{item.userid}</CTableDataCell>
                      <CTableDataCell className="text-end">
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
  )
};
export default StepsView;
