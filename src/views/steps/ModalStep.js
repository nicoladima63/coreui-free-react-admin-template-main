import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CButton,
  CFormInput, CForm, CFormLabel, CAlert
} from '@coreui/react';
import UserSelect from '../../components/UserSelect';
import WorkSelect from '../../components/WorkSelect';

const ModalWork = ({ visible, onClose, item, refreshData }) => {
  const [name, setName] = useState('');
  const [userid, setUserId] = useState('');
  const [workid, setWorkId] = useState('');
  const [completed, setCompleted] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    if (item) {
      // Precompiliamo i campi se è stato passato un item
      setName(item.name);
      setUserId(item.userid);
      setWorkId(item.workid);
      setCompleted(item.completed);
    } else {
      // Reset campi in caso di nuovo provider
      resetForm();
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const sendData = {
      name,
      workid,
      userid,
      completed
    };

    try {
      if (item) {
        // Se esiste un item, inviamo una richiesta PUT per aggiornare
        const response = await axios.put(`http://localhost:5000/api/stepstemp/${item.id}`, sendData);
        if (response.status === 200) {
          setSuccess(true);
          refreshData(); // Aggiorna la lista
          resetForm();
          onClose(); // Chiudi la modal
        }
      } else {
        // Altrimenti, inviamo una richiesta POST per creare un nuovo record
        const response = await axios.post('http://localhost:5000/api/stepstemp', sendData);
        if (response.status === 201) {
          setSuccess(true);
          refreshData(); // Aggiorna la lista 
          resetForm();
          onClose(); // Chiudi la modal
        }
      }
    } catch (error) {
      console.error('Errore durante l\'invio dei dati:', error);
      setSuccess(false);
      setError('Errore durante l\'invio dei dati. Verifica i dati e riprova.');
    }
  };

  const resetForm = () => {
    setName('');
    setUserId('');
    setWorkId('');
    setCompleted(false)
    setSuccess(false);
    setError(null);
    onClose();
  };

  const handleWorkSelect = (value) => {
    setWorkId(value);
  };

  const handleUserSelect = (value) => {
    setUserId(value);
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{item ? 'Modifica fase' : 'Nuova fase'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Lavorazione</CFormLabel>
          <WorkSelect onSelect={handleWorkSelect} value={workid} required />
          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            placeholder="Nome della fase"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <CFormLabel>Utente</CFormLabel>
          <UserSelect onSelect={handleUserSelect} value={userid} required />
          {error && (
            <CAlert color="danger" size="sm">
              {error}
            </CAlert>
          )}
          {success && (
            <CAlert color="success" size="sm">
              Record {item ? 'modificato' : 'aggiunto'} con successo!
            </CAlert>
          )}
          <CModalFooter>
            <CButton color="secondary" onClick={onClose} size="sm">
              Annulla
            </CButton>
            <CButton type="submit" color="primary" size="sm">
              {item ? 'Salva Modifiche' : 'Aggiungi'}
            </CButton>
          </CModalFooter>
        </CForm>

      </CModalBody>

    </CModal>
  );
};

export default ModalWork;
