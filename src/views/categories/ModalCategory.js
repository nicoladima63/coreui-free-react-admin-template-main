// ModalCategory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CButton,
  CFormInput, CForm, CFormLabel, CAlert
} from '@coreui/react';

const ModalCategory = ({ visible, onClose, item, refreshData }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#ffffff'); // Colore di default

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    if (item) {
      // Precompiliamo i campi se è stato passato un item
      setCategoryName(item.name);
      setCategoryColor(item.color);
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
      name: categoryName,
      color: categoryColor,
    };

    try {
      if (item) {
        // Se esiste un item, inviamo una richiesta PUT per aggiornare
        const response = await axios.put(`http://localhost:5000/api/categories/${item.id}`, sendData);
        if (response.status === 200) {
          setSuccess(true);
          refreshData(); // Aggiorna la lista
          resetForm();
          onClose(); // Chiudi la modal
        }
      } else {
        // Altrimenti, inviamo una richiesta POST per creare un nuovo record
        const response = await axios.post('http://localhost:5000/api/categories', sendData);
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
    setCategoryName('');
    setCategoryColor('#ffffff');
    setSuccess(false);
    setError(null);
    onClose();
  };


  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{item ? 'Modifica Categoria' : 'Nuova Categoria'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            placeholder="Nome della categoria"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <CFormLabel>Colore</CFormLabel>
          <CFormInput
            type="color"
            value={categoryColor} // Imposta il valore del colore
            onChange={(e) => setCategoryColor(e.target.value)} // Aggiorna il colore selezionato
            className="mt-3" // Spazio sopra il color picker
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

export default ModalCategory;
