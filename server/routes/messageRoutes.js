// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const auth = require('../middleware/authMiddleware'); // Il tuo middleware di autenticazione

// Get messages for a specific conversation
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await db.Message.findAll({
      where: {
        [sequelize.Op.or]: [
          { fromId: req.user.id, toId: req.params.userId },
          { fromId: req.params.userId, toId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'pc_id']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'pc_id']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Errore nel recupero dei messaggi' });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    await db.Message.update(
      { read: true },
      {
        where: {
          id: req.params.messageId,
          toId: req.user.id
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento del messaggio' });
  }
});

module.exports = router;
