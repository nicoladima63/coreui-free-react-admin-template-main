const webpush = require('web-push');
require('dotenv').config();

// Se le chiavi non esistono, generane di nuove
const vapidKeys = process.env.VAPID_PUBLIC_KEY ? {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
} : webpush.generateVAPIDKeys();

// Se sono state appena generate, mostra in console per salvarle
if (!process.env.VAPID_PUBLIC_KEY) {
  console.log('Generated VAPID Keys:', vapidKeys);
  console.log('Add these to your .env file');
}

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'nicoladimartino@gmail.com'}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = {
  webpush,
  publicKey: vapidKeys.publicKey
};
