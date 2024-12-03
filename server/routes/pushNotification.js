const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/pushNotificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/vapid-public-key', authenticate, (req, res) => {
  console.log('Vapid key request received');
  pushNotificationController.getPublicKey(req, res);
});

router.post('/subscribe', authenticate, pushNotificationController.subscribe);

router.post('/unsubscribe', authenticate, pushNotificationController.unsubscribe);

module.exports = router;
