import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { websocketService } from '../../services/websocket';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CBadge,
  CSpinner,
  CAlert,
  CButton,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import { UsersService, TodoService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';

const MessageItem = React.memo(({ message, onClick, isLoading }) => {
  const isRead = !!message.readAt || message.status === 'read';

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
        ${!isRead ? 'message-unread' : ''}
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
      <div className="message-icon me-2">
        <div className={`
          rounded-circle d-flex align-items-center justify-content-center
          ${message.type === 'step_notification' ? 'bg-info-subtle' : 'bg-primary-subtle'}
        `}
        >
          <CIcon
            icon={message.type === 'step_notification' ? icon.cilBell : icon.cilEnvelopeLetter}
            className="text-light"
            size="sm"
          />
        </div>
      </div>

      {/* Contenuto Messaggio */}
      <div className="flex-grow-1 min-width-0">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div className="d-flex align-items-center">
            {!isRead && (
              <CBadge
                className="me-2"
                color="info"
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
                Urgente
              </CBadge>
            )}
          </div>
        </div>
        <small className="text-medium-emphasis ms-2">
          {formatTimeAgo(message.createdAt)}
        </small>

        <h6 className="mb-1 text-light">
          {message.type === 'step_notification' ? 'Notifica Step' : message.sender?.name} scrive:
        </h6>

        <p className="mb-0 text-medium-emphasis">
          {message.message}
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


const MessagesSection = ({ userId ,onOpenSteps}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [showReadMessages, setShowReadMessages] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState(null);
  // WebSocket setup migliorato
  useEffect(() => {
    let mounted = true;

    const handlers = {
      connect: () => {
        if (mounted) {
          setIsConnected(true);
          queryClient.invalidateQueries([QUERY_KEYS.TODOS, 'received', userId]);
        }
      },

      disconnect: () => {
        if (mounted) setIsConnected(false);
      },

      newTodoMessage: (message) => {
        if (!mounted || message.recipientId !== userId) return;

        queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], old => {
          const oldMessages = Array.isArray(old) ? old : [];
          // Evita duplicati
          if (oldMessages.some(m => m.id === message.id)) return oldMessages;
          return [message, ...oldMessages];
        });

        if (message.priority === 'high') {
          showSuccess({
            title: 'Nuovo messaggio urgente',
            message: message.subject,
            duration: 5000
          });
        } else {
          showSuccess({
            title: 'Nuovo messaggio',
            message: message.subject
          });
        }
      },

      todoMessageRead: (update) => {
        if (!mounted) return;
        queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], old => {
          if (!Array.isArray(old)) return old;
          return old.map(msg =>
            msg.id === update.messageId
              ? { ...msg, status: 'read', readAt: update.readAt }
              : msg
          );
        });
      }
    };

    // Registra gli handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      websocketService.addHandler(event, handler);
    });

    // Connetti solo se non già connesso
    if (!isConnected) {
      try {
        websocketService.connect();
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    }

    // Cleanup
    return () => {
      mounted = false;
      Object.entries(handlers).forEach(([event, handler]) => {
        websocketService.removeHandler(event, handler);
      });
    };
  }, [userId, queryClient, showSuccess]); // Rimosso isConnected dalle dipendenze

  // Query principale per i messaggi
  const {
    data: todos = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS, 'received', userId],
    queryFn: TodoService.getTodosReceived,
    refetchInterval: isConnected ? false : 30000,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
    enabled: !!userId,
    onError: (error) => {
      showError('Errore nel caricamento dei messaggi');
    }
  });

  // Mutation per segnare come letto
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      const result = await TodoService.markAsRead(messageId);

      if (isConnected) {
        websocketService.send({
          type: 'markTodoMessageRead',
          messageId,
          readAt: new Date().toISOString()
        });
      }

      return result;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries([QUERY_KEYS.TODOS, 'received', userId]);
      const previousTodos = queryClient.getQueryData([QUERY_KEYS.TODOS, 'received', userId]);

      queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], old => {
        if (!Array.isArray(old)) return old;
        return old.map(msg =>
          msg.id === messageId
            ? { ...msg, readAt: new Date().toISOString(), status: 'read' }
            : msg
        );
      });

      return { previousTodos };
    },
    onError: (err, messageId, context) => {
      queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], context.previousTodos);
      showError('Errore nel segnare il messaggio come letto');
    }
  });

  // Handler per click sul messaggio
  const handleMessageClick = useCallback(async (message) => {
    if (!message?.id) return;
    console.log(JSON.stringify(message, null, 2));
    //return
    // Previene clic multipli sullo stesso messaggio
    const currentProcessingId = message.id;
    if (processingMessageId === currentProcessingId) return;

    try {
      setProcessingMessageId(currentProcessingId);

      // Prima marca come letto
      await markAsReadMutation.mutateAsync(currentProcessingId);

      // Poi gestisce la navigazione se necessario
      if (message.type === 'step_notification' && message.relatedTaskId) {
        const confirmed = await showConfirmDialog({
          title: 'Notifica step',
          message: 'Vuoi andare alla fase di lavorazione?',
          confirmText: 'Vai alla fase',
          cancelText: 'Solo segna come letto',
          confirmColor: 'primary'
        });

        if (confirmed) {
          const tasksData = queryClient.getQueryData([QUERY_KEYS.TASKS]);
          const task = tasksData?.find(t => t.id === message.relatedTaskId);
          if (task) {
            onOpenSteps(task, message.relatedStepId);
          }
        }
      }

    } catch (error) {
      showError('Errore nella gestione del messaggio');
    } finally {
      // Resetta solo se è ancora il messaggio corrente
      setProcessingMessageId(prev =>
        prev === currentProcessingId ? null : prev
      );
    }
  }, [processingMessageId, showConfirmDialog, markAsReadMutation, showError, queryClient, onOpenSteps]);

  // Computed values
  const sortedTodos = useMemo(() => {
    if (!Array.isArray(todos)) return [];

    return [...todos]
      .filter(todo => showReadMessages ? true : (!todo.readAt && todo.status !== 'read'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [todos, showReadMessages]);

  const unreadCount = useMemo(() => {
    return todos.filter(message => !message?.readAt && message?.status !== 'read').length;
  }, [todos]);



  return (
    <CCard className="h-100">
      <CCardHeader>
        {/* Prima riga: titolo e bottone filtro */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Centro Notifiche</h5>
          <CButton
            color="link"
            onClick={() => setShowReadMessages(prev => !prev)}
            className="p-0" // Rimuove il padding extra del bottone
          >
            {showReadMessages ? 'Nascondi letti' : 'Mostra tutti'}
          </CButton>
        </div>

        {/* Seconda riga: badge di connessione e contatore messaggi */}
        <div className="d-flex justify-content-between align-items-center">

          {unreadCount > 0 && (
            <CBadge
              color="primary"
              shape="rounded-pill"
              className="px-2"
            >
              {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
            </CBadge>
          )}

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
              <CIcon icon={icon.cilInbox} size="3xl" className="opacity-50" />
            </div>
            <h6>Nessun messaggio</h6>
            <p className="text-medium-emphasis small mb-0">
              {isConnected ?
                'I nuovi messaggi appariranno qui' :
                'Riconnessione in corso...'}
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {sortedTodos.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onClick={handleMessageClick}
                isLoading={processingMessageId === message.id}
              />
            ))}
          </div>
        )}
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
