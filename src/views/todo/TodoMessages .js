import React, { useState } from 'react';
import { useTodoMessages } from '../../hooks/useTodoMessages';
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
  CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilCheck, cilX } from '@coreui/icons';
import  NewTodoModal  from './TodoModal';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const TodoMessages = () => {
  const [activeKey, setActiveKey] = useState(1);
  const [showNewTodoModal, setShowNewTodoModal] = useState(false);
  const { useReceivedTodos, useSentTodos, useUpdateTodoStatus } = useTodoMessages();

  const currentUser = useSelector(state => state.auth.user);
  const { data: receivedTodos, isLoading: loadingReceived } = useReceivedTodos();
  const { data: sentTodos, isLoading: loadingSent } = useSentTodos();
  const updateTodoStatus = useUpdateTodoStatus();

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
      await updateTodoStatus.mutateAsync({ id: todoId, status: newStatus });
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

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
                    <CIcon icon={cilPencil} size="sm" />
                  </CButton>
                  <CButton
                    color="success"
                    size="sm"
                    onClick={() => handleStatusUpdate(todo.id, 'completed')}
                    title="Completa"
                  >
                    <CIcon icon={cilCheck} size="sm" />
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
                  <strong>Todo Messages</strong>
                </CCol>
                <CCol xs="auto">
                  <CButton
                    color="primary"
                    onClick={() => setShowNewTodoModal(true)}
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
                    <div>Caricamento...</div>
                  ) : (
                    renderTodoTable(receivedTodos)
                  )
                ) : (
                  loadingSent ? (
                    <div>Caricamento...</div>
                  ) : (
                    renderTodoTable(sentTodos)
                  )
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <NewTodoModal
        visible={showNewTodoModal}
        onClose={() => setShowNewTodoModal(false)}
      />
    </>
  );
};

export default TodoMessages;
