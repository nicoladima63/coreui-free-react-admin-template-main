import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Funzione per eseguire il logout
    const performLogout = async () => {
      try {
        // Rimuovi token e dati utente dal localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Rimuovi il token dalle intestazioni di axios
        delete axios.defaults.headers.common['Authorization'];

        // Aggiorna lo stato di Redux per disconnettere l'utente
        dispatch({ type: 'LOGOUT' });

        // Reindirizza l'utente alla schermata di login
        navigate('/login');
      } catch (error) {
        console.error('Errore durante il logout:', error);
      }
    };

    performLogout();
  }, [dispatch, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <h1>Disconnessione in corso...</h1>
    </div>
  );
};

export default Logout;
