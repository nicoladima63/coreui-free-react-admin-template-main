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
  CBadge,CFormInput,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import ModalNew from "./ModalCategory";
import { CategoriesService } from '../../services/api';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { API_ERROR_MESSAGES } from '../../constants/errorMessages';

const CategoriesView = () => {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Query per categorie
  const {
    data: categories = [],
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: CategoriesService.getCategories,
  });

  // Mutation per creare un nuovo record
  const createMutation = useMutation({
    mutationFn: CategoriesService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
      setIsModalVisible(false); // Chiudi il modale alla creazione
    },
    onError: (error) => {
      console.error('Errore durante la creazione della lavorazione:', error);
    },
  });

  // Mutation per aggiornare un record
  const updateMutation = useMutation({
    mutationFn: CategoriesService.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
      setIsModalVisible(false); // Chiudi il modale dopo l'aggiornamento
    },
    onError: (error) => {
      console.error('Errore durante l\'aggiornamento della lavorazione:', error);
    },
  });

  // Mutation per eliminazione lavorazione
  const deleteMutation = useMutation({
    mutationFn: CategoriesService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES]);
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
              <h4 className="mb-0">Gestione Categorie</h4>
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
                  onClick={() => queryClient.invalidateQueries([QUERY_KEYS.CATEGORIES])}
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
            ) : categories.length === 0 ? (
              renderEmptyState()
            ) : (
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Colore</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Azioni</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {categories.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>{item.id}</CTableDataCell>
                      <CTableDataCell>{item.name}</CTableDataCell>
                      <CTableDataCell>
          <CFormInput
            type="color"
            value={item.color}
            className="mt-3"
            disabled
          />
                      </CTableDataCell>
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

export default CategoriesView;
