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
      };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._notifyHandlers(data.type, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.log('3c. Errore durante la creazione della connessione:', error);
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting reconnection ${this.reconnectAttempts}...`);
        this.connect();
      }, 3000); // Riprova ogni 3 secondi
    }
  }

  sendMessage(to, content) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'chat',
      to,
      content
    }));
  }

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
