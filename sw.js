// MedGuide PWA Service Worker v1.0.0
const CACHE_NAME = 'medguide-v1.0.0';

// قائمة الموارد الأساسية للعمل في وضع عدم الاتصال (Offline)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './home.html',
  './ai-medguide.html',
  './ai-medguide-caregiver.html',
  './ai-medguide-auth.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png'
];

// التثبيت: حفظ الملفات في الكاش وتخطي الانتظار فورا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[MedGuide SW] Caching offline assets...');
        return cache.addAll(ASSETS_TO_CACHE).catch(err => {
          console.warn('[MedGuide SW] Pre-caching warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// التفعيل: تنظيف أي كاش قديم والتحكم المباشر في الصفحات
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[MedGuide SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// التعامل مع الطلبات (Fetch) لدعم العمل أوفلاين وسرعة الاستجابة
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // في حالة الانتقال بين الصفحات (HTML Navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('./index.html');
        })
    );
    return;
  }

  // بالنسبة لباقي الملفات: التحقق من الكاش أولاً ثم الشبكة
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // تحديث الكاش في الخلفية
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch(err => {
        console.warn('[MedGuide SW] Fetch failed for:', event.request.url);
      });
    })
  );
});
