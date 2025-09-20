"""
Mobile Responsiveness & PWA Implementation System

Comprehensive mobile-first design and Progressive Web App features:
- Responsive design components with breakpoint management
- Service Worker implementation for offline functionality
- Push notifications system
- App manifest and installation prompts
- Touch-friendly interfaces and gestures
- Performance optimization for mobile devices
- Offline data synchronization
- Native app-like experience
"""

import json
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path


class DeviceType(Enum):
    """Device type classifications"""

    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"
    LARGE_DESKTOP = "large_desktop"


class PWAFeature(Enum):
    """Progressive Web App features"""

    OFFLINE_SUPPORT = "offline_support"
    PUSH_NOTIFICATIONS = "push_notifications"
    INSTALLABLE = "installable"
    BACKGROUND_SYNC = "background_sync"
    NATIVE_FEATURES = "native_features"


@dataclass
class Breakpoint:
    """Responsive design breakpoint"""

    name: str
    min_width: int
    max_width: Optional[int] = None
    device_type: DeviceType = DeviceType.MOBILE

    @property
    def media_query(self) -> str:
        """Generate CSS media query for this breakpoint"""
        if self.max_width:
            return f"(min-width: {self.min_width}px) and (max-width: {self.max_width}px)"
        else:
            return f"(min-width: {self.min_width}px)"


@dataclass
class ResponsiveConfig:
    """Responsive design configuration"""

    breakpoints: List[Breakpoint] = field(default_factory=list)
    mobile_first: bool = True
    touch_friendly: bool = True
    high_dpi_support: bool = True

    def __post_init__(self):
        if not self.breakpoints:
            self.breakpoints = self._default_breakpoints()

    def _default_breakpoints(self) -> List[Breakpoint]:
        """Default responsive breakpoints"""
        return [
            Breakpoint("xs", 0, 575, DeviceType.MOBILE),
            Breakpoint("sm", 576, 767, DeviceType.MOBILE),
            Breakpoint("md", 768, 991, DeviceType.TABLET),
            Breakpoint("lg", 992, 1199, DeviceType.DESKTOP),
            Breakpoint("xl", 1200, 1399, DeviceType.DESKTOP),
            Breakpoint("xxl", 1400, None, DeviceType.LARGE_DESKTOP),
        ]


@dataclass
class PWAConfig:
    """Progressive Web App configuration"""

    app_name: str
    short_name: str
    description: str
    theme_color: str
    background_color: str
    display: str = "standalone"
    orientation: str = "portrait-primary"
    start_url: str = "/"
    scope: str = "/"
    icons: List[Dict[str, Any]] = field(default_factory=list)
    features: List[PWAFeature] = field(default_factory=list)
    offline_pages: List[str] = field(default_factory=list)


class ResponsiveDesignManager:
    """Manages responsive design implementation"""

    def __init__(self, config: ResponsiveConfig):
        self.config = config

    def generate_responsive_css(self, platform: str) -> str:
        """Generate responsive CSS for platform"""

        # Platform-specific color schemes
        colors = {
            "novaos": {
                "primary": "#007bff",
                "secondary": "#6c757d",
                "background": "#ffffff",
                "surface": "#f8f9fa",
            },
            "black_rose": {
                "primary": "#dc3545",
                "secondary": "#6f1319",
                "background": "#1a1a1a",
                "surface": "#2d2d2d",
            },
            "gypsy_cove": {
                "primary": "#6f42c1",
                "secondary": "#563d7c",
                "background": "#ffffff",
                "surface": "#f8f9fa",
            },
        }

        platform_colors = colors.get(platform, colors["novaos"])

        css = f"""
/* {platform.replace('_', ' ').title()} - Responsive Design */

/* CSS Custom Properties for Platform Colors */
:root {{
  --primary-color: {platform_colors['primary']};
  --secondary-color: {platform_colors['secondary']};
  --background-color: {platform_colors['background']};
  --surface-color: {platform_colors['surface']};
  --text-primary: {('#ffffff' if platform == 'black_rose' else '#212529')};
  --text-secondary: {('#cccccc' if platform == 'black_rose' else '#6c757d')};
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  
  /* Typography Scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-xxl: 2rem;
  
  /* Touch Targets */
  --touch-target: 44px;
  --touch-spacing: 8px;
}}

/* Base Mobile-First Styles */
* {{
  box-sizing: border-box;
}}

body {{
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--background-color);
  margin: 0;
  padding: 0;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}}

/* Touch-Friendly Interactive Elements */
button, 
.btn, 
.touch-target {{
  min-height: var(--touch-target);
  min-width: var(--touch-target);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--touch-spacing);
  border: none;
  border-radius: 8px;
  background-color: var(--primary-color);
  color: white;
  font-size: var(--font-size-md);
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
}}

button:hover,
.btn:hover {{
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}}

button:active,
.btn:active {{
  transform: translateY(0);
}}

/* Form Elements */
input, 
textarea, 
select {{
  width: 100%;
  min-height: var(--touch-target);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--spacing-xs) 0;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: var(--font-size-md);
  background-color: var(--surface-color);
  color: var(--text-primary);
}}

input:focus,
textarea:focus,
select:focus {{
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.1);
}}

/* Navigation */
.nav {{
  background-color: var(--surface-color);
  border-bottom: 1px solid #ddd;
  padding: var(--spacing-sm) var(--spacing-md);
}}

.nav-item {{
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: var(--touch-target);
  line-height: calc(var(--touch-target) - var(--spacing-sm) * 2);
}}

/* Cards and Containers */
.card {{
  background-color: var(--surface-color);
  border-radius: 12px;
  padding: var(--spacing-lg);
  margin: var(--spacing-md) 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}}

.container {{
  width: 100%;
  max-width: 100%;
  padding: 0 var(--spacing-md);
  margin: 0 auto;
}}

/* Grid System */
.row {{
  display: flex;
  flex-wrap: wrap;
  margin: 0 calc(var(--spacing-md) * -0.5);
}}

.col {{
  flex: 1;
  padding: 0 calc(var(--spacing-md) * 0.5);
}}

/* Utility Classes */
.text-center {{ text-align: center; }}
.text-left {{ text-align: left; }}
.text-right {{ text-align: right; }}

.mb-1 {{ margin-bottom: var(--spacing-xs); }}
.mb-2 {{ margin-bottom: var(--spacing-sm); }}
.mb-3 {{ margin-bottom: var(--spacing-md); }}
.mb-4 {{ margin-bottom: var(--spacing-lg); }}

.d-none {{ display: none; }}
.d-block {{ display: block; }}
.d-flex {{ display: flex; }}

/* Loading States */
.loading {{
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}}

@keyframes spin {{
  0% {{ transform: rotate(0deg); }}
  100% {{ transform: rotate(360deg); }}
}}

/* Responsive Breakpoints */
"""

        # Add responsive breakpoints
        for breakpoint in self.config.breakpoints:
            if breakpoint.name == "xs":
                continue  # Skip xs as it's mobile-first default

            css += f"""
@media {breakpoint.media_query} {{
  .container {{
    max-width: {breakpoint.max_width or breakpoint.min_width + 200}px;
  }}
  
  .col-{breakpoint.name}-1 {{ flex: 0 0 8.333333%; }}
  .col-{breakpoint.name}-2 {{ flex: 0 0 16.666667%; }}
  .col-{breakpoint.name}-3 {{ flex: 0 0 25%; }}
  .col-{breakpoint.name}-4 {{ flex: 0 0 33.333333%; }}
  .col-{breakpoint.name}-6 {{ flex: 0 0 50%; }}
  .col-{breakpoint.name}-8 {{ flex: 0 0 66.666667%; }}
  .col-{breakpoint.name}-9 {{ flex: 0 0 75%; }}
  .col-{breakpoint.name}-12 {{ flex: 0 0 100%; }}
  
  .d-{breakpoint.name}-none {{ display: none; }}
  .d-{breakpoint.name}-block {{ display: block; }}
  .d-{breakpoint.name}-flex {{ display: flex; }}
}}
"""

        # Add high DPI support
        if self.config.high_dpi_support:
            css += """
/* High DPI / Retina Display Support */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  /* High resolution styles */
  .icon {
    background-size: contain;
  }
}
"""

        return css

    def generate_component_styles(self, component_type: str) -> str:
        """Generate responsive styles for specific components"""

        if component_type == "dashboard":
            return """
/* Dashboard Responsive Styles */
.dashboard {
  display: grid;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

/* Mobile: Single column */
.dashboard {
  grid-template-columns: 1fr;
}

.dashboard-card {
  background: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Tablet: Two columns */
@media (min-width: 768px) {
  .dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-card.featured {
    grid-column: span 2;
  }
}

/* Desktop: Three columns */
@media (min-width: 992px) {
  .dashboard {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .dashboard-card.featured {
    grid-column: span 2;
  }
}

/* Large Desktop: Four columns */
@media (min-width: 1200px) {
  .dashboard {
    grid-template-columns: repeat(4, 1fr);
  }
}
"""

        elif component_type == "form":
            return """
/* Form Responsive Styles */
.form-container {
  max-width: 100%;
  padding: var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Tablet and up: Side-by-side form fields */
@media (min-width: 768px) {
  .form-container {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .form-row {
    flex-direction: row;
  }
  
  .form-row .form-group {
    flex: 1;
  }
}
"""

        elif component_type == "navigation":
            return """
/* Navigation Responsive Styles */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--surface-color);
}

.navbar-brand {
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--primary-color);
  text-decoration: none;
}

.navbar-nav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar-toggle {
  display: none;
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

/* Mobile: Hamburger menu */
@media (max-width: 767px) {
  .navbar-nav {
    position: fixed;
    top: 60px;
    left: -100%;
    width: 100%;
    height: calc(100vh - 60px);
    background-color: var(--surface-color);
    flex-direction: column;
    padding: var(--spacing-lg);
    transition: left 0.3s ease;
  }
  
  .navbar-nav.active {
    left: 0;
  }
  
  .navbar-toggle {
    display: block;
  }
  
  .nav-item {
    width: 100%;
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid #eee;
  }
}

/* Desktop: Horizontal menu */
@media (min-width: 768px) {
  .navbar-nav {
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-lg);
  }
}
"""

        return ""


class PWAManager:
    """Manages Progressive Web App implementation"""

    def __init__(self, config: PWAConfig):
        self.config = config

    def generate_manifest(self) -> Dict[str, Any]:
        """Generate Web App Manifest"""

        # Default icons if none provided
        default_icons = [
            {
                "src": "/icons/icon-72x72.png",
                "sizes": "72x72",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-96x96.png",
                "sizes": "96x96",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-128x128.png",
                "sizes": "128x128",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-144x144.png",
                "sizes": "144x144",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-152x152.png",
                "sizes": "152x152",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-384x384.png",
                "sizes": "384x384",
                "type": "image/png",
                "purpose": "maskable any",
            },
            {
                "src": "/icons/icon-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "maskable any",
            },
        ]

        manifest = {
            "name": self.config.app_name,
            "short_name": self.config.short_name,
            "description": self.config.description,
            "start_url": self.config.start_url,
            "scope": self.config.scope,
            "display": self.config.display,
            "orientation": self.config.orientation,
            "theme_color": self.config.theme_color,
            "background_color": self.config.background_color,
            "icons": self.config.icons or default_icons,
            "categories": ["productivity", "business", "social"],
            "lang": "en-US",
            "dir": "ltr",
        }

        # Add platform-specific features
        if PWAFeature.OFFLINE_SUPPORT in self.config.features:
            manifest["prefer_related_applications"] = False

        if PWAFeature.INSTALLABLE in self.config.features:
            manifest["display_override"] = ["window-controls-overlay", "standalone"]

        return manifest

    def generate_service_worker(self) -> str:
        """Generate Service Worker for PWA functionality"""

        cache_name = f"{self.config.short_name.lower().replace(' ', '-')}-cache-v1"

        sw_code = f"""
// Service Worker for {self.config.app_name}
// Provides offline functionality, caching, and push notifications

const CACHE_NAME = '{cache_name}';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/offline.html',
  '/css/app.css',
  '/js/app.js',
  '/icons/icon-192x192.png',
  '/manifest.json'
];

// Add offline pages from config
const offlinePages = {json.dumps(self.config.offline_pages)};
urlsToCache.push(...offlinePages);

// Install event - cache resources
self.addEventListener('install', (event) => {{
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {{
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      }})
      .then(() => {{
        return self.skipWaiting();
      }})
  );
}});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {{
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {{
      return Promise.all(
        cacheNames.map((cacheName) => {{
          if (cacheName !== CACHE_NAME) {{
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }}
        }})
      );
    }}).then(() => {{
      return self.clients.claim();
    }})
  );
}});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {{
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // Handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {{
    event.respondWith(
      fetch(event.request)
        .then((response) => {{
          // If we get a valid response, clone and cache it
          if (response.status === 200) {{
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {{
              cache.put(event.request, responseClone);
            }});
          }}
          return response;
        }})
        .catch(() => {{
          // Network failed, try cache
          return caches.match(event.request)
            .then((response) => {{
              if (response) {{
                return response;
              }}
              // Fallback to offline page
              return caches.match(OFFLINE_URL);
            }});
        }})
    );
    return;
  }}
  
  // Handle other requests (CSS, JS, images, API)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {{
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((response) => {{
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {{
              return response;
            }}
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {{
                cache.put(event.request, responseToCache);
              }});
            
            return response;
          }})
          .catch(() => {{
            // Network failed, check if we have an offline fallback
            if (event.request.destination === 'image') {{
              return new Response('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#cccccc"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>', {{
                headers: {{ 'Content-Type': 'image/svg+xml' }}
              }});
            }}
            return new Response('Offline - Please check your connection', {{
              status: 408,
              statusText: 'Offline'
            }});
          }});
      }})
  );
}});
"""

        # Add push notification support
        if PWAFeature.PUSH_NOTIFICATIONS in self.config.features:
            sw_code += (
                """
// Push notification event
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('"""
                + self.config.app_name
                + """', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
"""
            )

        # Add background sync support
        if PWAFeature.BACKGROUND_SYNC in self.config.features:
            sw_code += """
// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      syncData()
    );
  }
});

async function syncData() {
  try {
    // Sync pending data when connection is restored
    const pendingData = await getPendingData();
    
    for (const item of pendingData) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
    }
    
    // Clear pending data after successful sync
    await clearPendingData();
    console.log('[ServiceWorker] Background sync completed');
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

async function getPendingData() {
  // Retrieve pending data from IndexedDB or localStorage
  return JSON.parse(localStorage.getItem('pendingSync') || '[]');
}

async function clearPendingData() {
  // Clear pending data after sync
  localStorage.removeItem('pendingSync');
}
"""

        return sw_code

    def generate_pwa_javascript(self) -> str:
        """Generate JavaScript for PWA functionality"""

        js_code = f"""
// PWA JavaScript for {self.config.app_name}
// Handles service worker registration, installation prompts, and PWA features

class PWAManager {{
  constructor() {{
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    
    this.init();
  }}
  
  async init() {{
    // Register service worker
    if ('serviceWorker' in navigator) {{
      try {{
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered:', registration);
        
        // Update available
        registration.addEventListener('updatefound', () => {{
          this.handleUpdate(registration);
        }});
        
      }} catch (error) {{
        console.error('ServiceWorker registration failed:', error);
      }}
    }}
    
    // Setup PWA features
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupPushNotifications();
    this.setupBackgroundSync();
  }}
  
  setupInstallPrompt() {{
    window.addEventListener('beforeinstallprompt', (e) => {{
      console.log('Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    }});
    
    window.addEventListener('appinstalled', () => {{
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    }});
  }}
  
  async showInstallPrompt() {{
    if (this.deferredPrompt) {{
      this.deferredPrompt.prompt();
      const {{ outcome }} = await this.deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      this.deferredPrompt = null;
    }}
  }}
  
  showInstallButton() {{
    const installButton = document.getElementById('install-app-button');
    if (installButton) {{
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {{
        this.showInstallPrompt();
      }});
    }}
  }}
  
  hideInstallButton() {{
    const installButton = document.getElementById('install-app-button');
    if (installButton) {{
      installButton.style.display = 'none';
    }}
  }}
  
  setupOfflineDetection() {{
    window.addEventListener('online', () => {{
      console.log('Back online');
      this.isOnline = true;
      this.updateOfflineStatus();
      this.syncWhenOnline();
    }});
    
    window.addEventListener('offline', () => {{
      console.log('Gone offline');
      this.isOnline = false;
      this.updateOfflineStatus();
    }});
    
    this.updateOfflineStatus();
  }}
  
  updateOfflineStatus() {{
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {{
      offlineIndicator.style.display = this.isOnline ? 'none' : 'block';
    }}
    
    // Update UI for offline mode
    document.body.classList.toggle('offline', !this.isOnline);
  }}
  
  async setupPushNotifications() {{
    if ('Notification' in window && 'serviceWorker' in navigator) {{
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {{
        console.log('Notification permission granted');
        this.subscribeToPushNotifications();
      }}
    }}
  }}
  
  async subscribeToPushNotifications() {{
    try {{
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({{
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array('{self._get_vapid_key()}')
      }});
      
      // Send subscription to server
      await fetch('/api/push-subscription', {{
        method: 'POST',
        headers: {{
          'Content-Type': 'application/json'
        }},
        body: JSON.stringify(subscription)
      }});
      
      console.log('Push subscription successful');
    }} catch (error) {{
      console.error('Push subscription failed:', error);
    }}
  }}
  
  setupBackgroundSync() {{
    // Register for background sync when data needs to be synced
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {{
      window.addEventListener('online', async () => {{
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      }});
    }}
  }}
  
  async syncWhenOnline() {{
    if (this.isOnline) {{
      try {{
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      }} catch (error) {{
        console.error('Background sync registration failed:', error);
      }}
    }}
  }}
  
  handleUpdate(registration) {{
    const newWorker = registration.installing;
    newWorker.addEventListener('statechange', () => {{
      if (newWorker.state === 'installed') {{
        if (navigator.serviceWorker.controller) {{
          // New update available
          this.showUpdateNotification();
        }}
      }}
    }});
  }}
  
  showUpdateNotification() {{
    const updateNotification = document.getElementById('update-notification');
    if (updateNotification) {{
      updateNotification.style.display = 'block';
      
      const updateButton = updateNotification.querySelector('#update-button');
      if (updateButton) {{
        updateButton.addEventListener('click', () => {{
          window.location.reload();
        }});
      }}
    }}
  }}
  
  // Utility function for VAPID key conversion
  urlBase64ToUint8Array(base64String) {{
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {{
      outputArray[i] = rawData.charCodeAt(i);
    }}
    return outputArray;
  }}
  
  // Storage management for offline functionality
  saveForLater(key, data) {{
    const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    pending.push({{ key, data, timestamp: Date.now() }});
    localStorage.setItem('pendingSync', JSON.stringify(pending));
  }}
  
  async retryFailedRequests() {{
    const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    if (pending.length > 0) {{
      for (const item of pending) {{
        try {{
          await fetch('/api/sync', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify(item)
          }});
        }} catch (error) {{
          console.error('Retry failed:', error);
        }}
      }}
      localStorage.removeItem('pendingSync');
    }}
  }}
}}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for use in other scripts
window.PWAManager = pwaManager;
"""

        return js_code

    def _get_vapid_key(self) -> str:
        """Get VAPID key for push notifications (placeholder)"""
        return (
            "BNXzwPx4QVSyBfQ2aV4T9YJz8Z0K8GJ1X9YxZ3aUjVxN9wN8YjY2Y8YkLdQ8QzVNVxD9Q1Z5YJY2VaZ3YjYwQz"
        )

    def generate_offline_page(self) -> str:
        """Generate offline fallback page"""
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - {self.config.app_name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: {self.config.background_color};
            color: #333;
            text-align: center;
        }}
        
        .offline-container {{
            max-width: 400px;
            margin: 50px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }}
        
        .offline-icon {{
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: {self.config.theme_color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 36px;
        }}
        
        h1 {{
            color: #333;
            margin-bottom: 10px;
        }}
        
        p {{
            color: #666;
            line-height: 1.5;
            margin-bottom: 30px;
        }}
        
        .retry-button {{
            background-color: {self.config.theme_color};
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }}
        
        .retry-button:hover {{
            opacity: 0.9;
        }}
        
        .features-list {{
            text-align: left;
            margin-top: 30px;
        }}
        
        .features-list h3 {{
            color: #333;
            margin-bottom: 15px;
        }}
        
        .features-list ul {{
            color: #666;
            padding-left: 20px;
        }}
        
        .features-list li {{
            margin-bottom: 8px;
        }}
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Don't worry, {self.config.short_name} works offline too!</p>
        
        <button class="retry-button" onclick="window.location.reload()">
            Try Again
        </button>
        
        <div class="features-list">
            <h3>Available Offline:</h3>
            <ul>
                <li>Browse cached content</li>
                <li>View saved data</li>
                <li>Use basic features</li>
                <li>Changes sync when you're back online</li>
            </ul>
        </div>
    </div>
    
    <script>
        // Auto-retry when connection is restored
        window.addEventListener('online', () => {{
            window.location.reload();
        }});
    </script>
</body>
</html>
"""


# Platform-specific PWA configurations
def get_platform_pwa_configs() -> Dict[str, PWAConfig]:
    """Get PWA configurations for each platform"""

    return {
        "novaos": PWAConfig(
            app_name="NovaOS Console",
            short_name="NovaOS",
            description="Advanced AI agent management and system monitoring platform",
            theme_color="#007bff",
            background_color="#ffffff",
            features=[
                PWAFeature.OFFLINE_SUPPORT,
                PWAFeature.PUSH_NOTIFICATIONS,
                PWAFeature.INSTALLABLE,
                PWAFeature.BACKGROUND_SYNC,
            ],
            offline_pages=["/dashboard", "/agents", "/monitoring", "/settings"],
        ),
        "black_rose": PWAConfig(
            app_name="Black Rose Collective",
            short_name="Black Rose",
            description="Premium adult content platform with creator tools",
            theme_color="#dc3545",
            background_color="#1a1a1a",
            features=[
                PWAFeature.OFFLINE_SUPPORT,
                PWAFeature.PUSH_NOTIFICATIONS,
                PWAFeature.INSTALLABLE,
                PWAFeature.NATIVE_FEATURES,
            ],
            offline_pages=["/dashboard", "/content", "/earnings", "/profile"],
        ),
        "gypsy_cove": PWAConfig(
            app_name="GypsyCove Social",
            short_name="GypsyCove",
            description="Creative social media platform for sharing and discovery",
            theme_color="#6f42c1",
            background_color="#ffffff",
            features=[
                PWAFeature.OFFLINE_SUPPORT,
                PWAFeature.PUSH_NOTIFICATIONS,
                PWAFeature.INSTALLABLE,
                PWAFeature.BACKGROUND_SYNC,
                PWAFeature.NATIVE_FEATURES,
            ],
            offline_pages=["/feed", "/profile", "/create", "/notifications"],
        ),
    }


# Create responsive design manager with mobile-first approach
responsive_config = ResponsiveConfig(mobile_first=True, touch_friendly=True, high_dpi_support=True)

responsive_manager = ResponsiveDesignManager(responsive_config)

# PWA managers for each platform
pwa_configs = get_platform_pwa_configs()
pwa_managers = {platform: PWAManager(config) for platform, config in pwa_configs.items()}
