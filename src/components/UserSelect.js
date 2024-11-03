import React from 'react';
import SelectComponent from './SelectComponent';

const UserSelect = ({ onSelect, selectedValue }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/users" // L'endpoint per gli utenti
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue} // Passiamo il valore selezionato
    />
  );
};

export default UserSelect;
