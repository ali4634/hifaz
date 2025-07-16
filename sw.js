 // سروس ورکر کا ورژن اور کیشے کا نام متعین کریں
// جب بھی آپ اپنی فائلوں میں کوئی تبدیلی کریں تو اس ورژن کو تبدیل کریں تاکہ سروس ورکر اپ ڈیٹ ہو
const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `hifaz-tracker-${CACHE_VERSION}`;

// وہ تمام فائلیں جنہیں آف لائن استعمال کے لیے کیشے کرنا ہے
// اپنی تمام فائلوں کے راستے یہاں شامل کریں
// GitHub Pages کے لیے، ریپوزٹری کے نام کے ساتھ مکمل راستہ استعمال کریں
const FILES_TO_CACHE = [
  '/hifaz/',
  '/hifaz/index.html',
  '/hifaz/style.css', // اگر آپ کی CSS فائل کا نام مختلف ہے تو اسے تبدیل کریں
  '/hifaz/app.js',   // اگر آپ کی JavaScript فائل کا نام مختلف ہے تو اسے تبدیل کریں
  '/hifaz/manifest.json',
  
  // realfavicongenerator.net سے بنائے گئے تمام آئیکنز
  '/hifaz/apple-touch-icon.png',
  '/hifaz/android-chrome-192x192.png',
  '/hifaz/android-chrome-512x512.png',
  '/hifaz/favicon.ico',
  '/hifaz/favicon-16x16.png',
  '/hifaz/favicon-32x32.png',
  '/hifaz/site.webmanifest' // یہ فائل بھی ہو سکتی ہے
];

// 1. انسٹال ایونٹ: سروس ورکر انسٹال ہونے پر تمام فائلیں کیشے کریں
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all specified files');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // انسٹالیشن مکمل ہونے کے بعد نئے سروس ورکر کو فوری طور پر فعال کریں
        return self.skipWaiting();
      })
  );
});

// 2. ایکٹیویٹ ایونٹ: پرانے کیشے کو صاف کریں
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // اگر کیشے کا نام موجودہ نام سے مختلف ہے تو اسے حذف کردیں
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // نئے سروس ورکر کو تمام کھلے کلائنٹس (ٹیبز) کا کنٹرول لینے کے قابل بنائیں
  return self.clients.claim();
});

// 3. فیچ ایونٹ: نیٹ ورک کی درخواستوں کو انٹرسیپٹ کریں
self.addEventListener('fetch', (event) => {
  // ہم صرف GET درخواستوں کا جواب دیں گے
  if (event.request.method !== 'GET') {
    return;
  }
  
  console.log(`[Service Worker] Fetching resource: ${event.request.url}`);
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // اگر درخواست کا جواب کیشے میں موجود ہے، تو اسے واپس کریں
        if (cachedResponse) {
          console.log(`[Service Worker] Found in cache: ${event.request.url}`);
          return cachedResponse;
        }

        // اگر کیشے میں نہیں ہے، تو نیٹ ورک سے حاصل کرنے کی کوشش کریں
        return fetch(event.request).then((networkResponse) => {
            console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
            
            // اگر نیٹ ورک سے کامیابی سے جواب مل جاتا ہے
            // تو اسے مستقبل کے لیے کیشے میں بھی محفوظ کرلیں
            return caches.open(CACHE_NAME).then((cache) => {
              // صرف درست جوابات کو کیشے کریں (جیسے HTTP 200 OK)
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            });

        }).catch(() => {
            // اگر نیٹ ورک کی درخواست ناکام ہو جائے (مثلاً آف لائن ہونے پر)
            // تو ایک فال بیک صفحہ دکھایا جا سکتا ہے، لیکن ابھی کے لیے ہم صرف ناکامی کو لوٹائیں گے
            console.log('[Service Worker] Fetch failed, user is likely offline.');
            // آپ یہاں ایک آف لائن فال بیک صفحہ بھی دکھا سکتے ہیں
            // return caches.match('/hifaz/offline.html');
        });
      })
  );
});
