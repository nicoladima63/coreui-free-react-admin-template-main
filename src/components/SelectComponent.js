import React, { useState, useEffect } from 'react';
import { CFormSelect } from '@coreui/react';
import axios from 'axios';

const SelectComponent = ({ endpoint, label, onSelect, selectedValue }) => {
  const [options, setOptions] = useState([]);
  const [localSelectedValue, setLocalSelectedValue] = useState(selectedValue || '');

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

  // Effettua l'aggiornamento se selectedValue cambia
  useEffect(() => {
    setLocalSelectedValue(selectedValue);
  }, [selectedValue]);

  const handleChange = (e) => {
    const value = e.target.value;
    setLocalSelectedValue(value);
    onSelect(value); // Pass the selected value back to the parent
  };

  return (
    <div>
      <CFormSelect size="sm" value={localSelectedValue} onChange={handleChange}>
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
