import React, { useEffect, useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CForm,
  CFormLabel,
  CAlert,
  CSpinner,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import PCSelect from '../../components/PCSelect';

const ModalUser = ({ visible, onClose, onSave, selectedUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    pc_id: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        password: '', // Non precompiliamo mai la password per sicurezza
        pc_id: selectedUser.pc_id || '',
      });
    } else {
      resetForm();
    }
  }, [selectedUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Reset errore quando l'utente modifica un campo
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validazione
      if (!formData.name.trim()) {
        throw new Error('Il nome è obbligatorio');
      }
      if (!formData.email.trim()) {
        throw new Error('L\'email è obbligatoria');
      }
      if (!selectedUser && !formData.password.trim()) {
        throw new Error('La password è obbligatoria per i nuovi utenti');
      }

      // Se stiamo modificando un utente esistente e la password è vuota, la rimuoviamo
      const dataToSend = { ...formData };
      if (selectedUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      await onSave(dataToSend);
      resetForm();
      onClose();
    } catch (error) {
      setError(error.message || 'Si è verificato un errore durante il salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      pc_id: '',
    });
    setError(null);
  };

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      backdrop="static"
      keyboard={!isSubmitting}
    >
      <CModalHeader closeButton={!isSubmitting}>
        <h5>{selectedUser ? 'Modifica' : 'Nuovo'} Utente</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Nome</CFormLabel>
            <CFormInput
              type="text"
              placeholder="Nome utente"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Email</CFormLabel>
            <CFormInput
              type="email"
              placeholder="Indirizzo email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-3">
            <CFormLabel>
              Password
              {selectedUser && (
                <small className="text-muted ms-2">
                  (lascia vuoto per mantenere invariata)
                </small>
              )}
            </CFormLabel>
            <CFormInput
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={selectedUser ? '••••••••' : 'Inserisci una password'}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Postazione</CFormLabel>
            <PCSelect
              onSelect={(value) => handleChange('pc_id', value)}
              selectedValue={formData.pc_id}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <CAlert color="danger" className="mt-3">
              {error}
            </CAlert>
          )}

          <CModalFooter>
            <CTooltip content="Annulla">
              <CButton
                color="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <CIcon icon={icon.cilX} />
              </CButton>
            </CTooltip>
            <CTooltip content={selectedUser ? 'Salva modifiche' : 'Crea utente'}>
              <CButton
                type="submit"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CSpinner size="sm" />
                ) : (
                  <CIcon icon={selectedUser ? icon.cilSave : icon.cilPlus} />
                )}
              </CButton>
            </CTooltip>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalUser;
