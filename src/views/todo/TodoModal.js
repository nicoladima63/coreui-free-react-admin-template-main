import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CFormLabel,
} from '@coreui/react'
import { TodoService, UsersService } from '../../services/api'

import { useToast } from '../../hooks/useToast'
import { QUERY_KEYS } from '../../constants/queryKeys'
import { API_ERROR_MESSAGES } from '../../constants/errorMessages'

const NewTodoModal = ({ visible, onClose, senderId }) => {
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    senderId: senderId,
    recipientId: '',
    subject: '',
    message: '',
    priority: 'medium',
    dueDate: '',
  })

  const { showSuccess, showError } = useToast()

  const {
    data: users = [],
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: UsersService.getUsers,
  })

  // Mutation per creare un nuovo record
  const createMutation = useMutation({
    mutationFn: TodoService.createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.TODOS])
      onClose()
    },
    onError: (error) => {
      console.error('Errore durante la creazione del record:', error)
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync(formData)
      showSuccess('Messaggio inviato con successo')
      onClose()
      setFormData({
        senderId: '',
        recipientId: '',
        subject: '',
        message: '',
        priority: 'medium',
        dueDate: '',
      })
    } catch (error) {
      showError(error.message || "Errore durante l'invio del messaggio")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <CModal visible={visible} onClose={onClose}>
      <CForm onSubmit={handleSubmit}>
        <CModalHeader>
          <CModalTitle>Nuovo Messaggio</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Destinatario</CFormLabel>
            <CFormSelect
              name="recipientId"
              value={formData.recipientId}
              onChange={handleChange}
              required
            >
              <option value="">Seleziona destinatario...</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel>Oggetto</CFormLabel>
            <CFormInput
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Messaggio</CFormLabel>
            <CFormTextarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Priorità</CFormLabel>
            <CFormSelect name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Bassa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel>Data di scadenza (opzionale)</CFormLabel>
            <CFormInput
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            Annulla
          </CButton>
          <CButton color="primary" type="submit">
            Invia
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default NewTodoModal
