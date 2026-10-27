// Keeps the app and product pictures on the phone so it opens and works with no signal.
importScripts('catalog.js');
const VERSION = 'kstall-v3';
const SHELL = ['./', 'index.html', 'app.js', 'catalog.js', 'qrcode.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    // Product pictures: fetched once now so they show even if never opened online.
    await Promise.all(CATALOG.filter(p => p.img).map(p =>
      fetch(p.img, { mode: 'no-cors' }).then(r => c.put(p.img, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return; // Sheet: always live
  if (url.origin === location.origin) {
    // App files: use the network when there is one (so updates arrive), else the saved copy.
    e.respondWith(fetch(req).then(r => {
      if (r.ok) caches.open(VERSION).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (url.hostname === 'cdn.shopify.com') {
    e.respondWith(caches.match(req.url).then(r => r || fetch(req).then(res => {
      caches.open(VERSION).then(c => c.put(req.url, res.clone())); return res;
    })));
  }
});
