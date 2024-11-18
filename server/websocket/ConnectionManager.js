// server/services/ConnectionManager.js
const WebSocket = require('ws');

class ConnectionManager {
  constructor() {
    this.connectedUsers = new Map(); // userId -> Set of connection info
    this.connections = new Map(); // connectionId -> connection details
  }

  // Genera un ID univoco per la connessione
  generateConnectionId(userId, pcId) {
    return `${userId}_${pcId}_${Date.now()}`;
  }

  // Registra una nuova connessione
  registerConnection(userId, ws, connectionInfo) {
    const connectionId = this.generateConnectionId(userId, connectionInfo.pcId);

    // Salva i dettagli della connessione
    const connectionDetails = {
      userId,
      ws,
      connectionId,
      connectedAt: new Date(),
      ...connectionInfo,
      // Mantiene informazioni aggiuntive sulla connessione
      deviceInfo: {
        pcId: connectionInfo.pcId,
        pcName: connectionInfo.pcName,
        browser: connectionInfo.userAgent,
        ip: connectionInfo.ip
      }
    };

    // Aggiunge alla mappa delle connessioni
    this.connections.set(connectionId, connectionDetails);

    // Aggiunge alla mappa degli utenti connessi
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(connectionId);

    return connectionId;
  }

  // Rimuove una connessione
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const { userId } = connection;
      this.connections.delete(connectionId);

      const userConnections = this.connectedUsers.get(userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    }
  }

  // Ottiene tutte le connessioni attive di un utente
  getUserConnections(userId) {
    const connectionIds = this.connectedUsers.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(Boolean);
  }

  // Invia un messaggio a tutte le connessioni di un utente
  sendToUser(userId, message) {
    const userConnections = this.getUserConnections(userId);
    userConnections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }

  // Verifica se un utente è connesso
  isUserConnected(userId) {
    const connections = this.connectedUsers.get(userId);
    return connections ? connections.size > 0 : false;
  }

  // Ottiene statistiche sulle connessioni
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.connectedUsers.size,
      connections: Array.from(this.connections.values()).map(conn => ({
        userId: conn.userId,
        connectionId: conn.connectionId,
        connectedAt: conn.connectedAt,
        deviceInfo: conn.deviceInfo
      }))
    };
  }

  // Pulisce le connessioni zombie (opzionale)
  cleanupDeadConnections() {
    for (const [connectionId, connection] of this.connections) {
      if (connection.ws.readyState !== WebSocket.OPEN) {
        this.removeConnection(connectionId);
      }
    }
  }
}

// Esporta una singola istanza per tutta l'applicazione
module.exports = new ConnectionManager();
