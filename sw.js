 // کیشے کا نام اور ورژن
const CACHE_NAME = 'hifaz-app-cache-v3'; // ورژن کو پھر سے اپ ڈیٹ کیا

// وہ تمام فائلیں جنہیں کیش کرنا ہے (نئی آئیکن فائلوں کے ساتھ)
const urlsToCache = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  
  // نئی آئیکن فائلیں
  'apple-touch-icon.png',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',

  // بیرونی لائبریریاں (External Libraries)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// سروس ورکر انسٹال کرنا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('کیش کھولا گیا اور تمام ضروری فائلیں کیش کی جا رہی ہیں');
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
          // پرانے کیشے کو حذف کرو
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
