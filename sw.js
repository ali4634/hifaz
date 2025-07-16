 // سروس ورکر کا حتمی ورژن
const CACHE_VERSION = 'v2.0-final'; 
const CACHE_NAME = `hifaz-tracker-${CACHE_VERSION}`;

// صرف وہ فائلیں جو آپ کی ریپوزٹری میں واقعی موجود ہیں
const FILES_TO_CACHE = [
  '/hifaz/',
  '/hifaz/index.html',
  '/hifaz/style.css',
  '/hifaz/app.js',
  '/hifaz/manifest.json',
  '/hifaz/apple-touch-icon.png',
  '/hifaz/android-chrome-192x192.png',
  '/hifaz/android-chrome-512x512.png'
];

// انسٹال ایونٹ: تمام فائلیں کیشے کریں
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all specified files for offline use.');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ایکٹیویٹ ایونٹ: پرانے کیشے کو صاف کریں
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim())
  );
});

// فیچ ایونٹ: آف لائن ریفریش کے لیے بہترین حکمت عملی
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  // صفحہ ریفریش کے لیے (نیٹ ورک پہلے)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/hifaz/index.html'))
    );
    return;
  }
  // باقی تمام فائلوں کے لیے (کیشے پہلے)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
