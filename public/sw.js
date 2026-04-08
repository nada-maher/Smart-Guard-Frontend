/**
 * Service Worker for Smart Guard Push Notifications
 */

const CACHE_NAME = 'smart-guard-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔧 Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('🔧 Service Worker: Failed to cache files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return a basic offline page
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event - handle incoming push messages
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push message received');
  
  let notificationData = {
    title: 'تنبيه من حارس ذكي',
    body: 'تم اكتشاف نشاط مشبوه',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'smart-guard-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'عرض التفاصيل'
      },
      {
        action: 'dismiss',
        title: 'تجاهل'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
      console.log('📬 Service Worker: Push data:', data);
    } catch (error) {
      console.error('📬 Service Worker: Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the dashboard to view details
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('🔔 Service Worker: Notification dismissed');
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Service Worker: Notification closed');
  
  // You can send analytics to backend about notification dismissal
  event.waitUntil(
    fetch('/api/notification-dismissed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification: event.notification,
        timestamp: new Date().toISOString()
      })
    }).catch((error) => {
      console.error('🔕 Service Worker: Error reporting notification dismissal:', error);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync');
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(
      // Sync any pending notification actions
      fetch('/api/sync-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch((error) => {
        console.error('🔄 Service Worker: Background sync failed:', error);
      })
    );
  }
});

console.log('🚀 Service Worker: Loaded successfully');
