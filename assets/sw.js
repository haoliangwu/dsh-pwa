// dsh-pwa service worker: no-op fetch handler for Chrome installability.
// Does not cache anything; the app requires a live host + WebSocket.
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', () => {})