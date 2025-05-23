// routes/todoMessages.js
const express = require('express');
const router = express.Router();

const { TodoMessage, User,sequelize } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');
const WebSocketManager = require('../websocket/WebSocketManager');

router.get('/', async (req, res) => {
  try {
    const todos = await TodoMessage.findAll();
    res.json(todos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Errore nel recupero dei todo' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { recipientId, subject, message, priority, type, relatedTaskId, relatedStepId } = req.body;

    if (!recipientId || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipientId', 'subject', 'message']
      });
    }

    const todoMessage = await TodoMessage.create({
      senderId: req.user.id,
      recipientId: parseInt(recipientId, 10),
      subject,
      message,
      priority,
      type,
      relatedTaskId,
      relatedStepId,
      status: 'pending'
    }, { transaction });

    // Send WebSocket notification
    WebSocketManager.sendNotification(parseInt(recipientId, 10), {
      action: 'new_todo',
      data: {
        id: todoMessage.id,
        subject: todoMessage.subject,
        senderId: req.user.id,
        senderName: req.user.name,
        type,
        relatedTaskId,
        relatedStepId,
        timestamp: new Date()
      }
    });

    await transaction.commit();
    res.status(201).json(todoMessage);

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating todo:', error);
    res.status(400).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});




router.get('/received', authenticate, async (req, res) => {
  try {

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'No user found in request'
      });
    }

    const todos = await TodoMessage.findAll({
      where: { recipientId: req.user.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(todos);
  } catch (error) {
    console.error('Error in /received:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


router.get('/sent', authenticate, async (req, res) => {
  try {
    // Check if user exists in the request
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const todos = await TodoMessage.findAll({
      where: { senderId: req.user.id },
      include: [
        { model: User, as: 'recipient', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(todos);
  } catch (error) {
    console.error('Error in /sent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark todo as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const todo = await TodoMessage.findOne({
      where: {
        id: req.params.id,
        recipientId: req.user.id
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (!todo.readAt) {
      todo.readAt = new Date();
      todo.status = 'read';
      await todo.save();
    }

    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update todo status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validazione
    if (!status || !['pending', 'read', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        error: 'Stato non valido',
        validStates: ['pending', 'read', 'in_progress', 'completed']
      });
    }

    const todo = await TodoMessage.findByPk(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo non trovato' });
    }

    await todo.update({ status });

    res.json(todo);
  } catch (error) {
    console.error('Error updating todo status:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato' });
  }
});
// Delete todo (only if you're the sender)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await TodoMessage.destroy({
      where: {
        id: req.params.id,
        senderId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found or unauthorized' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
