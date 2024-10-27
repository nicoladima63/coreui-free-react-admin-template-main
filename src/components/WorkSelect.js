import React from 'react';
import SelectComponent from './SelectComponent';

const WorkSelect = ({ onSelect, selectedValue }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/works"
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue} // Passiamo il valore selezionato
    />
  );
};

export default WorkSelect;
