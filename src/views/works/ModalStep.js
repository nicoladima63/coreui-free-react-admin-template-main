import React, { useEffect, useState, useRef } from 'react';
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CButton,
  CFormInput, CForm, CFormLabel, CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import UserSelect from '../../components/UserSelect';
import WorkSelect from '../../components/WorkSelect';

const ModalStep = ({ visible, onClose, onSave, selectedStep }) => {
  const [formData, setFormData] = useState({
    name: '',
    order: '',
    userid: '',
    workid: '',
    completed: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedStep) {
      // Precompilazione campi in caso di modifica
      setFormData({
        name: selectedStep.name || '',
        order: selectedStep.order || '',
        userid: selectedStep.userid || '',
        workid: selectedStep.workid || '',
        completed: selectedStep.completed || false
      });
    } else {
      resetForm();
    }
  }, [selectedStep]);

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
    setFormData({
      name: '',
      order: '',
      userid: '',
      workid: '',
      completed: ''
    });
    setSuccess(false);
    setError(null);
  };


  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>{selectedStep ? 'Modifica Fase' : 'Nuova Fase'}</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Lavorazione</CFormLabel>
          <WorkSelect
            onSelect={(value) => handleChange('workid', value)}
            selectedValue={formData.workid}
            required
          />

          <CFormLabel>Nome</CFormLabel>
          <CFormInput
            type="text"
            placeholder="Nome della fase"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          <CFormLabel>Ordine</CFormLabel>
          <CFormInput
            type="text"
            placeholder="Ordine della fase"
            value={formData.order}
            onChange={(e) => handleChange('order', e.target.value)}
            required
          />

          <CFormLabel>Utente</CFormLabel>
          <UserSelect
            onSelect={(value) => handleChange('userid', value)}
            selectedValue={formData.userid}
            required
          />

          {error && (
            <CAlert color="danger" size="sm">
              {error}
            </CAlert>
          )}
          {success && (
            <CAlert color="success" size="sm">
              {selectedStep ? 'Record modificato con successo!' : 'Record aggiunto con successo!'}
            </CAlert>
          )}
          <CModalFooter>
            <CButton color="secondary" onClick={onClose} size="sm">
              <CIcon icon={icon.cilReload} size="lg" />
            </CButton>
            <CButton type="submit" color="primary" size="sm">
              <CIcon icon={selectedStep ? icon.cilSave : icon.cilPlus} size="lg" />
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalStep;
