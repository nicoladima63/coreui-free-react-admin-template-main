// public/service-worker.js
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
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
          title: 'Apri',
        },
        {
          action: 'close',
          title: 'Chiudi',
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  } catch (error) {
    console.error('Error showing notification:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  // Use the URL from notification data or fallback to dashboard
  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus() // Se la dashboard è già aperta, la mette in primo piano
        }
      }
      return clients.openWindow(urlToOpen) // Altrimenti, apre una nuova finestra
    }),
  )
})
