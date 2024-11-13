import React, { useState, useEffect } from 'react';
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
import { websocketService } from '../../services/websocket';
import { UsersService, TodoService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';


const TodoView = () => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { showSuccess, showError } = useToast();

  // Query per gli utenti
  const { data: users = [], isLoading,error } = useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: UsersService.getUsers,
  });

  // Query per i todos
  const { data: todos = [], isLoadingTodo, errorTodo
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS],
    queryFn: TodoService.getTodosReceived,
  });

  // Mutation per segnare come letto
  const markAsReadMutation = useMutation({
    mutationFn: TodoService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TODOS, id]);
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
      {errorTodo?.message || 'Errore durante il caricamento dei messaggi'}
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


  useEffect(() => {
    // Gestione WebSocket
    websocketService.connect();

    websocketService.addHandler('connect', () => {
      setIsConnected(true);
      showSuccess('Connesso al server');
    });

    websocketService.addHandler('disconnect', () => {
      setIsConnected(false);
      showError('Disconnesso dal server');
    });

    // Aggiungi handler per le notifiche dei todos
    websocketService.addHandler('notification', (notification) => {
      if (notification.action === 'new_todo') {
        queryClient.invalidateQueries([QUERY_KEYS.TODOS]);
        showSuccess(`Nuovo todo da ${notification.data.senderName}`);
      }
    });

    return () => {
      websocketService.disconnect();
    };
  }, [queryClient, selectedUser, showSuccess, showError]);

  // Funzione per renderizzare i todos
  const renderTodos = () => {
    if (isLoadingTodos) {
      return <CSpinner />;
    }

    if (!todos.length) {
      return <div className="text-muted">Nessun todo</div>;
    }

    return todos.map(todo => (
      <div key={todo.id} className="todo-message p-3 mb-2 border rounded">
        <div className="d-flex justify-content-between">
          <strong>{todo.subject}</strong>
          <CBadge color={todo.priority === 'high' ? 'danger' : 'info'}>
            {todo.priority}
          </CBadge>
        </div>
        <div className="mt-2">{todo.message}</div>
        <small className="text-muted">
          Da: {todo.sender?.name} - Scadenza: {new Date(todo.dueDate).toLocaleDateString()}
        </small>
      </div>
    ));
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <p className="mb-0">Messaggi</p>
        {todos.filter(m => !m.read).length > 0 && (
          <CBadge color="danger" shape="rounded-pill">
            {todos.filter(m => !m.read).length} non letti
          </CBadge>
        )}
      </div>
        {isLoadingTodo ? (
          renderLoading()
        ) : errorTodo ? (
          renderError(errorTodo)
        ) : todos.length === 0 ? (
          renderEmptyState()
        ) : (
          <CListGroup>
            {todos.map((message) => (
              <CListGroupItem
                key={message.id}
                className={`d-flex justify-content-between align-items-center'}`}
                onClick={() => handleMarkAsRead(message)}
                style={{ cursor: !message.read ? 'pointer' : 'default' }}
              >
                <div>
                  <div className="d-flex align-items-center">
                    <strong className="me-2">Da: {message.senderId}</strong>
                    {!message.readAt && (
                      <CBadge color="danger" shape="rounded-pill">Nuovo</CBadge>
                    )}
                  </div>
                  <div className="text-muted small">
                    {new Date(message.createdAt).toLocaleString('it-IT')}
                  </div>
                  <div className="mt-1">{message.subject}</div>
                </div>
                {!message.readAt && (
                  <CIcon icon={icon.cilEnvelopeClosed} className="ms-2" />
                )}
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
      <ConfirmDialog />
    </>
  );
};

export default TodoView;
