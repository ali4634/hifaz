const CACHE_VERSION = 'v3.0-final-names';
const CACHE_NAME = `hifaz-tracker-${CACHE_VERSION}`;

// درست فائلوں کی لسٹ (بغیر script.js کے)
const FILES_TO_CACHE = [
  '/hifaz/',
  '/hifaz/index.html',
  '/hifaz/style.css',
  // '/hifaz/script.js',  <-- اس لائن کو ہٹا دیا گیا ہے کیونکہ یہ فائل موجود نہیں
  '/hifaz/manifest.json',
  '/hifaz/icon-192x192.png',
  '/hifaz/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened, adding files to cache');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Failed to cache files:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // نیویگیشن کی درخواستوں کے لیے: پہلے نیٹ ورک، پھر کیش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/hifaz/index.html');
      })
    );
  }
  // دیگر تمام درخواستوں کے لیے (CSS, تصاویر وغیرہ): پہلے کیش، پھر نیٹ ورک
  else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
