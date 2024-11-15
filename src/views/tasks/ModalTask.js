// ModalTask.js
import React, { useEffect, useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
  CSpinner,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

const ModalTask = ({ visible, onClose, onSave, selectedTask }) => {
  const [formData, setFormData] = useState({
    patient: '',
    deliveryDate: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        patient: selectedTask.patient || '',
        deliveryDate: selectedTask.deliveryDate ? new Date(selectedTask.deliveryDate).toISOString().split('T')[0] : '',
      });
    } else {
      resetForm();
    }
  }, [selectedTask]);

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
      if (!formData.patient.trim()) {
        throw new Error('Il paziente è obbligatorio');
      }
      if (!formData.deliveryDate) {
        throw new Error('La data di consegna è obbligatoria');
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
      patient: '',
      deliveryDate: '',
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
        <h5>Modifica Task</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Paziente</CFormLabel>
            <CFormInput
              type="text"
              placeholder="Nome paziente"
              value={formData.patient}
              onChange={(e) => handleChange('patient', e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Data di consegna</CFormLabel>
            <CFormInput
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleChange('deliveryDate', e.target.value)}
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
            <CTooltip content="Salva modifiche">
              <CButton
                type="submit"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CSpinner size="sm" />
                ) : (
                  <CIcon icon={icon.cilSave} />
                )}
              </CButton>
            </CTooltip>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalTask;
