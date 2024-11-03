import React, { useEffect, useState } from 'react';
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CButton,
  CFormInput, CForm, CFormLabel, CAlert, CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import ProviderSelect from '../../components/ProviderSelect';
import CategorySelect from '../../components/CategorySelect';

import ModalCategory from '../categories/ModalCategory';
import ModalProvider from '../provider/ModalProvider';

const ModalWork = ({ visible, onClose, onSave, selectedWork }) => {
  const [formData, setFormData] = useState({
    name: '',
    providerid: '',
    categoryid: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Stati per le sub-modali
  const [isProviderModalVisible, setIsProviderModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchProviders = async () => {
    // Richiama l'API per ottenere i provider aggiornati
    const response = await fetch('/api/providers');
    const data = await response.json();
    setProviders(data);
  };
  const fetchCategories = async () => {
    // Richiama l'API per ottenere i provider aggiornati
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data);
  };
  // fine per le sub-modali


  useEffect(() => {
    if (selectedWork) {
      // Precompilazione campi in caso di modifica
      setFormData({
        name: selectedWork.name || '',
        providerid: selectedWork.providerid || '',
        categoryid: selectedWork.categoryid || ''
      });
    } else {
      resetForm();
    }
  }, [selectedWork]);

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
      providerid: '',
      categoryid: ''
    });
    setSuccess(false);
    setError(null);
  };

  return (
    <>
      <CModal visible={visible} onClose={onClose}>
        <CModalHeader>
          <h5>{selectedWork ? 'Modifica Lavorazione' : 'Nuova Lavorazione'}</h5>
        </CModalHeader>
        <CModalBody>
          <CForm onSubmit={handleSubmit}>
            <CFormLabel>Nome</CFormLabel>
            <CFormInput
              type="text"
              placeholder="Nome della lavorazione"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <CFormLabel>
              Fornitore
              <CButton
                color="primary"
                shape="rounded-pill"
                size="sm"
                onClick={() => setIsProviderModalVisible(true)} // Apri la modale fornitore
              >+
              </CButton>


            </CFormLabel>
            <ProviderSelect
              onSelect={(value) => handleChange('providerid', value)}
              selectedValue={formData.providerid}
              providers={providers}
              required
            />

            <CFormLabel>
              Categoria
              <CButton
                color="primary"
                size="sm"
                onClick={() => setIsCategoryModalVisible(true)} // Apri la modale categoria
              >+
              </CButton>
            </CFormLabel>
            <CategorySelect
              onSelect={(value) => handleChange('categoryid', value)}
              selectedValue={formData.categoryid}
              categories={categories}
              required
            />

            {error && (
              <CAlert color="danger" size="sm">
                {error}
              </CAlert>
            )}
            {success && (
              <CAlert color="success" size="sm">
                {selectedWork ? 'Record modificato con successo!' : 'Record aggiunto con successo!'}
              </CAlert>
            )}
            <CModalFooter>
              <CButton color="secondary" onClick={onClose} size="sm">
                <CIcon icon={icon.cilReload} size="lg" />
              </CButton>
              <CButton type="submit" color="primary" size="sm">
                {selectedWork ? <CIcon icon={icon.cilSave} size="lg" /> : <CIcon icon={icon.cilPlus} size="lg" />}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Sub-modali */}
      <ModalProvider
        visible={isProviderModalVisible}
        onClose={() => {
          setIsProviderModalVisible(false);
          fetchProviders(); // Esegui solo dopo la chiusura della modale
        }}
      />
      <ModalCategory
        visible={isCategoryModalVisible}
        onClose={() => {
          setIsCategoryModalVisible(false);
          fetchCategories(); // Esegui solo dopo la chiusura della modale
        }}
        refreshData={null} // Puoi aggiungere una funzione per aggiornare i dati dopo l'inserimento o modifica
      />
    </>
  );
};

export default ModalWork;
