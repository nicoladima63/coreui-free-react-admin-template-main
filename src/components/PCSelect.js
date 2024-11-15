import React from 'react';
import SelectComponent from './SelectComponent';
import { API_BASE_URL } from '../constants/config';

const PCSelect = ({ onSelect, selectedValue, disabled }) => {
  return (
    <SelectComponent
      endpoint={`${API_BASE_URL}/pcs`}
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue}
      disabled={disabled}
    />
  );
};

export default PCSelect;
