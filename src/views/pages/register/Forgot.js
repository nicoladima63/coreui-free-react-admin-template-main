import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser } from '@coreui/icons';
import { getCurrentConfig } from '../../../config/environment';

const ForgotPassword = () => {
  const { apiBaseUrl } = getCurrentConfig();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    try {
      // Chiamata API per aggiornare la password
      await axios.put(`${apiBaseUrl}/users/update-password`, {
        email: formData.email,
        password: formData.newPassword,
      });

      setSuccessMessage('Password aggiornata con successo.');
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante l\'aggiornamento della password.');
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
            <CCard className="p-4">
              <CCardBody>
                <CForm onSubmit={handleResetPassword}>
                  <h1>Recupera Password</h1>
                  <p className="text-body-secondary">Aggiorna la tua password</p>

                  {error && <CAlert color="danger">{error}</CAlert>}
                  {successMessage && <CAlert color="success">{successMessage}</CAlert>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      autoComplete="email"
                      required
                      disabled={!!location.state?.email} // Disabilita se l'email è passata dal login
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Nuova Password"
                      autoComplete="new-password"
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Conferma Nuova Password"
                      autoComplete="new-password"
                      required
                    />
                  </CInputGroup>

                  <div className="d-grid">
                    <CButton type="submit" color="success">
                      Aggiorna Password
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Iscriviti</h2>
                    <p>
                      Non hai un account?
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Registrati
                      </CButton>
                    </Link>
                    <br /><br /><br />
                    <h2>Login</h2>
                    <p>
                      hai già un account?
                    </p>
                    <Link to="/login">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Accedi
                      </CButton>
                    </Link>
                  </div>

                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default ForgotPassword;
