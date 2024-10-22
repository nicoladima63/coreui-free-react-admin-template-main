import React from 'react';
import SelectComponent from './SelectComponent';

const PCSelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/pcs" // L'endpoint per i PC
      label="PC"
      onSelect={onSelect}
    />
  );
};

export default PCSelect;
