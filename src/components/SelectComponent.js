import React, { useState, useEffect } from 'react';
import { CFormSelect } from '@coreui/react';
import axios from 'axios';

const SelectComponent = ({ endpoint, label, onSelect }) => {
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    // Fetch data from the provided endpoint
    axios.get(endpoint, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(response => {
        setOptions(response.data);
      })
      .catch(error => {
        console.error(`Errore nel recupero delle opzioni da ${endpoint}:`, error);
      });
  }, [endpoint]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    onSelect(value); // Pass the selected value back to the parent
  };

  return (
    <div>
      {/*<label>{label}</label>*/}
      <CFormSelect size="sm" value={selectedValue} onChange={handleChange}>
        <option value="">Seleziona {label}</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name || option.description}
          </option>
        ))}
      </CFormSelect>
    </div>
  );
};

export default SelectComponent;
