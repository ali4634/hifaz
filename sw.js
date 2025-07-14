// کیش کا نام اور ورژن
const CACHE_NAME = 'hifaz-tracker-cache-v2'; // ورژن اپڈیٹ کیا تاکہ پرانا کیش صاف ہو جائے
// وہ فائلیں جنہیں کیش کرنا ہے
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// سروس ورکر انسٹال کرنا
self.addEventListener('install', event => {
  // انسٹالیشن کے دوران کیش کو کھولیں اور فائلیں شامل کریں
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('کیش کھولا گیا');
        // addAll ایک ایٹمی آپریشن ہے۔ اگر ایک بھی فائل ناکام ہوتی ہے تو پورا آپریشن ناکام ہوجاتا ہے۔
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
        // اگر درخواست کیش میں موجود ہے تو کیش سے جواب دیں
        if (response) {
          return response;
        }
        
        // ورنہ نیٹ ورک سے درخواست کریں اور اسے کیش بھی کریں
        return fetch(event.request).then(
          function(response) {
            // اگر جواب درست نہیں ہے تو اسے واپس کریں
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // جواب کی ایک کاپی بنائیں
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
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
          // پرانے کیش کو حذف کریں
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // فعال سروس ورکر کو فوری طور پر کنٹرول لینے پر مجبور کریں
  );
});
