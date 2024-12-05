import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom'
import { useToast } from '../../../hooks/useToast';
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked } from '@coreui/icons'
import PCSelect from 'src/components/PCSelect';
import { getCurrentConfig } from '../../../config/environment';

const Register = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    pc_id: 1
  });
  const [error, setError] = useState(null);
  const { apiBaseUrl } = getCurrentConfig();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Validazione
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      showError('Le password non coincidono');
      return;
    }

    try {
      // Registrazione
      const registerResponse = await axios.post(`${apiBaseUrl}/users/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        pc_id: formData.pc_id,
      });
      showSuccess('Registrazione riuscita con successo');
      console.log('Registration successful:', registerResponse.data);

      // Login dopo registrazione con logica robusta
      const loginResponse = await axios.post(`${apiBaseUrl}/users/login`, {
        email: formData.email,
        password: formData.password,
      });

      const { accessToken, user } = loginResponse.data;

      if (!accessToken || !user || Object.keys(user).length === 0) {
        throw new Error('Dati di autenticazione non validi dal server');
      }

      try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', accessToken);
      } catch (error) {
        console.error('Errore nel salvataggio nel localStorage:', error);
        throw new Error('Errore nel salvataggio dei dati di autenticazione');
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        user: user,
        token: accessToken,
      });

      showSuccess?.('Login effettuato con successo');
      navigate('/dashboard');
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const errorMessage = err.response?.data?.error || err.message || 'Errore durante la registrazione o il login';
      setError(errorMessage);
      console.error(errorMessage);
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody className="p-4">
                  <CForm onSubmit={handleRegister}>
                    <h1>Nuovo</h1>
                    <p className="text-body-secondary">Crea il tuo account</p>

                    {error && (
                      <CAlert color="danger" className="mb-3">
                        {error}
                      </CAlert>
                    )}

                    <CInputGroup className="mb-3">
                      <CInputGroupText>@</CInputGroupText>
                      <CFormInput
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="il tuo nome"
                        autoComplete="nome"
                        required
                      />
                    </CInputGroup>

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
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
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
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        required
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <PCSelect
                        value={formData.pc_id}
                        onSelect={(value) => setFormData(prev => ({ ...prev, pc_id: value }))}
                      />
                    </CInputGroup>

                    <div className="d-grid">
                      <CButton type="submit" color="success">
                        Crea
                      </CButton>
                    </div>
                  </CForm>
                </CCardBody>
              </CCard>

              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Login</h2>
                    <br /><br /><br />
                    <p>
                    hai già un account? <br/>Clicca qui sotto per effettuare il login
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

export default Register;
