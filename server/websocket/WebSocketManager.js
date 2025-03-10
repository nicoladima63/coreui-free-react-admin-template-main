// server/websocket/WebSocketManager.js
const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const db = require('../models')
const connectionManager = require('./ConnectionManager')
const pushNotificationController = require('../controllers/pushNotificationController')
class WebSocketManager {
  constructor() {
    this.wss = null
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      verifyClient: (info, cb) => {
        try {
          // Extract token from URL
          const token = new URLSearchParams(info.req.url.slice(1)).get('token')
          if (!token) {
            return cb(false, 4001, 'Token non fornito')
          }
          
          // Verify token
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
          return cb(true)
        } catch (error) {
          console.error('WebSocket verification error:', error)
          return cb(false, 4002, 'Autenticazione fallita')
        }
      },
    })

    this.wss.on('connection', this.handleConnection.bind(this))

    // Opzionale: setup pulizia periodica delle connessioni morte
    setInterval(() => {
      connectionManager.cleanupDeadConnections()
    }, 30000) // ogni 30 secondi
  }

  sendNotification(userId, notification) {
    const connections = connectionManager.getUserConnections(userId)
    if (connections.length > 0) {
      const message = JSON.stringify({
        type: 'notification',
        ...notification,
      })

      connections.forEach((conn) => {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(message)
        }
      })

      return true
    }
    return false
  }

  async handleTodoMessage(fromUserId, message) {
    try {
      // Salva il messaggio nel DB
      const newTodo = await db.TodoMessage.create({
        senderId: fromUserId,
        recipientId: message.recipientId,
        subject: message.subject,
        message: message.message,
        priority: message.priority,
        dueDate: message.dueDate,
        status: 'pending',
      })

      // Recupera info complete
      const todoWithRelations = await db.TodoMessage.findByPk(newTodo.id, {
        include: [
          { model: db.User, as: 'sender', attributes: ['id', 'name'] },
          { model: db.User, as: 'recipient', attributes: ['id', 'name'] },
        ],
      })

      // Invia al destinatario usando connectionManager invece di this.clients
      const messageToRecipient = {
        type: 'newTodoMessage',
        message: todoWithRelations,
      }
      connectionManager.sendToUser(message.recipientId, messageToRecipient)

      // Conferma al mittente usando connectionManager invece di this.clients
      const messageToSender = {
        type: 'messageSent',
        messageId: newTodo.id,
        timestamp: newTodo.createdAt,
      }
      connectionManager.sendToUser(fromUserId, messageToSender)

      await pushNotificationController.sendNotification(message.recipientId, {
        title: `Nuovo messaggio da ${todoWithRelations.sender.name}`,
        body: message.message,
        icon: '/path/to/icon.png',
        data: {
          messageId: newTodo.id,
          type: 'todoMessage',
          url: `/dashboard?message=${newTodo.id}`,
        },
      })

      return newTodo
    } catch (error) {
      console.error('Error handling todo message:', error)
      throw error
    }
  }

  async handleConnection(ws, req) {
    try {
      // Estrai il token dall'URL della richiesta WebSocket
      const token = new URLSearchParams(req.url.slice(1)).get('token')

      if (!token) {
        ws.close(4001, 'Token non fornito')
        return
      }

      // Verifica il token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

      // Raccoglie informazioni sulla connessione
      const connectionInfo = {
        pcId: decoded.pc_id,
        pcName: req.headers['x-pc-name'] || 'Unknown PC',
        userAgent: req.headers['user-agent'],
        ip: req.socket.remoteAddress,
      }

      // Registra la connessione
      const connectionId = connectionManager.registerConnection(decoded.id, ws, connectionInfo)

      // Aggiorna stato utente nel DB
      await db.User.update({ online: true }, { where: { id: decoded.id } })

      // Associa l'ID connessione al WebSocket
      ws.connectionId = connectionId

      // Broadcast dello stato utente
      this.broadcastUserStatus(decoded.id, true)

      // Gestione messaggi in arrivo
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data)
          await this.handleMessage(ws, message, decoded.id)
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'Formato messaggio non valido',
            }),
          )
        }
      })

      // Gestione disconnessione
      ws.on('close', async () => {
        connectionManager.removeConnection(ws.connectionId)
        await this.handleDisconnection(decoded.id)
      })

      // Invia conferma connessione
      ws.send(
        JSON.stringify({
          type: 'connected',
          userId: decoded.id,
          deviceInfo: connectionInfo,
          stats: {
            activeConnections: connectionManager.getUserConnections(decoded.id).length,
          },
        }),
      )
    } catch (error) {
      console.error('WebSocket connection error:', error)
      ws.close(4002, 'Autenticazione fallita')
    }
  }

  async handleMessage(ws, message, userId) {
    try {
      switch (message.type) {
        case 'chat':
          await this.handleChatMessage(userId, message)
          break
        case 'todoMessage':
          await this.handleTodoMessage(userId, message)
          break
        default:
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'Tipo messaggio sconosciuto',
            }),
          )
      }
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          error: "Errore nell'elaborazione del messaggio",
        }),
      )
    }
  }

  async handleChatMessage(fromUserId, message) {
    // Salva il messaggio nel DB
    const newMessage = await db.Message.create({
      fromId: fromUserId,
      toId: message.to,
      content: message.content,
    })

    // Recupera info mittente
    const sender = await db.User.findByPk(fromUserId, {
      attributes: ['id', 'name', 'pc_id'],
    })

    const messageToSend = {
      type: 'chat',
      id: newMessage.id,
      from: {
        id: sender.id,
        name: sender.name,
        pc_id: sender.pc_id,
      },
      content: message.content,
      timestamp: newMessage.createdAt,
    }

    // Usa il ConnectionManager per inviare il messaggio
    connectionManager.sendToUser(message.to, messageToSend)
  }

  async handleDisconnection(userId) {
    // Se non ci sono più connessioni attive per questo utente
    if (!connectionManager.isUserConnected(userId)) {
      // Aggiorna stato utente nel DB
      await db.User.update(
        {
          online: false,
          lastSeen: new Date(),
        },
        { where: { id: userId } },
      )

      // Broadcast dello stato utente
      this.broadcastUserStatus(userId, false)
    }
  }

  broadcastUserStatus(userId, online) {
    const message = {
      type: 'userStatus',
      userId,
      online,
      timestamp: new Date(),
    }

    // Broadcast a tutti gli utenti connessi eccetto quello corrente
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }
}

module.exports = new WebSocketManager()
