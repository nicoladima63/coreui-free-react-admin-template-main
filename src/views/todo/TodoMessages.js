import React, { useState, useEffect,useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useToast } from '../../hooks/useToast';

import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CNav,
  CNavItem,
  CNavLink,
  CBadge,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import NewTodoModal from './TodoModal';
import { TodoService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const TodoMessages = () => {
  const [activeKey, setActiveKey] = useState(1);
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const auth = useSelector(state => state.auth);
  const currentUser = auth.user;
  const [activeTab, setActiveTab] = useState('received');


  const {
    data: sentTodos = [],
    isLoading: loadingSent,
    error: sentError,
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS, 'sent'],  // Differenziamo le chiavi
    queryFn: TodoService.getTodosSent,
    staleTime: 30000,  // Aggiungiamo staleTime
    cacheTime: 5 * 60 * 1000,  // E cacheTime come negli altri componenti
  });

  const {
    data: receivedTodos = [],
    isLoading: loadingReceived,
    error: receivedError,
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS, 'received', auth.user?.id],
    queryFn: TodoService.getTodosReceived,
    enabled: !!auth.user?.id,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
  });

  // Mutation per aggiornare un record
  const updateMutation = useMutation({
    mutationFn: TodoService.updateTodoStatus,
    onMutate: async (variables) => {
      // Aggiorniamo ottimisticamente
      const previousTodos = queryClient.getQueryData([QUERY_KEYS.TODOS, 'received', auth.user?.id]);
      queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', auth.user?.id], old =>
        old.map(todo => todo.id === variables.id ? { ...todo, status: variables.status } : todo)
      );
      return { previousTodos };
    },
    onError: (error, _, context) => {
      // Rollback in caso di errore
      queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', auth.user?.id], context.previousTodos);
      showError('Errore durante l\'aggiornamento del record');
    },
    onSuccess: () => {
      showSuccess('Record aggiornato con successo');
      queryClient.invalidateQueries([QUERY_KEYS.TODOS]);
    }
  });

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      read: 'info',
      in_progress: 'primary',
      completed: 'success'
    };

    return (
      <CBadge color={statusColors[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </CBadge>
    );
  };

  const handleStatusUpdate = useCallback(async (todoId, newStatus) => {
    try {
      await updateMutation.mutateAsync({ id: todoId, status: newStatus });
    } catch (error) {
      console.error('Error updating todo status:', error);
      showError('Errore nell\'aggiornamento dello stato');
    }
  }, [updateMutation, showError]);
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

  const renderEmptyState = () => (
    <CAlert color="warning" className="text-center">
      Nessuna record disponibile.
    </CAlert>
  );

  const renderContent = useCallback(() => {
    if (loadingReceived || loadingSent) {
      return renderLoading();
    }

    if (receivedError || sentError) {
      return renderError(receivedError || sentError);
    }

    const todos = activeKey === 'received' ? receivedTodos : sentTodos;
    if (!todos?.length) {
      return renderEmptyState();
    }

    return renderTodoTable(todos);
  }, [activeKey, loadingReceived, loadingSent, receivedError, sentError, receivedTodos, sentTodos]);

  const isLoading = updateMutation.isLoading || loadingReceived || loadingSent;


  const renderTodoTable = (todos) => (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Data</CTableHeaderCell>
          <CTableHeaderCell>{activeKey === 1 ? 'Da' : 'A'}</CTableHeaderCell>
          <CTableHeaderCell>Oggetto</CTableHeaderCell>
          <CTableHeaderCell>Priorità</CTableHeaderCell>
          <CTableHeaderCell>Stato</CTableHeaderCell>
          <CTableHeaderCell>Azioni</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {todos?.map((todo) => (
          <CTableRow key={todo.id}>
            <CTableDataCell>
              {format(new Date(todo.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
            </CTableDataCell>
            <CTableDataCell>
              {activeKey === 1 ? todo.sender?.name : todo.recipient?.name}
            </CTableDataCell>
            <CTableDataCell>{todo.subject}</CTableDataCell>
            <CTableDataCell>
              <CBadge color={todo.priority === 'high' ? 'danger' :
                todo.priority === 'medium' ? 'warning' : 'info'}>
                {todo.priority}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell>{getStatusBadge(todo.status)}</CTableDataCell>
            <CTableDataCell>
              {activeKey === 1 && todo.status !== 'completed' && (
                <>
                  <CButton
                    color="primary"
                    size="sm"
                    onClick={() => handleStatusUpdate(todo.id, 'in_progress')}
                    disabled={isLoading}
                  >
                    {isLoading ? <CSpinner size="sm" /> : <CIcon icon={icon.cilPencil} size="sm" />}
                  </CButton>
                  <CButton
                    color="success"
                    size="sm"
                    onClick={() => handleStatusUpdate(todo.id, 'completed')}
                    title="Completa"
                  >
                    <CIcon icon={icon.cilCheck} size="sm" />
                  </CButton>
                </>
              )}
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  );

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="align-items-center">
              <CCol>
                {currentUser.id}
                <strong>Todo Messages</strong>
              </CCol>
              <CCol xs="auto">
                <CButton
                  color="primary"
                  onClick={() => setIsModalVisible(true)}
                >
                  Nuovo Messaggio
                </CButton>
              </CCol>
            </CRow>
          </CCardHeader>
          <CCardBody>

            <CNav variant="tabs" role="tablist">
              <CNavItem>
                <CNavLink
                  active={activeTab === 'received'}
                  onClick={() => setActiveTab('received')}
                >
                  Ricevuti
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'sent'}
                  onClick={() => setActiveTab('sent')}
                >
                  Inviati
                </CNavLink>
              </CNavItem>
            </CNav>

            <div className="tab-content pt-4">
              {activeKey === 1 ? (
                loadingReceived ? (
                  renderLoading()
                ) : receivedError ? (
                  renderError(receivedError)
                ) : (
                  renderTodoTable(receivedTodos)
                )
              ) : (
                loadingSent ? (
                  renderLoading()
                ) : sentError ? (
                  renderError(sentError)
                ) : (
                  renderTodoTable(sentTodos)
                )
              )}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      {isModalVisible && (
        <NewTodoModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          senderId={currentUser.id}
        />
      )}
    </CRow>
  );
};

export default TodoMessages;
