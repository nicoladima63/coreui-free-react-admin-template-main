import React from 'react';
import SelectComponent from './SelectComponent';
import { getCurrentConfig } from '../config/environment';
// Ottieni la configurazione corrente
const { apiBaseUrl } = getCurrentConfig();

const ProviderSelect = ({ onSelect, selectedValue, disabled }) => {
  return (
    <SelectComponent
      endpoint={`${apiBaseUrl}/providers`}
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue}
      disabled={disabled}
    />
  );
};

export default ProviderSelect
