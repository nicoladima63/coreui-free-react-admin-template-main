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



return
<>

<p>Centered with .justify-content-center:</p>
<CNav className="justify-content-center">
  <CNavItem>
    <CNavLink href="#" active>
      Active
    </CNavLink>
  </CNavItem>
  <CNavItem>
    <CNavLink href="#">Link</CNavLink>
  </CNavItem>
  <CNavItem>
    <CNavLink href="#">Link</CNavLink>
  </CNavItem>
  <CNavItem>
    <CNavLink href="#" disabled>
      Disabled
    </CNavLink>
  </CNavItem>
</CNav>

</>
