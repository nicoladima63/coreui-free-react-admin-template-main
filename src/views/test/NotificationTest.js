// src/views/test/NotificationTest.js
import React, { useState,useEffect} from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useWebSocket } from '../../context/WebSocketContext';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CFormInput,
  CBadge,
  CSpinner,
  CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBell, cilBellExclamation, cilUser } from '@coreui/icons';
import UserSelect from '../../components/UserSelect';

const NotificationTest = () => {
  const [testMessage, setTestMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const { isConnected, websocketService } = useWebSocket();
  const {
    supported,
    permission,
    subscription,
    isRegistering,
    subscribe,
    requestPermission
  } = useNotifications();

  useEffect(() => {
    if (!websocketService) {
      console.error('WebSocket non connesso');
    }
  }, [websocketService]);
  const handleSetupNotifications = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    if (permission === 'granted' && !subscription) {
      await subscribe();
    }
  };

  const handleSendTest = () => {
    if (!websocketService || !recipientId || !testMessage) return;

    websocketService.send(JSON.stringify({
      type: 'todoMessage',
      recipientId: parseInt(recipientId),
      message: testMessage,
      priority: 'high',
      subject: 'Test Notification'
    }));

    setTestMessage('');
  };

  return (
    <CRow>
      <CCol xs={12} md={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <h4 className="mb-0">Setup Notifiche Push</h4>
          </CCardHeader>
          <CCardBody>
            {!supported ? (
              <CAlert color="warning">
                <CIcon icon={cilBellExclamation} className="me-2" />
                Il tuo browser non supporta le notifiche push
              </CAlert>
            ) : (
              <>
                <div className="mb-3">
                  <strong>Stato:</strong>{' '}
                  <CBadge color={permission === 'granted' ? 'success' : 'warning'}>
                    {permission === 'granted' ? 'Permesso accordato' : 'Permesso non concesso'}
                  </CBadge>
                </div>

                <div className="mb-3">
                  <strong>Subscription:</strong>{' '}
                  <CBadge color={subscription ? 'success' : 'danger'}>
                    {subscription ? 'Attiva' : 'Non attiva'}
                  </CBadge>
                </div>

                <CButton
                  color="primary"
                  onClick={handleSetupNotifications}
                  disabled={isRegistering || permission === 'denied'}
                >
                  {isRegistering ? (
                    <CSpinner size="sm" className="me-2" />
                  ) : (
                    <CIcon icon={cilBell} className="me-2" />
                  )}
                  {subscription ? 'Aggiorna Subscription' : 'Attiva Notifiche'}
                </CButton>
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12} md={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <h4 className="mb-0">
              Invia Notifica Test
              <CBadge
                color={isConnected ? 'success' : 'danger'}
                className="ms-2"
              >
                {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
              </CBadge>
            </h4>
          </CCardHeader>
          <CCardBody>
            <div className="mb-3">
              <label className="form-label">Utente Destinatario</label>
              <UserSelect
                onSelect={(value) => setRecipientId(value)}
                selectedValue={recipientId}
                disabled={!isConnected}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Messaggio di Test</label>
              <CFormInput
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Scrivi un messaggio di test"
              />
            </div>

            <CButton
              color="primary"
              onClick={handleSendTest}
              disabled={!isConnected || !recipientId || !testMessage}
            >
              <CIcon icon={cilUser} className="me-2" />
              Invia Notifica Test
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default NotificationTest;
