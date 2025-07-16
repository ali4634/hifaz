 // حتمی کیشے کا نام اور ورژن
const CACHE_NAME = 'hifaz-github-cache-v1';

// وہ تمام فائلیں جن کی ایپ کو ضرورت ہے (GitHub Pages کے لیے)
const urlsToCache = [
  '/hifaz/', // GitHub پر روٹ فولڈر کو کیشے کرنا بہت ضروری ہے
  '/hifaz/index.html',
  '/hifaz/style.css',
  '/hifaz/script.js',
  '/hifaz/manifest.json',
  
  // تمام آئیکن فائلیں
  '/hifaz/apple-touch-icon.png',
  '/hifaz/favicon.ico',
  '/hifaz/favicon-16x16.png',
  '/hifaz/favicon-32x32.png',
  '/hifaz/android-chrome-192x192.png',
  '/hifaz/android-chrome-512x512.png',

  // تمام بیرونی (External) لائبریریاں
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// سروس ورکر انسٹال کرنا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('حتمی کیشے کھولا گیا اور تمام فائلیں کیش کی جا رہی ہیں');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('GitHub Pages کیشنگ میں ناکامی:', error);
      })
  );
  self.skipWaiting();
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

// Fetch ایونٹ کو ہینڈل کرنا
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر فائل کیشے میں ہے تو اسے واپس کرو، ورنہ نیٹ ورک سے لاؤ
        return response || fetch(event.request);
      })
  );
});
