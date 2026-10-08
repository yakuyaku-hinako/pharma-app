// コードを更新して再公開するときは、この番号を上げてください(例: v2)
const CACHE = 'pharma-app-v2';
const FILES = ['./','./index.html','./style.css','./manifest.json',
  './js/stats.js','./js/db.js','./js/ui.js','./js/screens/register.js','./js/screens/note.js','./js/app.js','./icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
