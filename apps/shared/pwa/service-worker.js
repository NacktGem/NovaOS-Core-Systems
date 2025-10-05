// Progressive Web App Service Worker - Universal
// Supports NovaOS Console, Black Rose Collective, and GypsyCove

const CACHE_VERSION = 'v1.0.0';
const PLATFORM = self.registration.scope.includes('novaos') ? 'novaos' : 
                 self.registration.scope.includes('black-rose') ? 'black_rose' : 
                 self.registration.scope.includes('gypsy-cove') ? 'gypsy_cove' : 'default';

// Platform-specific cache names
const CACHE_NAMES = {
  static: `${PLATFORM}-static-${CACHE_VERSION}`,
  dynamic: `${PLATFORM}-dynamic-${CACHE_VERSION}`,
  images: `${PLATFORM}-images-${CACHE_VERSION}`,
  api: `${PLATFORM}-api-${CACHE_VERSION}`
};

// Platform-specific static resources to cache
const STATIC_RESOURCES = {
  novaos: [
    '/',
    '/dashboard',
    '/agents',
    '/monitoring',
    '/analytics',
    '/settings',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png',
    '/manifest.json'
  ],
  black_rose: [
    '/',
    '/dashboard',
    '/content',
    '/earnings',
    '/subscribers',
    '/messages',
    '/profile',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png',
    '/manifest.json'
  ],
  gypsy_cove: [
    '/',
    '/feed',
    '/explore',
    '/create',
    '/notifications',
    '/profile',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png',
    '/manifest.json'
  ],
  default: [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png',
    '/manifest.json'
  ]
};

// API endpoints that should be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/user\/profile/,
  /\/api\/dashboard\/stats/,
  /\/api\/agents\/list/,
  /\/api\/content\/metadata/,
  /\/api\/settings\/preferences/
];

// API endpoints that should always be fresh
const FRESH_API_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/payments\//,
  /\/api\/live\//,
  /\/api\/notifications\/unread/,
  /\/api\/messages\/latest/
];

// Background sync tasks
const BACKGROUND_SYNC_TAGS = {
  CONTENT_UPLOAD: 'content-upload',
  MESSAGE_SEND: 'message-send',
  ANALYTICS_SYNC: 'analytics-sync',
  SETTINGS_SYNC: 'settings-sync'
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker for ${PLATFORM}`);
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        const resourcesToCache = STATIC_RESOURCES[PLATFORM] || STATIC_RESOURCES.default;
        return cache.addAll(resourcesToCache);
      })
      .then(() => {
        console.log('[SW] Static resources cached successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker for ${PLATFORM}`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith(`${PLATFORM}-`) && 
                   !Object.values(CACHE_NAMES).includes(cacheName);
          })
          .map((cacheName) => {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          });
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('[SW] Service worker activated and old caches cleaned');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle API requests with intelligent caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
  const requiresFresh = FRESH_API_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (requiresFresh) {
    // Always fetch fresh data for critical endpoints
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      // Return cached version if available during offline
      const cached = await caches.match(request);
      return cached || new Response('Offline', { status: 503 });
    }
  }
  
  if (isCacheable) {
    // Network first, then cache for cacheable APIs
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAMES.api);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      return cached || new Response('Offline', { status: 503 });
    }
  }
  
  // Default: network only for other API requests
  return fetch(request);
}

// Handle image requests with caching
async function handleImageRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.images);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder image for offline
    return new Response('', { 
      status: 200, 
      headers: { 'Content-Type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#666">Image unavailable</text></svg>'
    });
  }
}

// Handle navigation and static resource requests
async function handleNavigationRequest(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    // Return cached version and update in background
    fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAMES.dynamic);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {
      // Ignore background update failures
    });
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // For navigation requests, return the app shell
    if (request.mode === 'navigate') {
      const appShell = await caches.match('/');
      return appShell || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log(`[SW] Background sync triggered: ${event.tag}`);
  
  switch (event.tag) {
    case BACKGROUND_SYNC_TAGS.CONTENT_UPLOAD:
      event.waitUntil(syncContentUpload());
      break;
    case BACKGROUND_SYNC_TAGS.MESSAGE_SEND:
      event.waitUntil(syncMessages());
      break;
    case BACKGROUND_SYNC_TAGS.ANALYTICS_SYNC:
      event.waitUntil(syncAnalytics());
      break;
    case BACKGROUND_SYNC_TAGS.SETTINGS_SYNC:
      event.waitUntil(syncSettings());
      break;
  }
});

// Sync pending content uploads
async function syncContentUpload() {
  try {
    const pendingUploads = await getPendingUploads();
    
    for (const upload of pendingUploads) {
      try {
        const response = await fetch('/api/content/upload', {
          method: 'POST',
          body: upload.data,
          headers: upload.headers
        });
        
        if (response.ok) {
          await removePendingUpload(upload.id);
          // Notify client of successful upload
          broadcastMessage({
            type: 'UPLOAD_SUCCESS',
            uploadId: upload.id
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync upload:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync pending messages
async function syncMessages() {
  try {
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await removePendingMessage(message.id);
          broadcastMessage({
            type: 'MESSAGE_SENT',
            messageId: message.id
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Message sync failed:', error);
  }
}

// Sync analytics data
async function syncAnalytics() {
  try {
    const pendingAnalytics = await getPendingAnalytics();
    
    if (pendingAnalytics.length > 0) {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingAnalytics)
      });
      
      if (response.ok) {
        await clearPendingAnalytics();
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Sync settings changes
async function syncSettings() {
  try {
    const pendingSettings = await getPendingSettings();
    
    for (const setting of pendingSettings) {
      try {
        const response = await fetch('/api/settings/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting.data)
        });
        
        if (response.ok) {
          await removePendingSetting(setting.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync setting:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Settings sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: `/static/icons/${PLATFORM}-icon-192.png`,
    badge: `/static/icons/${PLATFORM}-badge.png`,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      platform: PLATFORM,
      timestamp: Date.now()
    },
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling from clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(data.urls));
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(data.cacheName));
      break;
    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      }));
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Utility functions for IndexedDB operations
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`${PLATFORM}-offline-data`, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('uploads')) {
        db.createObjectStore('uploads', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingUploads() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['uploads'], 'readonly');
    const store = transaction.objectStore('uploads');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingUpload(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['uploads'], 'readwrite');
    const store = transaction.objectStore('uploads');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPendingMessages() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingMessage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPendingAnalytics() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['analytics'], 'readonly');
    const store = transaction.objectStore('analytics');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearPendingAnalytics() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['analytics'], 'readwrite');
    const store = transaction.objectStore('analytics');
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPendingSettings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingSetting(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Broadcast message to all clients
function broadcastMessage(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAMES.dynamic);
  return cache.addAll(urls);
}

// Clear specific cache
async function clearCache(cacheName) {
  return caches.delete(cacheName || CACHE_NAMES.dynamic);
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith(`${PLATFORM}-`)) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        size: keys.length,
        urls: keys.map(request => request.url)
      };
    }
  }
  
  return status;
}

console.log(`[SW] Service worker loaded for ${PLATFORM} platform`);