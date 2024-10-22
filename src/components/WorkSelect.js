import React from 'react';
import SelectComponent from './SelectComponent';

const WorkSelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/works"
      label="Work"
      onSelect={onSelect}
    />
  );
};

export default WorkSelect;
