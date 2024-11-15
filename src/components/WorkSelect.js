import React from 'react';
import SelectComponent from './SelectComponent';
import { API_BASE_URL } from '../constants/config';

const WorkSelect = ({ onSelect, selectedValue, disabled }) => {
  return (
    <SelectComponent
      endpoint={`${API_BASE_URL}/works`}
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue}
      disabled={disabled}
    />
  );
};

export default WorkSelect;
