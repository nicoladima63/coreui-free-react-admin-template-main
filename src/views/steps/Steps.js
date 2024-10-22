import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableCaption,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { DocsExample } from 'src/components'

const Steps = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Steps Table</strong> 
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Elenco delle fasi inserite nel database.
            </p>
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#ID</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Nome</CTableHeaderCell>
                    <CTableHeaderCell scope="col">descrizione</CTableHeaderCell>
                    <CTableHeaderCell scope="col">stato</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableHeaderCell scope="row">1</CTableHeaderCell>
                    <CTableDataCell>fase 1</CTableDataCell>
                    <CTableDataCell>la fa qualcuno</CTableDataCell>
                    <CTableDataCell>inserita</CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableHeaderCell scope="row">2</CTableHeaderCell>
                    <CTableDataCell>Cristina</CTableDataCell>
                    <CTableDataCell>Baldi</CTableDataCell>
                    <CTableDataCell>Segretaria</CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableHeaderCell scope="row">3</CTableHeaderCell>
                  <CTableDataCell>Cristina</CTableDataCell>
                  <CTableDataCell>Ponzecchi</CTableDataCell>
                  <CTableDataCell>Assistente</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
};
export default Steps;
