import React from 'react';
import SelectComponent from './SelectComponent';

const TaskSelect = ({ onSelect }) => {
  return (
    <SelectComponent
      endpoint="http://localhost:5000/api/tasks" // L'endpoint per i task
      label="Task"
      onSelect={onSelect}
    />
  );
};

export default TaskSelect;
