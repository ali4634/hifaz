// کیشے کا نام اور ایک نیا ورژن
const CACHE_NAME = 'hifaz-core-cache-v1';

// صرف اور صرف بنیادی فائلیں جن کے بغیر ایپ چل ہی نہیں سکتی
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json'
];

// سروس ورکر انسٹال کرنا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('سادہ کیشے کھولا گیا اور صرف بنیادی فائلیں کیش کی جا رہی ہیں');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        // یہ ایرر ہمیں بتائے گا کہ کیا انسٹالیشن میں مسئلہ ہے
        console.error('بنیادی کیشنگ میں شدید ناکامی:', error);
      })
  );
  self.skipWaiting();
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
