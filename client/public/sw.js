self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const { title = 'ScoreStream', body = '', icon = '/favicon.ico' } = data
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      vibrate: [100, 50, 100],
      data: { url: self.location.origin },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/')
    })
  )
})
