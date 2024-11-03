import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CBadge,
  CSpinner,
} from '@coreui/react';
import { websocketService } from '../../services/websocket';
import { MessageService } from '../../services/api';
import { ChatMessage } from '../../components/messaging/ChatMessage';
import { ChatInput } from '../../components/messaging/ChatInput';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';

const MessagingView = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  // Query per gli utenti
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: UsersService.getUsers,
  });

  // Query per i messaggi
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, selectedUser?.id],
    queryFn: () => MessageService.getMessages(selectedUser?.id),
    enabled: !!selectedUser,
  });

  useEffect(() => {
    // Gestione WebSocket
    websocketService.connect();

    websocketService.addHandler('connect', () => {
      setIsConnected(true);
      showSuccess('Connesso al server messaggi');
    });

    websocketService.addHandler('disconnect', () => {
      setIsConnected(false);
      showError('Disconnesso dal server messaggi');
    });

    websocketService.addHandler('chat', (message) => {
      queryClient.invalidateQueries([QUERY_KEYS.MESSAGES]);
      if (message.fromId !== selectedUser?.id) {
        showSuccess(`Nuovo messaggio da ${message.sender.name}`);
      }
    });

    return () => {
      websocketService.disconnect();
    };
  }, [queryClient, selectedUser, showSuccess, showError]);

  const handleSendMessage = async (content) => {
    if (!selectedUser || !content.trim() || !isConnected) {
      return;
    }

    try {
      websocketService.sendMessage(selectedUser.id, content);
    } catch (error) {
      showError('Errore nell\'invio del messaggio');
    }
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Messaggi</h4>
              <CBadge color={isConnected ? 'success' : 'danger'}>
                {isConnected ? 'Connesso' : 'Disconnesso'}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md={4}>
                {isLoadingUsers ? (
                  <CSpinner />
                ) : (
                  <div className="user-list border rounded">
                    {users.map(user => (
                      <div
                        key={user.id}
                        className={`p-3 border-bottom user-item ${selectedUser?.id === user.id ? 'active bg-light' : ''
                          }`}
                        onClick={() => setSelectedUser(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="fw-bold">{user.name}</div>
                        <small className="text-muted">{user.pc_id}</small>
                      </div>
                    ))}
                  </div>
                )}
              </CCol>
              <CCol md={8}>
                {selectedUser ? (
                  <>
                    <div className="chat-header mb-3">
                      Chat con {selectedUser.name} ({selectedUser.pc_id})
                    </div>
                    <div
                      className="chat-messages border rounded p-3 mb-3"
                      style={{ height: '400px', overflowY: 'auto' }}
                    >
                      {isLoadingMessages ? (
                        <div className="text-center">
                          <CSpinner />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted">
                          Nessun messaggio
                        </div>
                      ) : (
                        messages.map(message => (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            currentUserId={selectedUser.id}
                          />
                        ))
                      )}
                    </div>
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      disabled={!isConnected}
                    />
                  </>
                ) : (
                  <div className="text-center text-muted">
                    Seleziona un utente per iniziare una chat
                  </div>
                )}
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default MessagingView;
