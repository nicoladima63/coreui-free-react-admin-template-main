import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

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
import { websocketService } from '../../services/websocket';
import { UsersService, TodoService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';

const MessageItem = React.memo(({ message, onClick, isLoading }) => {

  const handleClick = (e) => {
    e.preventDefault();
    if (!isLoading && onClick) {
      onClick(message);
    }
  };
  return (
    <div
      onClick={handleClick}
      className={`
        message-item d-flex align-items-start p-3 border-bottom border-dark
        ${!message.read ? 'message-unread' : ''}
      `}
      style={{
        backgroundColor: 'var(--cui-dark)',
        borderLeft: '4px solid',
        borderLeftColor: message.priority === 'high' ? 'var(--cui-danger)' :
          'var(--cui-primary-subtle)',
        cursor: 'pointer', // Aggiungiamo il cursore pointer
        transition: 'all 0.2s ease', // Aggiungiamo una transizione fluida
        '&:hover': {
          backgroundColor: 'var(--cui-dark-hover)', // Effetto hover
          transform: 'translateX(2px)' // Leggero spostamento al hover
        }
      }}
    >

      {/* Icona Messaggio */}
      <div className="message-icon me-3">
        <div className={`
          rounded-circle d-flex align-items-center justify-content-center
          ${message.type === 'step_notification' ? 'bg-info-subtle' : 'bg-primary-subtle'}
        `}
          style={{ width: '40px', height: '40px' }}>
          <CIcon
            icon={message.type === 'step_notification' ? icon.cilBell : icon.cilEnvelopeClosed}
            className="text-light"
            size="lg"
          />
        </div>
      </div>

      {/* Contenuto Messaggio */}
      <div className="flex-grow-1 min-width-0">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div className="d-flex align-items-center">
            {!message.read && (
              <CBadge
                className="me-2"
                color="primary"
                shape="rounded-pill"
              >
                Nuovo
              </CBadge>
            )}
            {message.priority === 'high' && (
              <CBadge
                color="danger"
                shape="rounded-pill"
              >
                Priorità Alta
              </CBadge>
            )}
          </div>
          <small className="text-medium-emphasis ms-2">
            {formatTimeAgo(message.createdAt)}
          </small>
        </div>

        <h6 className="mb-1 text-light">
          {message.type === 'step_notification' ? 'Notifica Step' : message.from?.name}
        </h6>

        <p className="mb-0 text-medium-emphasis">
          {message.content}
        </p>
      </div>
    </div>
  );
});

const formatTimeAgo = (date) => {
  if (!date) return 'Data non disponibile';

  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now - messageDate) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Se la data non è valida
  if (isNaN(diffInSeconds)) return 'Data non valida';

  // Meno di 1 minuto fa
  if (diffInSeconds < 60) {
    return 'Adesso';
  }

  // Meno di 1 ora fa
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min fa`;
  }

  // Meno di 24 ore fa
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'ora' : 'ore'} fa`;
  }

  // Meno di 7 giorni fa
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'giorno' : 'giorni'} fa`;
  }

  // Più di 7 giorni fa: mostra la data completa
  return messageDate.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};


const MessagesSection = ({ userId }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  const [processingMessageId, setProcessingMessageId] = useState(null);
  // Funzione di validazione dei messaggi
  const validateMessage = useCallback((message) => {
    if (!message) return false;
    return {
      ...message,
      id: message.id || Math.random(),
      type: message.type || 'generic',
      from: message.from || { name: 'Sistema' },
      content: message.content || 'Nessun contenuto',
      createdAt: message.createdAt || new Date().toISOString(),
      read: !!message.read
    };
  }, []);

  // Query per i todos con configurazione ottimizzata
  const {
    data: todos = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS],
    queryFn: TodoService.getTodosReceived,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Computed values con validazione
  const sortedTodos = useMemo(() => {
    if (!Array.isArray(todos)) return [];

    return [...todos]
      .map(validateMessage)
      .filter(Boolean)
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [todos, validateMessage]);

  // Conteggio messaggi non letti
  const unreadCount = useMemo(() => {
    if (!Array.isArray(todos)) return 0;
    return todos.filter(message => message && !message.read).length;
  }, [todos]);

  // Mutation per segnare come letto
  const markAsReadMutation = useMutation({
    mutationFn: TodoService.markAsRead,
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries([QUERY_KEYS.TODOS]);
      showSuccess('Messaggio segnato come letto');
      setProcessingMessageId(null);
    },
    onError: (error) => {
      showError(error);
      setProcessingMessageId(null);
    }
  });
  // WebSocket setup
  useEffect(() => {
    websocketService.connect();

    const handlers = {
      connect: () => {
        setIsConnected(true);
        showSuccess('Connesso al server messaggi');
      },
      disconnect: () => {
        setIsConnected(false);
        showError('Disconnesso dal server messaggi');
      },
      notification: (notification) => {
        if (notification.action === 'new_todo') {
          queryClient.invalidateQueries([QUERY_KEYS.TODOS]);
          showSuccess(`Nuovo messaggio da ${notification.data?.senderName || 'Sistema'}`);
        }
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      websocketService.addHandler(event, handler);
    });

    return () => {
      websocketService.disconnect();
    };
  }, [queryClient, showSuccess, showError]);

  // Handlers
  const handleMarkAsRead = useCallback(async (message) => {
    if (!message?.id || message.read || processingMessageId) return;

    try {
      setProcessingMessageId(message.id);
      await markAsReadMutation.mutateAsync(message.id);
    } catch (error) {
      showError('Errore nel segnare il messaggio come letto');
    }
  }, [markAsReadMutation, processingMessageId, showError]);

  const handleMessageClick = useCallback(async (message) => {
    if (!message?.id || processingMessageId) return;

    try {
      if (message.type === 'step_notification') {
        const confirmed = await showConfirmDialog({
          title: 'Notifica step',
          message: 'Vuoi andare alla pagina del task?',
          confirmText: 'Vai al task',
          cancelText: 'Solo segna come letto',
          confirmColor: 'primary'
        });

        // Segna sempre come letto
        await handleMarkAsRead(message);

        // Se confermato e abbiamo un ID del task, naviga
        if (confirmed && message.relatedTaskId) {
          navigate(`/tasks/${message.relatedTaskId}`);
        }
      } else {
        // Per i messaggi normali, chiedi conferma per segnare come letto
        const confirmed = await showConfirmDialog({
          title: 'Conferma lettura',
          message: 'Vuoi segnare questo messaggio come letto?',
          confirmText: 'Segna come letto',
          cancelText: 'Annulla'
        });

        if (confirmed) {
          await handleMarkAsRead(message);
        }
      }
    } catch (error) {
      showError('Errore nella gestione del messaggio');
    }
  }, [processingMessageId, showConfirmDialog, handleMarkAsRead, navigate, showError]);

  // Renderers
  const renderMessageIcon = useCallback((message) => {
    if (markAsReadMutation.isLoading && markAsReadMutation.variables === message?.id) {
      return <CSpinner size="sm" />;
    }

    if (!message?.read) {
      return message.type === 'step_notification'
        ? <CIcon icon={icon.cilBell} className="text-warning" />
        : <CIcon icon={icon.cilEnvelopeClosed} className="text-primary" />;
    }

    return message.type === 'step_notification'
      ? <CIcon icon={icon.cilBellExclamation} className="text-muted" />
      : <CIcon icon={icon.cilEnvelopeLetter} className="text-muted" />;
  }, [markAsReadMutation]);

  const renderMessageContent = useCallback((message) => {
    if (!message) return null;

    const senderName = message.from?.name || 'Sistema';
    const messageTitle = message.type === 'step_notification'
      ? 'Notifica Step'
      : `Da: ${senderName}`;

    return (
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-1">
            <strong className="me-2">{messageTitle}</strong>
            {!message.read && (
              <CBadge
                color={message.type === 'step_notification' ? 'info' : 'danger'}
                shape="rounded-pill"
              >
                Nuovo
              </CBadge>
            )}
            {message.priority === 'high' && (
              <CBadge color="danger" shape="rounded-pill" className="ms-2">
                Alta Priorità
              </CBadge>
            )}
          </div>
          <div className="text-muted small">
            {message.createdAt
              ? new Date(message.createdAt).toLocaleString('it-IT')
              : 'Data non disponibile'
            }
          </div>
          <div className="mt-2">{message.content || 'Nessun contenuto'}</div>
        </div>
        <div className="ms-3">
          {renderMessageIcon(message)}
        </div>
      </div>
    );
  }, [renderMessageIcon]);

  return (
    <CCard className="h-100">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h5 className="mb-0 me-3">Centro Notifiche</h5>
            <CBadge
              color={isConnected ? 'success' : 'danger'}
              className="d-flex align-items-center px-2"
              shape="rounded-pill"
            >
              <CIcon
                icon={isConnected ? icon.cilCheckCircle : icon.cilWarning}
                size="sm"
                className="me-1"
              />
              {isConnected ? 'Online' : 'Offline'}
            </CBadge>
          </div>
          {unreadCount > 0 && (
            <CBadge
              color="primary"
              shape="rounded-pill"
              className="px-3"
            >
              {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
            </CBadge>
          )}
        </div>
      </CCardHeader>

      <div className="messages-container position-relative">
        {isLoading ? (
          <div className="text-center p-4">
            <CSpinner className="mb-2" />
            <p className="text-medium-emphasis mb-0">Caricamento messaggi...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" className="m-3">
            <CIcon icon={icon.cilBan} className="me-2" />
            {error.message || 'Errore nel caricamento dei messaggi'}
          </CAlert>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center p-4">
            <div className="text-medium-emphasis mb-3">
              <CIcon
                icon={icon.cilInbox}
                size="3xl"
                className="opacity-50"
              />
            </div>
            <h6>Nessun messaggio</h6>
            <p className="text-medium-emphasis small mb-0">
              I nuovi messaggi appariranno qui
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {sortedTodos.map((message) => (
              <MessageItem
                key={message?.id || Math.random()}
                message={message}
                onClick={handleMessageClick}
                isLoading={processingMessageId === message?.id}
              />
            ))}
          </div>)}

        {isFetching && !isLoading && (
          <div className="text-center p-2 border-top">
            <small className="text-medium-emphasis">
              <CSpinner size="sm" className="me-2" />
              Aggiornamento...
            </small>
          </div>
        )}
      </div>
    </CCard>
  );
};

export default MessagesSection;
