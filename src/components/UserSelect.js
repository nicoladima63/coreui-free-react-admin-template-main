import React from 'react';
import SelectComponent from './SelectComponent';

const UserSelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/users" // L'endpoint per gli utenti
      label="un valore"
      onSelect={onSelect}
    />
  );
};

export default UserSelect;
