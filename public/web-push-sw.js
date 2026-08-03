self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || 'Lembrete financeiro';
  const options = {
    body: payload.body || 'Você tem um lembrete financeiro.',
    data: {
      url: payload.url || '/app',
      reminderId: payload.reminderId,
      financialItemId: payload.financialItemId,
      savingId: payload.savingId
    },
    tag: payload.reminderId || 'financial-reminder',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/app';

  event.waitUntil(
    (async () => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href;
      const openedClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of openedClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) return client.navigate(absoluteUrl);
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })()
  );
});
