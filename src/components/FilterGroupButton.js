import React from 'react'
import { CButtonGroup, CButton } from '@coreui/react'

const FilterGroupButton = ({ selectedFilter, onFilterChange, onReload }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
      <CButtonGroup>
        <CButton
          size="sm"
          color={selectedFilter === 'all' ? 'primary' : 'secondary'}
          onClick={() => onFilterChange('all')}
        >
          Tutti
        </CButton>

        <CButton
          size="sm"
          color={selectedFilter === 'completed' ? 'primary' : 'secondary'}
          onClick={() => onFilterChange('completed')}
        >
          Completati
        </CButton>

        <CButton
          size="sm"
          color={selectedFilter ==='incomplete' ? 'primary' : 'secondary'}
          onClick={() => onFilterChange('incomplete')}
        >
          Da Completare
        </CButton>

        <CButton
          size="sm"
          color="info"
          onClick={onReload} // Chiama la funzione onReload passata dal genitore
        >
          Reload
        </CButton>
      </CButtonGroup>
    </div>
  )
}

export default FilterGroupButton
