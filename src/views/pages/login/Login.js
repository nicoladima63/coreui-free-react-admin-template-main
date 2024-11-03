import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../../../context/WebSocketContext'; // Aggiungi questo import
import { useToast } from '../../../hooks/useToast'; // Aggiungi questo se lo stai usando
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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser } from '@coreui/icons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { connect } = useWebSocket(); // Aggiungi questo
  const { showSuccess, showError } = useToast(); // Se stai usando useToast

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password,
      });

      // Salva il token JWT nel localStorage
      localStorage.setItem('token', response.data.accessToken);

      // Aggiungi questi:
      // Configura axios per le future richieste
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

      // Connetti WebSocket
      try {
        await connect();
        showSuccess?.('Login effettuato con successo');
      } catch (wsError) {
        console.error('WebSocket connection error:', wsError);
        // Non bloccare il login se il WebSocket fallisce
      }

      // Reindirizza alla dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMessage = err.response.data.error || 'Errore durante il login';
        setError(errorMessage);
        showError?.(errorMessage);
      } else {
        const errorMessage = 'Errore di rete. Riprova.';
        setError(errorMessage);
        showError?.(errorMessage);
      }
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
                  <CForm onSubmit={handleLogin}>
                    <h1>Accesso</h1>
                    <p className="text-body-secondary">Accedi con il tuo account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>@</CInputGroupText>
                      <CFormInput
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                    </CInputGroup>
                    <CRow>
                      {error && <p style={{ color: 'red' }}>{error}</p>}

                      <CCol xs={12} className="text-center">
                        <CButton size="sm" color="primary" className="px-6" type="submit">
                          Accedi
                        </CButton>
                      </CCol>
                      <CRow>
                    </CRow>
                      <CCol xs={12} className="text-center">
                        <CButton color="link" className="px-6">
                          Password dimenticata?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                      tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
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
  )
}

export default Login
