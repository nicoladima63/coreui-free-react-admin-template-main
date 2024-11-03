import React, { useEffect, useState } from 'react';
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

const ModalCategory = ({ visible, onClose, onSave, selectedItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      // Precompilazione campi in caso di modifica
      setFormData({
        name: selectedItem.name || '',
        color: selectedItem.color || '',
      });
    } else {
      resetForm();
    }
  }, [selectedItem]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await onSave(formData); // Chiama il callback onSave con i dati del form
      setSuccess(true);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Errore durante l'invio dei dati:", error);
      setError("Errore durante l'invio dei dati. Verifica i dati e riprova.");
    }
  };

  const resetForm = () => {
    setFormData({ name: '', color: '' });
    setSuccess(false);
    setError(null);
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{selectedItem ? 'Modifica Categoria' : 'Nuova Categoria'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            placeholder="Nome della categoria"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <CFormLabel>Colore</CFormLabel>
          <CFormInput
            type="color"
            value={formData.color}
            onChange={(e) => handleChange('color', e.target.value)}
            className="mt-3"
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
              {selectedItem ? 'Salva Modifiche' : 'Aggiungi'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalCategory;
