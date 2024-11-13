import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CBadge,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import { MessageService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';

const MessagesSection = ({ userId }) => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Query per ottenere i messaggi
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, userId],
    queryFn: () => MessageService.getMessagesForUser(userId),
  });

  // Mutation per segnare come letto
  const markAsReadMutation = useMutation({
    mutationFn: MessageService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.MESSAGES, userId]);
    },
  });

  const handleMarkAsRead = async (message) => {
    if (message.read) return;

    const confirmed = await showConfirmDialog({
      title: 'Conferma lettura',
      message: 'Vuoi segnare questo messaggio come letto?',
    });

    if (confirmed) {
      try {
        await markAsReadMutation.mutateAsync(message.id);
      } catch (error) {
        console.error('Errore durante l\'aggiornamento del messaggio:', error);
      }
    }
  };

  const renderError = (error) => (
    <CAlert color="danger" className="text-center">
      {error?.message || 'Errore durante il caricamento dei messaggi'}
    </CAlert>
  );

  const renderLoading = () => (
    <div className="text-center">
      <CSpinner color="primary" />
    </div>
  );

  const renderEmptyState = () => (
    <CAlert color="info" className="text-center">
      Nessun messaggio da visualizzare
    </CAlert>
  );

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Messaggi</h4>
          {messages.filter(m => !m.read).length > 0 && (
            <CBadge color="danger" shape="rounded-pill">
              {messages.filter(m => !m.read).length} non letti
            </CBadge>
          )}
        </div>
      </CCardHeader>
      <CCardBody>
        {isLoading ? (
          renderLoading()
        ) : error ? (
          renderError(error)
        ) : messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <CListGroup>
            {messages.map((message) => (
              <CListGroupItem
                key={message.id}
                className={`d-flex justify-content-between align-items-center ${!message.read ? 'bg-light' : ''
                  }`}
                onClick={() => handleMarkAsRead(message)}
                style={{ cursor: !message.read ? 'pointer' : 'default' }}
              >
                <div>
                  <div className="d-flex align-items-center">
                    <strong className="me-2">Da: {message.from.name}</strong>
                    {!message.read && (
                      <CBadge color="danger" shape="rounded-pill">Nuovo</CBadge>
                    )}
                  </div>
                  <div className="text-muted small">
                    {new Date(message.createdAt).toLocaleString('it-IT')}
                  </div>
                  <div className="mt-1">{message.content}</div>
                </div>
                {!message.read && (
                  <CIcon icon={icon.cilEnvelopeClosed} className="ms-2" />
                )}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
      </CCardBody>
      <ConfirmDialog />
    </CCard>
  );
};

export default MessagesSection;
