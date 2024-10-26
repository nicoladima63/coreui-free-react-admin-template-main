import React from 'react';
import SelectComponent from './SelectComponent';

const CategorySelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/categories"
      label="un valore"
      onSelect={onSelect}
    />
  );
};

export default CategorySelect;
