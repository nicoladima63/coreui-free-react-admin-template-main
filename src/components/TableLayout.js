import React from 'react';
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
  CTableDataCell ,
  CTableRow,
  CSpinner,
  CAlert,
  CTooltip,
  CInputGroup,
  CFormInput,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

/**
 * TableLayout - Componente riutilizzabile per layout tabelle
 * 
 * @param {Object} props
 * @param {string} props.title - Titolo della tabella
 * @param {boolean} props.isLoading - Stato di caricamento
 * @param {Object} props.error - Oggetto errore se presente
 * @param {boolean} props.isFetching - Stato di aggiornamento dati
 * @param {Array} props.data - Dati da visualizzare
 * @param {Array} props.columns - Definizione delle colonne
 * @param {Function} props.onNew - Handler per nuovo record
 * @param {Function} props.onRefresh - Handler per aggiornamento dati
 * @param {string} props.searchTerm - Termine di ricerca
 * @param {Function} props.onSearchChange - Handler per cambio ricerca
 * @param {boolean} props.showSearch - Mostra/nascondi barra di ricerca
 * @param {React.ReactNode} props.additionalControls - Controlli aggiuntivi per l'header
 * @param {boolean} props.isActionDisabled - Disabilita i controlli durante le operazioni
 */
const TableLayout = ({
  title,
  isLoading,
  error,
  isFetching,
  data = [],
  columns = [],
  onNew,
  onRefresh,
  searchTerm,
  onSearchChange,
  showSearch = false,
  additionalControls,
  isActionDisabled = false
}) => {
  const renderError = () => (
    <CAlert color="danger" className="text-center">
      {error?.message || 'Si è verificato un errore durante il recupero dei dati'}
    </CAlert>
  );

  const renderLoading = () => (
    <div className="text-center p-3">
      <CSpinner color="primary" />
    </div>
  );

  const renderEmptyState = () => (
    <CAlert color="info" className="text-center">
      Nessun record disponibile
    </CAlert>
  );

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">{title}</h4>

              <div className="d-flex gap-2">
                {showSearch && (
                  <CInputGroup size="sm" className="w-auto">
                    <CFormInput
                      placeholder="Cerca..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      disabled={isActionDisabled}
                    />
                    {searchTerm && (
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={() => onSearchChange?.('')}
                        disabled={isActionDisabled}
                      >
                        <CIcon icon={icon.cilX} />
                      </CButton>
                    )}
                  </CInputGroup>
                )}

                {additionalControls}

                <CButtonGroup size="sm">
                  {onNew && (
                    <CTooltip content="Nuovo">
                      <CButton
                        color="primary"
                        onClick={onNew}
                        disabled={isActionDisabled}
                      >
                        <CIcon icon={icon.cilPlus} className="me-2" />
                        Nuovo
                      </CButton>
                    </CTooltip>
                  )}

                  {onRefresh && (
                    <CTooltip content="Aggiorna">
                      <CButton
                        color="info"
                        onClick={onRefresh}
                        disabled={isActionDisabled || isFetching}
                      >
                        <CIcon
                          icon={isFetching ? icon.cilSync : icon.cilReload}
                          className={isFetching ? 'spinner' : ''}
                        />
                      </CButton>
                    </CTooltip>
                  )}
                </CButtonGroup>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {isLoading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : data.length === 0 ? (
              renderEmptyState()
            ) : (
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    {columns.map((column, index) => (
                      <CTableHeaderCell
                        key={index}
                        className={column.headerClassName}
                        style={column.headerStyle}
                        scope="col"
                      >
                        {column.header}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {data.map((item, rowIndex) => (
                    <CTableRow key={item.id || rowIndex}>
                      {columns.map((column, colIndex) => (
                        <CTableDataCell
                          key={colIndex}
                          className={column.className}
                          style={column.style}
                        >
                          {column.render ? column.render(item) : item[column.field]}
                        </CTableDataCell>
                      ))}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default TableLayout;
