import React from 'react';
import SelectComponent from './SelectComponent';
import { API_BASE_URL } from '../constants/config';

const CategorySelect = ({ onSelect, selectedValue,disabled }) => {
  return (
    <SelectComponent
      endpoint={`${API_BASE_URL}/categories`}
      label="un valore"
      onSelect={onSelect}
      selectedValue={selectedValue}
      disabled={disabled}
    />
  );
};

export default CategorySelect;
