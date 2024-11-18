// websocket/WebSocketManager.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { connectionManager } = require('./ConnectionManager');

class WebSocketManager {
  constructor() {
    this.clients = new Map();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      // Aggiungi questo per vedere i dettagli della richiesta
      verifyClient: (info, cb) => {
        cb(true);
      }
    });
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  async handleConnection(ws, req) {
    try {
      const token = new URLSearchParams(req.url.slice(1)).get('token');
      if (!token) {
        ws.close(4001, 'Token non fornito');
        return;
      }

      // Decodifica il token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Raccoglie informazioni sulla connessione
      const connectionInfo = {
        pcId: decoded.pc_id,
        pcName: req.headers['x-pc-name'] || 'Unknown PC',
        userAgent: req.headers['user-agent'],
        ip: req.socket.remoteAddress
      };

      // Registra la connessione
      const connectionId = connectionManager.registerConnection(
        decoded.id,
        ws,
        connectionInfo
      );

      // Aggiorna stato utente
      await db.User.update(
        { online: true },
        { where: { id: decoded.id } }
      );

      // Associa l'ID connessione al WebSocket
      ws.connectionId = connectionId;

      // Notifica altri utenti
      this.broadcastUserStatus(decoded.id, true);

      // Gestione messaggi e disconnessione
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Formato messaggio non valido'
          }));
        }
      });

      ws.on('close', async () => {
        connectionManager.removeConnection(ws.connectionId);
        await this.handleDisconnection(decoded.id);
      });

      // Invia conferma connessione con dettagli dispositivo
      ws.send(JSON.stringify({
        type: 'connected',
        userId: decoded.id,
        deviceInfo: connectionInfo
      }));

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4002, 'Autenticazione fallita');
    }
  }
  async zhandleConnection(ws, req) {

    try {
      // Estrai il token dall'URL della richiesta WebSocket
      const token = new URLSearchParams(req.url.slice(1)).get('token');

      if (!token) {
        ws.close(4001, 'Token non fornito');
        return;
      }

      // Verifica il token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      ws.userId = decoded.id;
      ws.pcId = decoded.pc_id; // Aggiungi il pc_id se lo usi

      // Aggiorna stato utente
      await db.User.update(
        { online: true },
        { where: { id: ws.userId } }
      );

      // Salva la connessione
      this.clients.set(ws.userId, ws);

      // Notifica altri utenti
      this.broadcastUserStatus(ws.userId, true);

      // Gestione messaggi in arrivo
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Formato messaggio non valido'
          }));
        }
      });

      // Gestione disconnessione
      ws.on('close', async () => {
        await this.handleDisconnection(ws.userId);
      });

      // Invia conferma connessione
      ws.send(JSON.stringify({
        type: 'connected',
        userId: ws.userId
      }));

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4002, 'Autenticazione fallita');
    }
  }

  async handleMessage(ws, message) {
    try {
      switch (message.type) {
        case 'chat':
          await this.handleChatMessage(ws, message);
          break;
        case 'read':
          await this.handleReadReceipt(ws, message);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Tipo messaggio sconosciuto'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Errore nell\'elaborazione del messaggio'
      }));
    }
  }

  async handleChatMessage(ws, message) {
    // Salva il messaggio
    const newMessage = await db.Message.create({
      fromId: ws.userId,
      toId: message.to,
      content: message.content
    });

    // Recupera info mittente
    const sender = await db.User.findByPk(ws.userId, {
      attributes: ['id', 'name', 'pc_id']
    });

    const recipient = await db.User.findByPk(message.to, {
      attributes: ['id', 'pc_id']
    });

    const messageToSend = {
      type: 'chat',
      id: newMessage.id,
      from: {
        id: sender.id,
        name: sender.name,
        pc_id: sender.pc_id
      },
      content: message.content,
      timestamp: newMessage.createdAt
    };

    // Invia al destinatario se online
    const recipientWs = this.clients.get(message.to);
    if (recipientWs) {
      recipientWs.send(JSON.stringify(messageToSend));
    }

    // Conferma al mittente
    ws.send(JSON.stringify({
      type: 'sent',
      messageId: newMessage.id,
      timestamp: newMessage.createdAt
    }));
  }

  async handleDisconnection(userId) {
    // Aggiorna stato utente
    await db.User.update(
      {
        online: false,
        lastSeen: new Date()
      },
      { where: { id: userId } }
    );

    // Rimuovi dalla mappa
    this.clients.delete(userId);

    // Notifica altri utenti
    this.broadcastUserStatus(userId, false);

    console.log(`User ${userId} disconnected`);
  }

  async handleStepCompletion(completedStep, taskid) {
    try {
      const steps = await db.Step.findAll({
        where: { taskid },
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'pc_id']
          },
          {
            model: db.Task,
            as: 'task',
            attributes: ['id', 'patient']
          }
        ],
        order: [['order', 'ASC']]
      });

      const currentStepIndex = steps.findIndex(step => step.id === completedStep.id);
      const nextStep = steps[currentStepIndex + 1];

      if (nextStep && nextStep.user.id !== completedStep.userid) {
        // Crea un TodoMessage
        const todoMessage = await db.TodoMessage.create({
          senderId: completedStep.userid,
          recipientId: nextStep.user.id,
          type: 'step_notification',
          subject: `Nuova fase da completare: ${nextStep.name}`,
          message: `La fase "${completedStep.name}" è stata completata per il paziente ${completedStep.task.patient}. La fase "${nextStep.name}" è pronta per essere lavorata.`,
          priority: 'high',
          status: 'pending',
          relatedTaskId: taskId,
          relatedStepId: nextStep.id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Scadenza a 24 ore
        });

        // Invia notifica WebSocket
        const notification = {
          type: 'stepNotification',
          todoMessageId: todoMessage.id,
          title: todoMessage.subject,
          message: todoMessage.message,
          priority: todoMessage.priority,
          taskId,
          stepId: nextStep.id,
          timestamp: new Date()
        };

        this.sendNotification(nextStep.user.id, notification);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Errore durante la gestione del completamento dello step:', error);
      return false;
    }
  }

  broadcastUserStatus(userId, online) {
    const message = JSON.stringify({
      type: 'userStatus',
      userId,
      online,
      timestamp: new Date()
    });

    this.clients.forEach((client, clientId) => {
      if (clientId !== userId && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  // Metodo per inviare notifiche a un utente specifico
  sendNotification(userId, notification) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        ...notification
      }));
    }
  }
}

module.exports = new WebSocketManager();
