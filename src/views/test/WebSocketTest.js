// views/test/WebSocketTest.js
import React, { useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormInput,
  CBadge,
  CAlert,
} from '@coreui/react';
import { useWebSocket } from '../../context/WebSocketContext';
import { websocketService } from '../../services/websocket';

const WebSocketTest = () => {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const { isConnected } = useWebSocket();

  const debugInfo = {
    token: localStorage.getItem('token'),
    isConnected
  };
  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { text, type, timestamp: new Date().toISOString() }]);
  };

  const handleSendTest = () => {
    try {
      // Invia un messaggio di test tramite WebSocket
      const testMessage = {
        type: 'chat',
        content: message || 'Messaggio di test',
        to: 1 // ID utente di test
      };

      websocketService.sendMessage(testMessage);
      addLog(`Messaggio inviato: ${message}`);
    } catch (error) {
      addLog(`Errore nell'invio: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-4">
      <div className="mt-4">
        <h5>Debug Info:</h5>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Test WebSocket</h4>
          <CBadge color={isConnected ? 'success' : 'danger'}>
            {isConnected ? 'Connesso' : 'Disconnesso'}
          </CBadge>
        </CCardHeader>
        <CCardBody>
          <div className="mb-4">
            <div className="d-flex gap-2 mb-3">
              <CFormInput
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Messaggio di test"
              />
              <CButton
                color="primary"
                onClick={handleSendTest}
                disabled={!isConnected}
              >
                Invia Test
              </CButton>
              <CButton
                color="secondary"
                onClick={clearLogs}
              >
                Pulisci Log
              </CButton>
            </div>
          </div>

          <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div className="text-center text-muted">
                Nessun log disponibile
              </div>
            ) : (
              logs.map((log, index) => (
                <CAlert
                  key={index}
                  color={log.type === 'error' ? 'danger' : 'info'}
                  className="mb-2 py-2"
                >
                  <small className="text-muted">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </small>
                  <div>{log.text}</div>
                </CAlert>
              ))
            )}
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default WebSocketTest;
