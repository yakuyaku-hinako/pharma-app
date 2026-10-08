// コードを更新して再公開するときは、この番号を上げてください(例: v5)
const CACHE = 'pharma-app-v8';
const FILES = ['./', './index.html', './style.css', './manifest.json',
  './js/stats.js', './js/db.js', './js/ui.js', './js/frog.js', './js/learn.js', './js/backup.js', './js/screens/stats.js', './js/screens/settings.js', './js/screens/home.js', './js/screens/database.js', './js/screens/noteDetail.js', './js/screens/quiz.js',
  './js/screens/register.js', './js/screens/note.js', './js/screens/quizEdit.js',
  './js/app.js', './icons/icon-180.png',
  './frog/face/joy.svg', './frog/face/angry.svg', './frog/face/sad.svg', './frog/face/fun.svg', './frog/face/surprise.svg', './frog/face/fight.svg', './frog/face/shy.svg', './frog/face/worry.svg', './frog/face/understand.svg', './frog/body/joy.svg', './frog/body/angry.svg', './frog/body/sad.svg', './frog/body/fun.svg', './frog/body/surprise.svg', './frog/body/fight.svg', './frog/body/shy.svg', './frog/body/worry.svg', './frog/body/understand.svg'];

// ファイルが1つ欠けていても全体が失敗しないように、1つずつ保存する
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// 常に最新を優先(通信できないときだけ保存済みを使う → 圏外でも動く)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
