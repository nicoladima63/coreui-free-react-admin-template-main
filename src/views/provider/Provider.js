import React, { useEffect, useState, useCallback } from 'react';
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
  CTableCaption,
  CSpinner,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import ModalNew from "./ModalProvider";
import { ProvidersService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';


const ProvidersView = () => {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Query per i fornitori
  const {
    data: providers = [],
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: [QUERY_KEYS.PROVIDERS],
    queryFn: ProvidersService.getProviders,
  });

  // Mutation per creare un nuovo work
  const createMutation = useMutation({
    mutationFn: ProvidersService.createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.PROVIDERS]);
      setIsModalVisible(false); // Chiudi il modale alla creazione
    },
    onError: (error) => {
      console.error('Errore durante la creazione della lavorazione:', error);
    },
  });

  // Mutation per aggiornare un work
  const updateMutation = useMutation({
    mutationFn: ProvidersService.updateProvider,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.PROVIDERS]);
      setIsModalVisible(false); // Chiudi il modale dopo l'aggiornamento
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento della lavorazione:', error);
    },
  });

  // Mutation per eliminazione lavorazione
  const deleteMutation = useMutation({
    mutationFn: ProvidersService.deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.PROVIDERS]);
    },
  });

  const handleDelete = async (id) => {
    const confirmed = await showConfirmDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questo record?',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
      }
    }
  };

  const handleSave = async (item) => {
    if (item.id) {
      await updateMutation.mutateAsync(item); // Modifica esistente
    } else {
      await createMutation.mutateAsync(item); // Creazione nuova
    }
    // Non è necessario ricaricare i dati manualmente, poiché invalidateQueries gestisce il refresh
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



  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Gestione Fornitori</h4>
              <CButtonGroup>
                <CButton
                  color="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(null);
                    setIsModalVisible(true);
                  }}
                >
                  <CIcon icon={icon.cilPlus} className="me-2" />
                </CButton>
                <CButton
                  color="info"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries([QUERY_KEYS.PROVIDERS])}
                >
                  <CIcon icon={icon.cilReload} />
                </CButton>
              </CButtonGroup>
            </div>
          </CCardHeader>
          <CCardBody>
            {isLoading ? (
              renderLoading()
            ) : error ? (
                renderError(error)
            ) : providers.length === 0 ? (
              renderEmptyState()
            ) : (
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Email</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Telefono</CTableHeaderCell>
                    <CTableHeaderCell className="text-end" scope="col">Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {providers.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>{item.id}</CTableDataCell>
                      <CTableDataCell>{item.name}</CTableDataCell>
                      <CTableDataCell>{item.email}</CTableDataCell>
                      <CTableDataCell>{item.phone}</CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CButtonGroup>
                          <CButton color="warning" size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsModalVisible(true);
                            }}
                          >
                            <CIcon icon={icon.cilPencil} />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <CIcon icon={icon.cilTrash} />
                          </CButton>
                        </CButtonGroup>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
      {isModalVisible && (
        <ModalNew
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSave={handleSave}
          selectedItem={selectedItem} // Passa il work selezionato per l'aggiornamento
        />
      )}
      <ConfirmDialog />
    </CRow>
  );
};

export default ProvidersView;
