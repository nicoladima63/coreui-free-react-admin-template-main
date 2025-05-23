import React, { useState, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { websocketService } from '../../../services/websocket'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CListGroup,
  CListGroupItem,
  CBadge,
  CSpinner,
  CAlert,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import * as icon from '@coreui/icons'
import { cilBell, cilEnvelopeOpen, cilEnvelopeClosed } from '@coreui/icons'

import { UsersService, TodoService } from '../../../services/api'
import { useToast } from '../../../hooks/useToast'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'
import { QUERY_KEYS } from '../../../constants/queryKeys'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import './MessagesSection.css'

// eslint-disable-next-line react/display-name
const MessageItem = React.memo(({ message, onClick, isLoading }) => {
  const isRead = !!message.readAt || message.status === 'read'
  const [isOpen, setIsOpen] = React.useState(false)

  const handleToggle = (e) => {
    e.preventDefault()
    if (!isLoading) {
      setIsOpen((prev) => !prev) // Toglie/aggiunge il contenuto
    }
  }

  const handleClick = (e) => {
    e.preventDefault()
    if (!isLoading && onClick) {
      onClick(message)
    }
  }

  return (
    <div className="message-item">
      {/* Intestazione Accordion */}
      <div
        onClick={handleToggle}
        className={`
          message-item-header
          ${!isRead ? 'unread' : ''}
          ${message.priority === 'high' ? 'high-priority' : 'normal-priority'}
          ${isOpen ? 'open' : ''}
        `}
      >
        {/* Badge */}
        <div className="d-flex align-items-center">
          {message.priority === 'high' && (
            <CBadge color="danger" shape="rounded-pill">
              Urgente
            </CBadge>
          )}
        </div>

        {/* Titolo e Icona */}
        <div className="d-flex align-items-center flex-grow-1 ms-2">
          <div className="me-3">
            <CIcon
              icon={message.type === 'step_notification' ? icon.cilBell : icon.cilEnvelopeLetter}
              size="sm"
            />
          </div>
          <h6 className="mb-0 flex-grow-1">
            {message.type === 'step_notification' ? 'Notifica Step' : message.sender?.name}
          </h6>
          <CIcon icon={isOpen ? icon.cilChevronTop : icon.cilChevronBottom} size="sm" />
        </div>

        {/* Icona di apertura/chiusura */}
      </div>

      {/* Contenuto Accordion */}
      {isOpen && (
        <div className="message-item-content">
          <small className="message-time">{formatTimeAgo(message.createdAt)}</small>
          <p className="message-text">{message.message}</p>
          <div className="message-action" onClick={handleClick}>
            <CButton color="primary" size="sm" variant="outline">
              {isLoading ? <CSpinner size="sm" /> : 'Segna come letto'}
            </CButton>
          </div>
        </div>
      )}
    </div>
  )
})

const formatTimeAgo = (date) => {
  if (!date) return 'Data non disponibile'

  const now = new Date()
  const messageDate = new Date(date)
  const diffInSeconds = Math.floor((now - messageDate) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  // Se la data non è valida
  if (isNaN(diffInSeconds)) return 'Data non valida'

  // Meno di 1 minuto fa
  if (diffInSeconds < 60) {
    return 'Adesso'
  }

  // Meno di 1 ora fa
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min fa`
  }

  // Meno di 24 ore fa
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'ora' : 'ore'} fa`
  }

  // Meno di 7 giorni fa
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'giorno' : 'giorni'} fa`
  }

  // Più di 7 giorni fa: mostra la data completa
  return messageDate.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const MessagesSection = ({ userId, onOpenSteps }) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showConfirmDialog } = useConfirmDialog()
  const { showSuccess, showError } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [showReadMessages, setShowReadMessages] = useState(false)
  const [processingMessageId, setProcessingMessageId] = useState(null)

  useEffect(() => {
    websocketService.addHandler('error', (error) => {
      console.error('WebSocket error:', error)
      // Potenzialmente trigger di un refetch manuale
      queryClient.invalidateQueries([QUERY_KEYS.TODOS, 'received', userId])
    })

    return () => {
      websocketService.removeHandler('error')
    }
  }, [queryClient, userId])

  useEffect(() => {
    let mounted = true

    const handlers = {
      connect: () => {
        if (mounted) {
          setIsConnected(true)
          queryClient.invalidateQueries([QUERY_KEYS.TODOS, 'received', userId])
        }
      },

      disconnect: () => {
        if (mounted) setIsConnected(false)
      },

      newTodoMessage: (message) => {
        if (!mounted || message.recipientId !== userId) return

        queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], (old) => {
          const oldMessages = Array.isArray(old) ? old : []
          // Evita duplicati
          if (oldMessages.some((m) => m.id === message.id)) return oldMessages
          return [message, ...oldMessages]
        })

        if (message.priority === 'high') {
          showSuccess({
            title: 'Nuovo messaggio urgente',
            message: message.subject,
            duration: 5000,
          })
        } else {
          showSuccess({
            title: 'Nuovo messaggio',
            message: message.subject,
          })
        }
      },

      todoMessageRead: (update) => {
        if (!mounted) return
        queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], (old) => {
          if (!Array.isArray(old)) return old
          return old.map((msg) =>
            msg.id === update.messageId ? { ...msg, status: 'read', readAt: update.readAt } : msg,
          )
        })
      },
    }

    // Registra gli handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      websocketService.addHandler(event, handler)
    })

    // Connetti solo se non già connesso
    if (!isConnected) {
      try {
        websocketService.connect()
      } catch (error) {
        console.error('WebSocket connection error:', error)
      }
    }

    // Cleanup
    return () => {
      mounted = false
      Object.entries(handlers).forEach(([event, handler]) => {
        websocketService.removeHandler(event, handler)
      })
    }
  }, [userId, queryClient, showSuccess])

  // Query principale per i messaggi
  const {
    data: todos = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.TODOS, 'received', userId],
    queryFn: TodoService.getTodosReceived,
    refetchInterval: 10000,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    enabled: !!userId,
    onError: (error) => {
      showError('Errore nel caricamento dei messaggi')
    },
  })
  // Format the date in a human-readable way
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it })
    } catch (e) {
      return 'Data non valida'
    }
  }

  // Mutation per segnare come letto
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      const result = await TodoService.markAsRead(messageId)

      if (isConnected) {
        websocketService.send({
          type: 'markTodoMessageRead',
          messageId,
          readAt: new Date().toISOString(),
        })
      }

      return result
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries([QUERY_KEYS.TODOS, 'received', userId])
      const previousTodos = queryClient.getQueryData([QUERY_KEYS.TODOS, 'received', userId])

      queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], (old) => {
        if (!Array.isArray(old)) return old
        return old.map((msg) =>
          msg.id === messageId ? { ...msg, readAt: new Date().toISOString(), status: 'read' } : msg,
        )
      })

      return { previousTodos }
    },
    onError: (err, messageId, context) => {
      queryClient.setQueryData([QUERY_KEYS.TODOS, 'received', userId], context.previousTodos)
      showError('Errore nel segnare il messaggio come letto')
    },
  })

  // Handler per click sul messaggio
  const handleMessageClick = useCallback(
    async (message) => {
      if (!message?.id) return
      // Previene clic multipli sullo stesso messaggio
      const currentProcessingId = message.id
      if (processingMessageId === currentProcessingId) return

      try {
        setProcessingMessageId(currentProcessingId)

        // Prima marca come letto
        await markAsReadMutation.mutateAsync(currentProcessingId)

        // Poi gestisce la navigazione se necessario
        if (message.type === 'step_notification' && message.relatedTaskId) {
          const confirmed = await showConfirmDialog({
            title: 'Notifica step',
            message: 'Vuoi andare alla fase di lavorazione?',
            confirmText: 'Vai alla fase',
            cancelText: 'Solo segna come letto',
            confirmColor: 'primary',
          })

          if (confirmed) {
            const tasksData = queryClient.getQueryData([QUERY_KEYS.TASKS])
            const task = tasksData?.find((t) => t.id === message.relatedTaskId)
            if (task) {
              onOpenSteps(task, message.relatedStepId)
            }
          }
        }
      } catch (error) {
        showError('Errore nella gestione del messaggio')
      } finally {
        // Resetta solo se è ancora il messaggio corrente
        setProcessingMessageId((prev) => (prev === currentProcessingId ? null : prev))
      }
    },
    [
      processingMessageId,
      showConfirmDialog,
      markAsReadMutation,
      showError,
      queryClient,
      onOpenSteps,
    ],
  )

  // Computed values
  const sortedTodos = useMemo(() => {
    if (!Array.isArray(todos)) return []

    return [...todos]
      .filter((todo) => (showReadMessages ? true : !todo.readAt && todo.status !== 'read'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [todos, showReadMessages])

  const unreadCount = useMemo(() => {
    return todos.filter((message) => !message?.readAt && message?.status !== 'read').length
  }, [todos])

  return (
    <CCard className="mb-4 message-section-card">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <CIcon icon={cilBell} className="me-2 text-primary" />
          Notifiche
        </h5>
        {unreadCount > 0 && (
          <CBadge color="primary" shape="rounded-pill">
            {unreadCount}
          </CBadge>
        )}
      </CCardHeader>
      <CCardBody className="p-0">
        {isLoading ? (
          <div className="text-center p-3">
            <CSpinner color="primary" size="sm" />
          </div>
        ) : error ? (
          <CAlert color="danger" className="m-3">
            Errore nel caricamento delle notifiche
          </CAlert>
        ) : sortedTodos.length === 0 ? (
          <CAlert color="info" className="m-3">
            Nessuna notifica
          </CAlert>
        ) : (
          <div className="message-list">
            {sortedTodos.map((todo) => (
              <MessageItem
                key={todo.id}
                message={todo}
                onClick={handleMessageClick}
                isLoading={processingMessageId === todo.id}
              />
            ))}
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default MessagesSection
