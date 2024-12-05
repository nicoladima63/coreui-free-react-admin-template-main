import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../../../context/WebSocketContext';
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
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser } from '@coreui/icons';
import { getCurrentConfig } from '../../../config/environment';
// Ottieni la configurazione corrente
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { connect } = useWebSocket();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Get auth state from Redux store
  const auth = useSelector(state => state.auth);
  const { apiBaseUrl } = getCurrentConfig();

  useEffect(() => {
    // Verifica che l'utente sia effettivamente autenticato con dati validi
    if (auth.isAuthenticated && auth.user && Object.keys(auth.user).length > 0) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(`${apiBaseUrl}/users/login`, {
        email,
        password,
      });

      const { accessToken, user } = response.data;

      // Verifica più stringente dei dati ricevuti
      if (!accessToken || !user || Object.keys(user).length === 0) {
        throw new Error('Dati di autenticazione non validi dal server');
      }

      // Prima salviamo nel localStorage
      try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', accessToken);
      } catch (error) {
        console.error('Errore nel salvataggio nel localStorage:', error);
        throw new Error('Errore nel salvataggio dei dati di autenticazione');
      }

      // Configure axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Dispatch login action to Redux store
      dispatch({
        type: 'LOGIN_SUCCESS',
        user: user,
        token: accessToken
      });

      // Connect WebSocket
      try {
        await connect();
        showSuccess?.('Login effettuato con successo');
        navigate('/dashboard');
      } catch (wsError) {
        console.error('WebSocket connection error:', wsError);
      }

    } catch (err) {
      // Pulizia in caso di errore
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const errorMessage = err.response?.data?.error || err.message || 'Errore durante il login';
      setError(errorMessage);
      showError?.(errorMessage);

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
                      {error && (
                        <CCol xs={12}>
                          <div className="text-danger text-center mb-3">{error}</div>
                        </CCol>
                      )}
                      <CCol xs={12} className="text-center">
                        <CButton size="sm" color="primary" className="px-6" type="submit">
                          Accedi
                        </CButton>
                      </CCol>

                      <CCol xs={12} className="text-center mt-3">
                        <CButton
                          color="link"
                          className="px-6"
                          onClick={() => navigate('/forgot', { state: { email } })}
                        >
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
                    <h2>Iscriviti</h2>
                    <br /><br /><br />
                    <p>
                      Non hai un account?<br/> clicca qui sotto per eseguire una nuova registrazione
                    </p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Registrazione
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

export default Login;
