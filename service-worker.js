// Service Worker для Couch Guardian PWA
// Версия: 1.0.0

const CACHE_NAME = 'couch-guardian-v1';
const OFFLINE_URL = '/couch-guardian/offline.html';

// Файлы для кэширования при установке
const PRECACHE_URLS = [
  '/couch-guardian/',
  '/couch-guardian/index.html',
  '/couch-guardian/manifest.json',
  '/couch-guardian/icon-192x192.png',
  '/couch-guardian/icon-512x512.png',
  '/couch-guardian/sounds/push-positive.mp3',
  '/couch-guardian/sounds/push-negative.mp3',
  '/couch-guardian/sounds/cursed.mp3',
  '/couch-guardian/sounds/level-up.mp3'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker: Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэширование файлов при установке');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ Все файлы успешно кэшированы');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Ошибка кэширования:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker: Активация');
  
  // Очистка старых кэшей
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker активирован');
      return self.clients.claim();
    })
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
  // Пропускаем запросы к Supabase и аналитике
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('analytics')) {
    return;
  }
  
  // Для навигационных запросов используем стратегию "сеть сначала, потом кэш"
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Клонируем ответ для кэширования
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, пробуем получить из кэша
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Если нет в кэше, показываем оффлайн страницу
              return caches.match(OFFLINE_URL);
            });
        })
    );
  } else {
    // Для остальных запросов используем стратегию "кэш сначала, потом сеть"
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Не кэшируем большие файлы или ненужные ресурсы
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Кэшируем полезные ресурсы
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(error => {
              console.log('📴 Оффлайн режим:', error);
              // Для некоторых типов запросов можно вернуть fallback
              if (event.request.destination === 'image') {
                return caches.match('/couch-guardian/icon-512x512.png');
              }
            });
        })
    );
  }
});

// Фоновая синхронизация (если поддерживается)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-leaderboard') {
    console.log('🔄 Фоновая синхронизация лидерборда');
    event.waitUntil(syncLeaderboardData());
  }
});

// Push уведомления
self.addEventListener('push', event => {
  console.log('📨 Push уведомление получено');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое обновление в Couch Guardian!',
    icon: '/couch-guardian/icon-192x192.png',
    badge: '/couch-guardian/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'play',
        title: '🎮 Играть',
        icon: '/couch-guardian/icon-96x96.png'
      },
      {
        action: 'leaderboard',
        title: '🏆 Лидерборд',
        icon: '/couch-guardian/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Couch Guardian', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Клик по уведомлению:', event.action);
  
  event.notification.close();
  
  const urlToOpen = new URL('/couch-guardian/', self.location.origin).href;
  
  if (event.action === 'play') {
    // Открыть игру
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen + '?action=newgame');
        }
      })
    );
  } else if (event.action === 'leaderboard') {
    // Открыть лидерборд
    event.waitUntil(
      clients.openWindow(urlToOpen + '?action=leaderboard')
    );
  } else {
    // Просто открыть игру
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Функция синхронизации данных лидерборда
async function syncLeaderboardData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const leaderboardData = await cache.match('/couch-guardian/api/leaderboard');
    
    if (leaderboardData) {
      // Здесь можно отправить данные на сервер
      console.log('Синхронизация данных лидерборда');
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    return Promise.reject(error);
  }
}

// Периодическая фоновая синхронизация (раз в день)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-leaderboard') {
    console.log('🔄 Периодическая синхронизация лидерборда');
    event.waitUntil(updateLeaderboardCache());
  }
});

// Обновление кэша лидерборда
async function updateLeaderboardCache() {
  try {
    const response = await fetch('/couch-guardian/api/leaderboard');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/couch-guardian/api/leaderboard', response);
      console.log('✅ Кэш лидерборда обновлен');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления кэша лидерборда:', error);
  }
}

// Обработка сообщений от основного потока
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_LEADERBOARD') {
    cacheLeaderboardData(event.data.data);
  }
});

// Кэширование данных лидерборда
async function cacheLeaderboardData(data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/couch-guardian/api/leaderboard', response);
    console.log('✅ Данные лидерборда закэшированы');
  } catch (error) {
    console.error('❌ Ошибка кэширования лидерборда:', error);
  }
}