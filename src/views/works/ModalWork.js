// ModalCategory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CButton,
  CFormInput, CForm, CFormLabel, CAlert
} from '@coreui/react';
import ProviderSelect from '../../components/ProviderSelect';
import CategorySelect from '../../components/CategorySelect';


const ModalWork = ({ visible, onClose, item, refreshData }) => {
  const [name, setName] = useState('');
  const [providerid,setProviderId] = useState('');
  const [categoryid,setCategoryId] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    if (item) {
      // Precompiliamo i campi se è stato passato un item
      setName(item.name);
      setProviderId(item.providerid);
      setCategoryId(item.categoryid);
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
      providerid,
      categoryid
    };

    try {
      if (item) {
        // Se esiste un item, inviamo una richiesta PUT per aggiornare
        const response = await axios.put(`http://localhost:5000/api/works/${item.id}`, sendData);
        if (response.status === 200) {
          setSuccess(true);
          refreshData(); // Aggiorna la lista
          resetForm();
          onClose(); // Chiudi la modal
        }
      } else {
        // Altrimenti, inviamo una richiesta POST per creare un nuovo record
        const response = await axios.post('http://localhost:5000/api/works', sendData);
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
    setProviderId('');
    setCategoryId('');
    setSuccess(false);
    setError(null);
    onClose();
  };

  const handleSelect = (value, type) => {
    if (type === 'provider') {
      setProviderId(value);
    } else if (type === 'category') {
      setCategoryId(value);
    }

  };
  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{item ? 'Modifica Lavorazione' : 'Nuova Lavorazione'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            placeholder="Nome della lavorazione"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <CFormLabel>Fornitore</CFormLabel>
          <ProviderSelect onSelect={handleSelect} value={providerid} required/>
          <CFormLabel>Categoria</CFormLabel>
          <CategorySelect onSelect={handleSelect} value={categoryid} required/>
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
