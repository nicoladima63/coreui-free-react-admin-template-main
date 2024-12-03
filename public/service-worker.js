// public/service-worker.js
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/logo.png', // Poi cambierai con il tuo logo
      badge: '/assets/logo.png',
      data: data.data,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      tag: 'message-notification', // Per gestire multiple notifiche
      actions: [
        {
          action: 'open',
          title: 'Apri'
        },
        {
          action: 'close',
          title: 'Chiudi'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  // Se clicchiamo la notifica o il pulsante "Apri"
  if (event.notification.data?.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(windowClients => {
          // Se c'è già una finestra aperta dell'app
          for (const client of windowClients) {
            if (client.url.includes('/dashboard') && 'focus' in client) {
              return client.focus();
            }
          }
          // Altrimenti apri una nuova finestra
          return clients.openWindow(event.notification.data.url);
        })
    );
  }
});
