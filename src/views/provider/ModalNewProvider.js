import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CInputGroup ,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
} from '@coreui/react';

const ModalNewProvider = ({ visible, onClose, item, refreshData }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (item) {
      // Precompiliamo i campi se è stato passato un item
      setName(item.name);
      setEmail(item.email);
      setPhone(item.phone);
    } else {
      // Reset campi in caso di nuovo provider
      resetForm();
    }
  }, [item]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const sendData = {
      name,
      email,
      phone,
    };

    try {
      if (item) {
        // Se esiste un item, inviamo una richiesta PUT per aggiornare
        const response = await axios.put(`http://localhost:5000/api/providers/${item.id}`, sendData);
        if (response.status === 200) {
          setSuccess(true);
          refreshData(); // Aggiorna la lista dei provider
          resetForm();
          onClose(); // Chiudi la modal
        }
      } else {
        // Altrimenti, inviamo una richiesta POST per creare un nuovo provider
        const response = await axios.post('http://localhost:5000/api/providers', sendData);
        if (response.status === 201) {
          setSuccess(true);
          refreshData(); // Aggiorna la lista dei provider
          resetForm();
          onClose(); // Chiudi la modal
        }
      }
    } catch (error) {
      console.error('Errore durante l\'invio dei dati:', error);
      setError('Errore durante l\'invio dei dati. Verifica i dati e riprova.');
    }
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{item ? 'Modifica Fornitore' : 'Nuovo Fornitore'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Inserisci il nome"
            required
          />
          <CFormLabel>Email</CFormLabel>
          <CFormInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Inserisci l'email"
            required
          />
          <CFormLabel>Telefono</CFormLabel>
          <CFormInput
            type="number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Inserisci il telefono"
            required
          />
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
            <CButton color="secondary" onClick={onClose}>
              Annulla
            </CButton>
            <CButton type="submit" color="primary">
              {item ? 'Salva Modifiche' : 'Aggiungi'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalNewProvider
