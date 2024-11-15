// TasksView.js
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { QUERY_KEYS } from '../../constants/queryKeys';
import TableLayout from '../../components/TableLayout';
import { TasksService } from '../../services/api';
import ModalTask from './ModalTask';
import { CBadge, CButton, CButtonGroup, CTooltip } from '@coreui/react';

const TasksView = () => {
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
      item.work?.name?.toLowerCase().includes(searchLower) ||
      item.patient?.toLowerCase().includes(searchLower)
    ));
  }, []);

  // Query per i task
  const {
    data: tasks = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: [QUERY_KEYS.TASKS, searchTerm],
    queryFn: TasksService.getTasksForDashboard,
    select: useCallback((data) => {
      return filterData(data, searchTerm);
    }, [searchTerm, filterData])
  });

  // Mutation per aggiornare un task
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => TasksService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      showSuccess('Task aggiornato con successo');
      setIsModalVisible(false);
    },
    onError: (error) => {
      showError(error);
    }
  });

  // Mutation per eliminare un task
  const deleteMutation = useMutation({
    mutationFn: TasksService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TASKS]);
      showSuccess('Task eliminato con successo');
    },
    onError: (error) => {
      showError(error);
    }
  });

  const handleDelete = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questo task? L\'operazione non può essere annullata.',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      confirmColor: 'danger'
    });

    if (confirmed) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSave = async (taskData) => {
    try {
      await updateMutation.mutateAsync({ id: selectedItem.id, ...taskData });
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  const getCompletionBadge = (task) => {
    const completedSteps = task.steps?.filter(step => step.completed).length || 0;
    const totalSteps = task.steps?.length || 0;
    const percentage = totalSteps ? (completedSteps / totalSteps) * 100 : 0;

    let color = 'danger';
    if (percentage === 100) color = 'success';
    else if (percentage > 66) color = 'primary';
    else if (percentage > 33) color = 'warning';

    return (
      <CBadge color={color} shape="rounded-pill">
        {completedSteps}/{totalSteps} completati
      </CBadge>
    );
  };

  const columns = [
    {
      header: '#ID',
      field: 'id',
    },
    {
      header: 'Tipo Lavoro',
      field: 'work.name',
      render: (item) => (
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle me-2"
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: item.work?.category?.color
            }}
          />
          <strong>{item.work?.name}</strong>
        </div>
      )
    },
    {
      header: 'Paziente',
      field: 'patient',
    },
    {
      header: 'Data Consegna',
      field: 'deliveryDate',
      render: (item) => new Date(item.deliveryDate).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    },
    {
      header: 'Completamento',
      field: 'steps',
      render: (item) => getCompletionBadge(item)
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
        title="Gestione Task"
        isLoading={isLoading}
        error={error}
        isFetching={isFetching}
        data={tasks}
        columns={columns}
        onRefresh={() => queryClient.invalidateQueries([QUERY_KEYS.TASKS])}
        isActionDisabled={updateMutation.isLoading || deleteMutation.isLoading}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={false} // Disabilitiamo il pulsante nuovo poiché i task vengono creati dalla dashboard
      />

      <ModalTask
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSave={handleSave}
        selectedTask={selectedItem}
      />
      <ConfirmDialog />
    </>
  );
};

export default TasksView;
