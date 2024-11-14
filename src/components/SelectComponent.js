import React, { useState, useEffect } from 'react';
import { CFormSelect, CSpinner } from '@coreui/react';
import axios from 'axios';

const SelectComponent = ({ endpoint, label, onSelect, selectedValue, disabled }) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSelectedValue, setLocalSelectedValue] = useState(selectedValue || '');

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        // Verifica se i dati hanno la struttura works
        if (response.data && Array.isArray(response.data.works)) {
          setOptions(response.data.works);
        } else if (Array.isArray(response.data)) {
          // Fallback per altri endpoint che potrebbero restituire direttamente un array
          setOptions(response.data);
        } else {
          console.error('Formato dati non valido:', response.data);
          setOptions([]);
        }
      } catch (error) {
        console.error(`Errore nel recupero delle opzioni da ${endpoint}:`, error);
        setError(error.message);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [endpoint]);

  useEffect(() => {
    setLocalSelectedValue(selectedValue || '');
  }, [selectedValue]);

  const handleChange = (e) => {
    const value = e.target.value;
    setLocalSelectedValue(value);
    onSelect(value);
  };

  if (isLoading) {
    return (
      <div className="d-flex align-items-center">
        <CSpinner size="sm" className="me-2" />
        <small className="text-medium-emphasis">Caricamento opzioni...</small>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-danger small">
        Errore nel caricamento delle opzioni
      </div>
    );
  }

  return (
    <div>
      <CFormSelect
        size="sm"
        value={localSelectedValue}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="">Seleziona {label}</option>
        {options && options.length > 0 ? (
          options.map(option => (
            <option key={option.id} value={option.id}>
              {option.name || option.description || 'Opzione senza nome'}
            </option>
          ))
        ) : (
          <option value="" disabled>Nessuna opzione disponibile</option>
        )}
      </CFormSelect>
    </div>
  );
};

export default SelectComponent;
