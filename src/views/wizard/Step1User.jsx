import React, { useState } from 'react';
import { CForm, CFormInput, CFormLabel, CButton } from '@coreui/react';

const Step1User = ({ nextStep, updateFormData }) => {
  const [userName, setUserName] = useState('');

  const handleSave = () => {
    updateFormData({ user: { name: userName } });
    nextStep();
  };

  return (
    <CForm>
      <CFormLabel>Nome Utente</CFormLabel>
      <CFormInput
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Inserisci il nome dell'utente"
      />
      <CButton color="primary" onClick={handleSave}>Salva e Continua</CButton>
    </CForm>
  );
};

export default Step1User;
