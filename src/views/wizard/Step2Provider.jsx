import React, { useState } from 'react';
import { CForm, CFormInput, CFormLabel, CButton } from '@coreui/react';

const Step2Provider = ({ nextStep, prevStep, updateFormData }) => {
  const [providerName, setProviderName] = useState('');
  const [providerColor, setProviderColor] = useState('');

  const handleSave = () => {
    updateFormData({ provider: { name: providerName, color: providerColor } });
    nextStep();
  };

  return (
    <CForm>
      <CFormLabel>Nome Provider</CFormLabel>
      <CFormInput
        type="text"
        value={providerName}
        onChange={(e) => setProviderName(e.target.value)}
        placeholder="Inserisci il nome del provider"
      />
      <CFormLabel>Colore</CFormLabel>
      <CFormInput
        type="text"
        value={providerColor}
        onChange={(e) => setProviderColor(e.target.value)}
        placeholder="Inserisci il colore del provider"
      />
      <CButton color="secondary" onClick={prevStep}>Indietro</CButton>
      <CButton color="primary" onClick={handleSave}>Salva e Continua</CButton>
    </CForm>
  );
};

export default Step2Provider;
