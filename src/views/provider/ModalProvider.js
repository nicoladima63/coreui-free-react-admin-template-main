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

const ModalProvider = ({ visible, onClose, onSave, selectedItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      // Precompilazione campi in caso di modifica
      setFormData({
        name: selectedItem.name || '',
        email: selectedItem.email || '',
        phone: selectedItem.phone || ''
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
    setFormData({ name: '', email: '', phone: '' });
    setSuccess(false);
    setError(null);
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{selectedItem ? 'Modifica Fornitore' : 'Nuovo Fornitore'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Inserisci il nome"
            required
          />
          <CFormLabel>Email</CFormLabel>
          <CFormInput
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Inserisci l'email"
            required
          />
          <CFormLabel>Telefono</CFormLabel>
          <CFormInput
            type="number"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
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
              {selectedItem ? 'Record modificato con successo!' : 'Record aggiunto con successo!'}
            </CAlert>
          )}
          <CModalFooter>
            <CButton color="secondary" onClick={onClose} size="sm">
              <CIcon icon={icon.cilReload} size="lg" />
            </CButton>
            <CButton type="submit" color="primary" size="sm">
              <CIcon icon={selectedItem ? icon.cilSave : icon.cilPlus} size="lg" />
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalProvider
