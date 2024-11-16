// services/websocket.js
class WebSocketService {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No token found');
    }

    try {
      this.ws = new WebSocket(`ws://localhost:5000?token=${token}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._notifyHandlers('connect');
      };

      this.ws.onerror = (error) => {
        this._notifyHandlers('error', error);
      };

      this.ws.onclose = (event) => {
        this._notifyHandlers('disconnect');
        this._attemptReconnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Gestione specifica per i TodoMessages
          if (data.type === 'newTodoMessage') {
            this._notifyHandlers('newTodoMessage', data.message);
          } else if (data.type === 'todoMessageRead') {
            this._notifyHandlers('todoMessageRead', {
              messageId: data.messageId,
              readAt: data.readAt
            });
          } else {
            // Gestione generale per altri tipi di messaggi
            this._notifyHandlers(data.type, data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this._attemptReconnect();
    }
  }

  // Il metodo esistente per i tentativi di riconnessione rimane invariato
  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting reconnection ${this.reconnectAttempts}...`);
        this.connect();
      }, 3000);
    }
  }

  // Metodo generico per l'invio di messaggi
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  // Il metodo specifico per i messaggi chat rimane per retrocompatibilità
  sendMessage(to, content) {
    this.send({
      type: 'chat',
      to,
      content
    });
  }

  // Nuovo metodo per segnare un messaggio come letto
  markTodoMessageAsRead(messageId) {
    this.send({
      type: 'markTodoMessageRead',
      messageId
    });
  }

  // Nuovo metodo per inviare un TodoMessage
  sendTodoMessage(recipientId, subject, content, options = {}) {
    this.send({
      type: 'todoMessage',
      recipientId,
      subject,
      content,
      priority: options.priority || 'normal',
      messageType: options.messageType || 'general',
      taskId: options.taskId,
      stepId: options.stepId,
      dueDate: options.dueDate
    });
  }

  // I metodi per la gestione degli handler rimangono invariati
  addHandler(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
  }

  removeHandler(event, handler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(handler);
    }
  }

  _notifyHandlers(event, data) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).forEach(handler => handler(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const websocketService = new WebSocketService();
