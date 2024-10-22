import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CInputGroup,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
} from '@coreui/react';
import WorkSelect from '../../components/WorkSelect';

const ModalTask = ({ visible, onClose, refreshData }) => {
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState('');
  const [description,setDescription] = useState('');
  const [patient,setPatient] = useState('');
  const [pc_id, setPc_id] = useState('');
  const [assigned_user_id, setAssigned_user_id] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setDescription('');
    setPatient('');
    setPc_id('');
    setAssigned_user_id('');
    setStatus('');
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
  }
  const loadWorks = () => {
    setLoading(true);
    setError(null);
    axios
      .get('http://localhost:5000/api/works', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setWorks(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Errore nel recupero delle lavorazioni:', error);
        setError('Errore nel recupero dei dati o connessione al server assente.');
        setLoading(false);
      });
  };
  useEffect(() => {
    loadWorks();
  }, []);

  const handleWorkSelect = (id) => {
    setSelectedWork(id); // Set the selected work ID

    // Find the corresponding work name
    const selectedWorkObj = works.find(work => work.id === parseInt(id));
    if (selectedWorkObj) {
      setDescription(selectedWorkObj.name); // Set the work name in the description state
    } else {
      setDescription(''); // Clear description if no match
    }
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>Nuovo task</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>work</CFormLabel>
          <WorkSelect onSelect={handleWorkSelect} />
          <p>Descrizione selezionata: {description}</p>
          <CFormInput
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Seleziona lavorazione"
            required
          />
          <CFormLabel>Email</CFormLabel>
          <CFormInput
            type="text"
            value={patient}
            onChange={(e) => setPatient(e.target.value)}
            placeholder="Inserisci il paziente"
            required
          />
          <CFormLabel>assigned_user_id</CFormLabel>
          {error && (
            <CAlert color="danger" size="sm">
              {error}
            </CAlert>
          )}
          {success && (
            <CAlert color="success" size="sm">
              Record aggiunto con successo!
            </CAlert>
          )}
          <CModalFooter>
            <CButton color="secondary" onClick={onClose}>
              Annulla
            </CButton>
            <CButton type="submit" color="primary">
              Aggiungi
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalTask
