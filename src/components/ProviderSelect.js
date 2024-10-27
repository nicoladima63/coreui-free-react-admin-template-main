import React from 'react';
import SelectComponent from './SelectComponent';

const ProviderSelect = ({ onSelect, selectedValue }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/providers"
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue} // Passiamo il valore selezionato
    />
  );
};

export default ProviderSelect
