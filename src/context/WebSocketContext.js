// context/WebSocketContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { websocketService } from '../services/websocket'
import { useToast } from '../hooks/useToast'
import { useNavigate } from 'react-router-dom'

const WebSocketContext = createContext(null)

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const { showError } = useToast()
  const navigate = useNavigate()

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      websocketService.connect()
    } catch (error) {
      showError('Errore di connessione al server messaggi')
    }
  }, [showError])

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true)
    };

    const handleDisconnect = () => {
      setIsConnected(false)
    };

    const handleError = (error) => {
      if (error.message === 'Authentication failed') {
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        showError('Errore di connessione: ' + error.message)
      }
    };

    // Registra handlers
    websocketService.addHandler('connect', handleConnect);
    websocketService.addHandler('disconnect', handleDisconnect)
    websocketService.addHandler('error', handleError)

    // Connessione iniziale
    if (localStorage.getItem('token')) {
        connectWebSocket()
    }

    // Cleanup
    return () => {
      websocketService.disconnect()
      websocketService.removeHandler('connect', handleConnect)
      websocketService.removeHandler('disconnect', handleDisconnect)
      websocketService.removeHandler('error', handleError)
    } 
  }, [connectWebSocket, showError, navigate])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          connectWebSocket()
        } else {
          websocketService.disconnect()
          setIsConnected(false)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [connectWebSocket])

  useEffect(() => {
    const handleStepNotification = (notification) => {
      // Mostra solo notifiche rilevanti
      showError(notification.message, {
        onClick: () => {
          navigate(`/tasks/${notification.taskId}`)
        },
      })
    }

    // Aggiungi handler per le notifiche degli step
    websocketService.addHandler('stepNotification', handleStepNotification)

    return () => {
      websocketService.removeHandler('stepNotification', handleStepNotification)
    }
  }, [showError, navigate])

  const value = {
    isConnected,
    connect: connectWebSocket,
    disconnect: () => websocketService.disconnect(),
    websocketService: websocketService 
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
