// components/messaging/ChatInput.js
import React, { useState } from 'react';
import { CFormInput, CButton, CInputGroup } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPaperPlane } from '@coreui/icons';

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CInputGroup>
        <CFormInput
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi un messaggio..."
          disabled={disabled}
        />
        <CButton
          type="submit"
          color="primary"
          disabled={!message.trim() || disabled}
        >
          <CIcon icon={cilPaperPlane} />
        </CButton>
      </CInputGroup>
    </form>
  );
};
