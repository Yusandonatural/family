/* オフラインでも使えるように キャッシュ（ネット優先・だめなら キャッシュ）。更新時は VERSION を上げる */
const VERSION = 'eikaiwa-v2';
const ASSETS = ['./', 'index.html', 'style.css?v=1', 'app.js?v=2', 'icon.svg', 'manifest.webmanifest', '../study/js/conversation.js?v=1'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('eikaiwa-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return r; })
    .catch(() => caches.match(req, { ignoreSearch: true })));
});
