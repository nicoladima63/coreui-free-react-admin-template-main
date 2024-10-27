import React from 'react';
import SelectComponent from './SelectComponent';

const CategorySelect = ({ onSelect, selectedValue }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/categories"
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue} // Passiamo il valore selezionato
    />
  );
};

export default CategorySelect;
