import React from 'react';
import SelectComponent from './SelectComponent';
import { getCurrentConfig } from '../config/environment';

// Ottieni la configurazione corrente
const { apiBaseUrl } = getCurrentConfig();

const WorkSelect = ({ onSelect, selectedValue, disabled }) => {
  return (
    <SelectComponent
      endpoint={`${apiBaseUrl}/works`}
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue}
      disabled={disabled}
    />
  );
};

export default WorkSelect;
