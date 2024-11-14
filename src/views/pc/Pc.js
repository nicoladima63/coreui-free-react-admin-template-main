// PCsView.js
import React, { useState,useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CBadge,
  CButtonGroup,
  CButton,
  CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

import TableLayout from '../../components/TableLayout';
import ModalPC from './ModalPc';
import { PCService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';

const PCsView = () => {
  const queryClient = useQueryClient();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Query per i PC con filtro di ricerca
  const {
    data: pcs = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: [QUERY_KEYS.PCS, searchTerm],
    queryFn: PCService.getPCs,
    select: useCallback((data) => {
      if (!searchTerm) return data;
      const searchLower = searchTerm.toLowerCase();
      return data.filter(pc =>
        pc.name?.toLowerCase().includes(searchLower) ||
        pc.location?.toLowerCase().includes(searchLower) ||
        pc.ipAddress?.toLowerCase().includes(searchLower)
      );
    }, [searchTerm])
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: PCService.createPc,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.PCS]);
      showSuccess('Postazione creata con successo');
      setIsModalVisible(false);
    },
    onError: (error) => {
      showError(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => PCService.updatePc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.PCS]);
      showSuccess('Postazione aggiornata con successo');
      setIsModalVisible(false);
    },
    onError: (error) => {
      showError(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: PCService.deletePc,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.PCS]);
      showSuccess('Postazione eliminata con successo');
    },
    onError: (error) => {
      showError(error);
    }
  });

  const handleDelete = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questa postazione? L\'operazione non può essere annullata.',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      confirmColor: 'danger'
    });

    if (confirmed) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSave = async (pcData) => {
    try {
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, ...pcData });
      } else {
        await createMutation.mutateAsync(pcData);
      }
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      throw error;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  // Definizione delle colonne
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
      header: 'Ubicazione',
      field: 'location',
    },
    {
      header: 'IP',
      field: 'ipAddress',
    },
    {
      header: 'Stato',
      field: 'status',
      render: (item) => (
        <CBadge color={item.status ? 'success' : 'danger'}>
          {item.status ? 'Attivo' : 'Inattivo'}
        </CBadge>
      )
    },
    {
      header: 'Ultimo Online',
      field: 'lastOnline',
      render: (item) => formatDate(item.lastOnline)
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
        title="Gestione Postazioni"
        isLoading={isLoading}
        error={error}
        isFetching={isFetching}
        data={pcs}
        columns={columns}
        onNew={() => {
          setSelectedItem(null);
          setIsModalVisible(true);
        }}
        onRefresh={() => queryClient.invalidateQueries([QUERY_KEYS.PCS])}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isActionDisabled={createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading}
      />

      <ModalPC
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedItem(null);
        }}
        onSave={handleSave}
        selectedPC={selectedItem}
      />

      <ConfirmDialog />
    </>
  );
};

export default PCsView;
