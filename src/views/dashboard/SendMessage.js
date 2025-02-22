// SendMessage.js
import React, { useRef, useState } from 'react'
import { sendNotification } from '../../websocket' // Assicurati che il percorso sia corretto
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CRow,
  CCol,
  CToast,
  CToastBody,
  CToastClose,
  CToastHeader,
  CToaster,
  CFormSelect,
  CFormInput,
} from '@coreui/react'

const SendMessage = () => {
  const [selectedClient, setSelectedClient] = useState('')
  const [message, setMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const messageToast = (
    <CToast title="C'è posta per te">
      <CToastHeader closeButton>
        <svg
          className="rounded me-2"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
          role="img"
        >
          <rect width="100%" height="100%" fill="#007aff"></rect>
        </svg>
        <strong className="me-auto">CoreUI for React.js</strong>
        <small>7 min ago</small>
      </CToastHeader>
      <CToastBody>{toastMessage}</CToastBody>
    </CToast>
  )

  const ExampleToast = () => {
    const [toast, addToast] = useState(0)
    const toaster = useRef()
    const exampleToast = (
      <CToast title="CoreUI for React.js">
        <CToastHeader closeButton>
          <svg
            className="rounded me-2"
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            focusable="false"
            role="img"
          >
            <rect width="100%" height="100%" fill="#007aff"></rect>
          </svg>
          <strong className="me-auto">CoreUI for React.js</strong>
          <small>7 min ago</small>
        </CToastHeader>
        <CToastBody>Hello, world! This is a toast message.</CToastBody>
      </CToast>
    )
    return (
      <>
        <CButton color="primary" onClick={() => addToast(exampleToast)}>
          Send a toast
        </CButton>
        <CToaster ref={toaster} push={toast} placement="top-end" />
      </>
    )
  }

  const handleSendMessage = () => {
    if (selectedClient && message) {
      sendNotification(JSON.stringify({ to: selectedClient, message }))
      setToastMessage('Messaggio inviato!')
      addToast(messageToast)
      setMessage('') // Resetta il messaggio dopo l'invio
    }
  }
  const [clients, setClients] = useState([
    { id: 'client1', name: 'Client 1' },
    { id: 'client2', name: 'Client 2' },
  ])

  return (
    <div>
      <h2>Invia Messaggio</h2>
      <CFormSelect
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
        aria-label="Seleziona Client"
      >
        <option value="">Seleziona un Client</option>
        {clients.length > 0 ? (
          clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))
        ) : (
          <option>Nessun client disponibile</option>
        )}
      </CFormSelect>
      <CFormInput
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Scrivi il tuo messaggio"
      />
      <CButton onClick={handleSendMessage} color="primary">
        Invia Messaggio
      </CButton>
      {ExampleToast()}
    </div>
  )
}

export default SendMessage
