// controllers/pushNotificationController.js
const { webpush, publicKey } = require('../config/webPush');
const PushSubscription = require('../models/PushSubscription');

const pushNotificationController = {
  getPublicKey(req, res) {
    res.json({ publicKey });
  },

  async subscribe(req, res) {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;

      await PushSubscription.findOrCreate({
        where: {
          endpoint: subscription.endpoint,
          userId: userId
        },
        defaults: {
          keys: subscription.keys,
          userAgent: req.headers['user-agent'],
        }
      });

      res.status(201).json({ message: 'Subscription saved' });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Failed to save subscription' });
    }
  },

  async unsubscribe(req, res) {
    try {
      const { endpoint } = req.body;
      const userId = req.user.id;

      await PushSubscription.update(
        { active: false },
        {
          where: {
            endpoint,
            userId
          }
        }
      );

      res.json({ message: 'Subscription removed' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove subscription' });
    }
  },

  async sendNotification(userId, payload) {
    try {
      const subscriptions = await PushSubscription.findAll({
        where: {
          userId,
          active: true
        }
      });

      const notifications = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            JSON.stringify(payload)
          );

          await subscription.update({ lastUsed: new Date() });
        } catch (error) {
          if (error.statusCode === 410) {
            await subscription.update({ active: false });
          }
          console.error('Push notification failed:', error);
        }
      });

      await Promise.allSettled(notifications);
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }
};

module.exports = pushNotificationController;
