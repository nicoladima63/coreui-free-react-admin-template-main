import React from 'react';
import SelectComponent from './SelectComponent';

const WorkSelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/works"
      label="un valore"
      onSelect={onSelect}
    />
  );
};

export default WorkSelect;
