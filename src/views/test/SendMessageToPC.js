import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../../context/WebSocketContext';
import { PCService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';
import PCSelect from '../../components/PCSelect';

const SendMessageToPC = () => {
  const queryClient = useQueryClient();
  const [pcList, setPcList] = useState([]); // Lista dei PC
  const [selectedPc, setSelectedPc] = useState(''); // PC selezionato
  const [message, setMessage] = useState(''); // Messaggio da inviare
  const [ws, setWs] = useState(null); // Connessione WebSocket


  const {
    data: pcs = [],
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: [QUERY_KEYS.PCS],
    queryFn: PCService.getPCs
  });

  // Funzione per inviare il messaggio
  const sendMessage = () => {
    if (!selectedPc || !message) {
      alert('Seleziona un PC e scrivi un messaggio');
      return;
    }

    // Invia il messaggio tramite WebSocket
    const messageData = {
      type: 'chat',
      to: selectedPc, // ID del PC destinatario
      content: message
    };

    ws.send(JSON.stringify(messageData));
    setMessage(''); // Reset del messaggio
  };
  const renderError = (error) => (
    <CAlert color="danger" className="text-center">
      {error?.message || API_ERROR_MESSAGES.GENERIC_ERROR}
    </CAlert>
  );

  const renderLoading = () => (
    <div className="text-center">
      <CSpinner color="primary" />
    </div>
  );


  return (
    <div>
      <h2>Invia Messaggio a un PC Specifico</h2>

      <label>Seleziona PC:</label>
      <PCSelect
        onSelect={(value) => setSelectedPc(value)}
        selectedValue={selectedPc}
        required
      />

      <br />

      <label>Messaggio:</label>
      <textarea
        rows="4"
        cols="50"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Scrivi il tuo messaggio..."
      />

      <br />

      <button onClick={sendMessage}>Invia Messaggio</button>
    </div>
  );
};

export default SendMessageToPC;
