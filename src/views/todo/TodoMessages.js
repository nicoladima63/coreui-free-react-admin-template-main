import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  //const currentUser = useSelector(state => state.auth.user);

  const auth = useSelector(state => state.auth);
  const [currentUser, setCurrentUser] = useState({});
  useEffect(() => {
    //console.log('Auth state:', auth);
    //console.log('LocalStorage user:', localStorage.getItem('user'));
    //console.log('LocalStorage token:', localStorage.getItem('token'));
    setCurrentUser(auth.user);

  }, [auth]);

  //const { useReceivedTodos, useSentTodos, useUpdateTodoStatus } = useTodoMessages();
  //const { data: receivedTodos, isLoading: loadingReceived } = useReceivedTodos();
  //const { data: sentTodos, isLoading: loadingSent } = useSentTodos();
  //const updateTodoStatus = useUpdateTodoStatus();

  const {
    data: sentTodos = [],
    isLoading: loadingSent,
    error: sentError,
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS],
    queryFn: TodoService.getTodosSent,
  });

  const {
    data: receivedTodos = [],
    isLoading: loadingReceived,
    error: receivedError,
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS,currentUser.id],
    queryFn: TodoService.getTodosReceived,
    enabled: !!currentUser
  });


  // Mutation per aggiornare un record
  const updateMutation = useMutation({
    mutationFn: TodoService.updateTodoStatus,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TODOS]);
      setIsModalVisible(false); // Chiudi il modale dopo l'aggiornamento
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento del record:', error);
    },
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

  const handleStatusUpdate = async (todoId, newStatus) => {
    try {
      await updateMutation.mutateAsync({ id: todoId, status: newStatus });
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
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

  const renderEmptyState = () => (
    <CAlert color="warning" className="text-center">
      Nessuna record disponibile.
    </CAlert>
  );


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
                    className="me-2"
                    onClick={() => handleStatusUpdate(todo.id, 'in_progress')}
                    title="Inizia"
                  >
                    <CIcon icon={icon.cilPencil} size="sm" />
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
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CRow className="align-items-center">
                <CCol>
                  { currentUser.id}
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
                    active={activeKey === 1}
                    onClick={() => setActiveKey(1)}
                  >
                    Ricevuti
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeKey === 2}
                    onClick={() => setActiveKey(2)}
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
      </CRow>
      {isModalVisible && (
        <NewTodoModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          senderId={currentUser.id}
        />
      )}
    </>
  );
};

export default TodoMessages;
