import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CInputGroup,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import WorkSelect from '../../components/WorkSelect';
import DatePicker from 'react-datepicker'; // Importa il DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Importa il CSS del DatePicker


import { TasksService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';


const ModalTask = ({ visible, onClose, refreshData }) => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  const [tasks, setTasks] = useState([]);
  const [workid, setWorkid] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(null); // Inizia con null
  const [patient, setPatient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  //Mutation per creare un nuovo task
  const createWorkMutation = useMutation({
    mutationFn: TasksService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      setIsWorkModalVisible(false); // Chiudi il modale alla creazione
    },
    onError: (error) => {
      console.error('Errore durante la creazione del record:', error);
    },
  });


  const resetForm = () => {
    setPatient('');
    setWorkid('');
    setDeliveryDate(null); // Reset a null
    setSuccess(false);
    setError(null);
  };

  const renderError = (error) => (
    <CAlert color="danger" className="text-center">
      {error?.message || API_ERROR_MESSAGES.GENERIC_ERROR}
    </CAlert>
  );

  const renderSuccess = () => (
    <CAlert color="success" className="text-center">
      Record aggiunto con successo!
    </CAlert>
  );

  const renderLoading = () => (
    <div className="text-center">
      <CSpinner color="primary" />
    </div>
  );


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Format the delivery date for the database
    const formattedDate = deliveryDate ? deliveryDate.toISOString().split('T')[0] : null;

    const sendData = {
      patient,
      workid,
      deliveryDate: formattedDate,
      completed: false,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/tasks', sendData);
      if (response.status === 201) {
        setSuccess(true);
        refreshData(); // Aggiorna la lista
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error("Errore durante l'invio dei dati:", error);
      setSuccess(false);
      setError("Errore durante l'invio dei dati. Verifica i dati e riprova.");
    }
  };

  const fetchData = () => {
    setLoading(true);
    setError(null);
    axios
      .get('http://localhost:5000/api/aggregate/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setTasks(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Errore nel recupero delle lavorazioni:', error);
        setError('Errore nel recupero dei dati o connessione al server assente.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWorkSelect = (id) => {
    setWorkid(id);
  };

  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>Nuovo task</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Lavorazione</CFormLabel>
          <WorkSelect onSelect={handleWorkSelect} selectedValue={workid} required />
          <CFormLabel>Paziente</CFormLabel>
          <CFormInput
            type="text"
            value={patient}
            onChange={(e) => setPatient(e.target.value)}
            placeholder="Inserisci il paziente"
            required
          />
          <CFormLabel>Data Consegna</CFormLabel>
          <DatePicker
            selected={deliveryDate}
            onChange={(date) => setDeliveryDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control" // Aggiungi una classe per lo stile
            placeholderText="Seleziona la data di consegna"
            required
          />

          {error && (
            renderError(error)
          )}
          {success && (
            renderSuccess()
          )}
          <CModalFooter>
            <CButton color="secondary" onClick={onClose}>
              <CIcon icon={icon.cilHistory} className="me-2" />
            </CButton>
            <CButton type="submit" color="primary">
              <CIcon icon={icon.cilSave} className="me-2" />
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default ModalTask;
