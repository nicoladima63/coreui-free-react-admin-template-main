// routes/todoMessages.js
const express = require('express');
const router = express.Router();
const { TodoMessage, User } = require('../models');
const { authenticate } = require('../middleware/authMiddleware');

// Create a new todo message
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipientId, subject, message, priority, dueDate } = req.body;
    const todoMessage = await TodoMessage.create({
      senderId: req.user.id,
      recipientId,
      subject,
      message,
      priority,
      dueDate
    });

    // Qui potresti emettere un evento WebSocket per la notifica in tempo reale
    req.io.to(`user_${recipientId}`).emit('new_todo', todoMessage);

    res.status(201).json(todoMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get todos for the current user (received)
router.get('/received', authenticate, async (req, res) => {
  try {
    const todos = await TodoMessage.findAll({
      where: { recipientId: req.user.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(todos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get todos sent by the current user
router.get('/sent', authenticate, async (req, res) => {
  try {
    const todos = await TodoMessage.findAll({
      where: { senderId: req.user.id },
      include: [
        { model: User, as: 'recipient', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(todos);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    const { status } = req.body;
    const todo = await TodoMessage.findOne({
      where: {
        id: req.params.id,
        recipientId: req.user.id
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.status = status;
    if (status === 'completed') {
      todo.completedAt = new Date();
    }
    await todo.save();

    // Notifica il mittente del cambio di stato
    req.io.to(`user_${todo.senderId}`).emit('todo_status_updated', todo);

    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
