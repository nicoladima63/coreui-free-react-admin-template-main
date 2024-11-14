// ModalPC.js
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
  CFormSwitch,
  CAlert,
  CSpinner,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

const ModalPC = ({ visible, onClose, onSave, selectedPC }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ipAddress: '',
    status: true,
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedPC) {
      setFormData({
        name: selectedPC.name || '',
        location: selectedPC.location || '',
        ipAddress: selectedPC.ipAddress || '',
        status: selectedPC.status ?? true,
      });
    } else {
      resetForm();
    }
  }, [selectedPC]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
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
      if (!formData.location.trim()) {
        throw new Error('La location è obbligatoria');
      }
      if (!formData.ipAddress.trim()) {
        throw new Error('L\'indirizzo IP è obbligatorio');
      }
      // Validazione IP semplice
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formData.ipAddress)) {
        throw new Error('Formato indirizzo IP non valido');
      }

      await onSave(formData);
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
      location: '',
      ipAddress: '',
      status: true,
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
        <h5>{selectedPC ? 'Modifica' : 'Nuova'} Postazione</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Nome Postazione</CFormLabel>
            <CFormInput
              type="text"
              placeholder="Es: PC-UFFICIO-1"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Ubicazione</CFormLabel>
            <CFormInput
              type="text"
              placeholder="Es: Ufficio Tecnico"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Indirizzo IP</CFormLabel>
            <CFormInput
              type="text"
              placeholder="Es: 192.168.1.100"
              value={formData.ipAddress}
              onChange={(e) => handleChange('ipAddress', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Stato</CFormLabel>
            <CFormSwitch
              label={formData.status ? "Attivo" : "Inattivo"}
              checked={formData.status}
              onChange={(e) => handleChange('status', e.target.checked)}
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
            <CTooltip content={selectedPC ? 'Salva modifiche' : 'Crea postazione'}>
              <CButton
                type="submit"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CSpinner size="sm" />
                ) : (
                  <CIcon icon={selectedPC ? icon.cilSave : icon.cilPlus} />
                )}
              </CButton>
            </CTooltip>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalPC;
