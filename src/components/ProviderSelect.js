import React from 'react';
import SelectComponent from './SelectComponent';

const ProviderSelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/providers"
      label="un valore"
      onSelect={onSelect}
    />
  );
};

export default ProviderSelect
