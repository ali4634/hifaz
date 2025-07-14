 // کیش کا نام اور ورژن
const CACHE_NAME = 'hifaz-tracker-cache-v3'; // ورژن تبدیل کیا تاکہ پرانا کیش صاف ہو جائے
const REPO_NAME = '/hifaz--tracker';

// وہ فائلیں جنہیں کیش کرنا ہے
const urlsToCache = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/style.css`,
  `${REPO_NAME}/script.js`,
  `${REPO_NAME}/manifest.json`,
  `${REPO_NAME}/icons/icon-192x192.png`,
  `${REPO_NAME}/icons/icon-512x512.png`,
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// سروس ورکر انسٹال کرنا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('کیش کھولا گیا');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('کیشنگ میں ناکامی:', error);
      })
  );
  self.skipWaiting();
});

// Fetch ایونٹ کو ہینڈل کرنا
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// سروس ورکر کو ایکٹیویٹ کرنا
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
