import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody
} from '@coreui/react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password,
      });
      // Salva il token JWT nel localStorage
      localStorage.setItem('token', response.data.accessToken);
      navigate('/dashboard'); // Reindirizza alla dashboard
    } catch (err) {
      setError('Credenziali errate. Riprova.');
    }
  };

  return (
    <CContainer>
      <CRow className="justify-content-center">
        <CCol md={6}>
          <CCard>
            <CCardBody>
              <h2>Login</h2>
              <CForm onSubmit={handleLogin}>
                <CFormLabel htmlFor="email">Email</CFormLabel>
                <CFormInput
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <CFormLabel htmlFor="password">Password</CFormLabel>
                <CFormInput
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <CButton type="submit" color="primary">
                  Accedi
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default LoginPage;
