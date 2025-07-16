 const CACHE_VERSION = 'v3.0-final-names'; 
const CACHE_NAME = `hifaz-tracker-${CACHE_VERSION}`;

// آپ کی ریپوزٹری میں موجود فائلوں کے درست نام
const FILES_TO_CACHE = [
  '/hifaz/',
  '/hifaz/index.html',
  '/hifaz/style.css',
  '/hifaz/script.js', // 'script' کو 'script.js' سے تبدیل کیا گیا
  '/hifaz/manifest.json',
  '/hifaz/icon-192x192.png', // درست آئیکن کا نام
  '/hifaz/icon-512x512.png'  // درست آئیکن کا نام
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/hifaz/index.html')));
  } else {
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
  }
});
