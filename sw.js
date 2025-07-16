 // سروس ورکر کا ورژن اور کیشے کا نام متعین کریں
// جب بھی آپ اپنی فائلوں میں کوئی تبدیلی کریں تو اس ورژن کو تبدیل کریں
// چونکہ ہم sw.js کو اپ ڈیٹ کر رہے ہیں، اس لیے ورژن کو v1.2 کر دیں
const CACHE_VERSION = 'v1.2'; 
const CACHE_NAME = `hifaz-tracker-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  '/hifaz/',
  '/hifaz/index.html',
  '/hifaz/style.css',
  '/hifaz/app.js',
  '/hifaz/manifest.json',
  '/hifaz/apple-touch-icon.png',
  '/hifaz/android-chrome-192x192.png',
  '/hifaz/android-chrome-512x512.png',
  '/hifaz/favicon.ico',
  '/hifaz/favicon-16x16.png',
  '/hifaz/favicon-32x32.png',
  '/hifaz/site.webmanifest'
];

// انسٹال ایونٹ: تمام فائلیں کیشے کریں
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all specified files');
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
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim())
  );
});

// فیچ ایونٹ: نیٹ ورک کی درخواستوں کو انٹرسیپٹ کریں (اپ ڈیٹ شدہ منطق)
self.addEventListener('fetch', (event) => {
  // صرف GET درخواستوں کا جواب دیں گے
  if (event.request.method !== 'GET') {
    return;
  }

  // صفحہ ریفریش (نیویگیشن) کے لیے: نیٹ ورک پہلے، پھر کیشے
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // اگر نیٹ ورک ناکام ہو جائے تو کیشے سے মূল صفحہ واپس کریں
          return caches.match('/hifaz/index.html');
        })
    );
    return;
  }

  // دیگر تمام درخواستوں (CSS, JS, تصاویر) کے لیے: کیشے پہلے، پھر نیٹ ورک
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر کیشے میں ہے تو اسے واپس کریں، ورنہ نیٹ ورک سے حاصل کریں
        return response || fetch(event.request);
      })
  );
});
