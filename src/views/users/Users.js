import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CButtonGroup,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
  CSpinner,
  CAlert,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import ModalUser from './ModalUser';
import { UsersService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';
import TableLayout from '../../components/TableLayout';

const UsersView = () => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filterData = useCallback((data, term) => {
    if (!term.trim()) return data;

    const searchLower = term.toLowerCase();
    return data.filter(item => (
      item.name?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower)
    ));
  }, []);
  // Query per utenti
  const {
    data: users = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: [QUERY_KEYS.USERS, searchTerm],
    queryFn: () => UsersService.getUsers(searchTerm), // Assumendo che l'API supporti la ricerca
    select: useCallback((data) => {
      // Se l'API non supporta la ricerca, filtriamo i risultati lato client
      return filterData(data, searchTerm);
    }, [searchTerm, filterData])
  });

  // Mutation per creare un nuovo utente
  const createMutation = useMutation({
    mutationFn: UsersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.USERS]);
      showSuccess('Utente creato con successo');
      setIsModalVisible(false);
    },
    onError: (error) => {
      showError(error);
    }
  });

  // Mutation per aggiornare un utente
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => UsersService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.USERS]);
      showSuccess('Utente aggiornato con successo');
      setIsModalVisible(false);
    },
    onError: (error) => {
      showError(error);
    }
  });

  // Mutation per eliminare un utente
  const deleteMutation = useMutation({
    mutationFn: UsersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.USERS]);
      showSuccess('Utente eliminato con successo');
    },
    onError: (error) => {
      showError(error);
    }
  });

  const handleDelete = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questo utente? L\'operazione non può essere annullata.',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      confirmColor: 'danger'
    });

    if (confirmed) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSave = async (userData) => {
    try {
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, ...userData });
      } else {
        await createMutation.mutateAsync(userData);
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      throw error; // Rilanciamo l'errore per gestirlo nel componente modale
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  const columns = [
    {
      header: '#ID',
      field: 'id',
    },
    {
      header: 'Nome',
      field: 'name',
      render: (item) => <strong>{item.name}</strong>
    },
    {
      header: 'Email',
      field: 'email',
    },
    {
      header: 'Postazione',
      field: 'pc_id',
      render: (item) => item.pc?.name || '-'
    },
    {
      header: 'Azioni',
      headerClassName: 'text-end',
      className: 'text-end',
      render: (item) => (
        <CButtonGroup>
          <CTooltip content="Modifica">
            <CButton
              color="warning"
              size="sm"
              onClick={() => {
                setSelectedItem(item);
                setIsModalVisible(true);
              }}
              disabled={updateMutation.isLoading}
            >
              <CIcon icon={icon.cilPencil} />
            </CButton>
          </CTooltip>
          <CTooltip content="Elimina">
            <CButton
              color="danger"
              size="sm"
              onClick={() => handleDelete(item.id)}
              disabled={deleteMutation.isLoading}
            >
              <CIcon icon={icon.cilTrash} />
            </CButton>
          </CTooltip>
        </CButtonGroup>
      )
    }
  ];

  return (
    <>
      <TableLayout
        title="Gestione Utenti"
        isLoading={isLoading}
        error={error}
        isFetching={isFetching}
        data={users}
        columns={columns}
        onNew={() => {
          setSelectedItem(null);
          setIsModalVisible(true);
        }}
        onRefresh={() => queryClient.invalidateQueries([QUERY_KEYS.USERS])}
        isActionDisabled={createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <ModalUser
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSave={handleSave}
        selectedUser={selectedItem}
      />
      <ConfirmDialog />
    </>
  );

};

export default UsersView;
