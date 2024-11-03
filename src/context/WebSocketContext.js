// context/WebSocketContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { websocketService } from '../services/websocket';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      //console.log('No token, skipping WebSocket connection');
      return;
    }

    try {
      websocketService.connect();
    } catch (error) {
      showError('Errore di connessione al server messaggi');
    }
  }, [showError]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      showSuccess('Connesso al server messaggi');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      showError('Disconnesso dal server messaggi');
    };

    const handleError = (error) => {
      showError('Errore di connessione: ' + error.message);
      if (error.message === 'Authentication failed') {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    // Registra handlers
    websocketService.addHandler('connect', handleConnect);
    websocketService.addHandler('disconnect', handleDisconnect);
    websocketService.addHandler('error', handleError);

    // Tenta la connessione solo se c'è un token
    if (localStorage.getItem('token')) {
      connectWebSocket();
    }

    // Cleanup
    return () => {
      websocketService.disconnect();
      websocketService.removeHandler('connect', handleConnect);
      websocketService.removeHandler('disconnect', handleDisconnect);
      websocketService.removeHandler('error', handleError);
    };
  }, [connectWebSocket, showSuccess, showError, navigate]);

  // Riconnetti quando il token cambia
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          connectWebSocket();
        } else {
          websocketService.disconnect();
          setIsConnected(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [connectWebSocket]);

  const value = {
    isConnected,
    connect: connectWebSocket,
    disconnect: () => websocketService.disconnect()
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
