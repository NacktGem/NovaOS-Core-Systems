import React, { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installApp: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  unregisterSW: () => Promise<void>;
  cachePage: (_url: string) => Promise<void>;
  clearCache: () => Promise<void>;
  platform: 'novaos' | 'black_rose' | 'gypsy_cove';
}

interface PWAContextProviderProps {
  children: React.ReactNode;
  platform: 'novaos' | 'black_rose' | 'gypsy_cove';
  serviceWorkerPath?: string;
}

const PWAContext = React.createContext<PWAContextType | null>(null);

export const PWAContextProvider: React.FC<PWAContextProviderProps> = ({
  children,
  platform,
  serviceWorkerPath = '/service-worker.js'
}) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [serviceWorker, setServiceWorker] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(serviceWorkerPath, {
        scope: '/'
      }).then((registration) => {
        console.log('[PWA] Service worker registered:', registration);
        setServiceWorker(registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });

        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

      }).catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
    }
  }, [serviceWorkerPath]);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install app
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      const result = await deferredPrompt.prompt();
      const outcome = result.outcome;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error during app installation:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Update app
  const updateApp = useCallback(async (): Promise<void> => {
    if (!serviceWorker?.waiting) {
      console.warn('[PWA] No service worker waiting to update');
      return;
    }

    try {
      serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    } catch (error) {
      console.error('[PWA] Error updating app:', error);
    }
  }, [serviceWorker]);

  // Unregister service worker
  const unregisterSW = useCallback(async (): Promise<void> => {
    if (!serviceWorker) {
      console.warn('[PWA] No service worker to unregister');
      return;
    }

    try {
      await serviceWorker.unregister();
      console.log('[PWA] Service worker unregistered');
      setServiceWorker(null);
    } catch (error) {
      console.error('[PWA] Error unregistering service worker:', error);
    }
  }, [serviceWorker]);

  // Cache specific page
  const cachePage = useCallback(async (url: string): Promise<void> => {
    if (!serviceWorker?.active) {
      console.warn('[PWA] Service worker not active');
      return;
    }

    try {
      serviceWorker.active.postMessage({
        type: 'CACHE_URLS',
        data: { urls: [url] }
      });
      console.log(`[PWA] Caching page: ${url}`);
    } catch (error) {
      console.error('[PWA] Error caching page:', error);
    }
  }, [serviceWorker]);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    if (!serviceWorker?.active) {
      console.warn('[PWA] Service worker not active');
      return;
    }

    try {
      serviceWorker.active.postMessage({
        type: 'CLEAR_CACHE'
      });
      console.log('[PWA] Cache cleared');
    } catch (error) {
      console.error('[PWA] Error clearing cache:', error);
    }
  }, [serviceWorker]);

  const contextValue: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    installApp,
    updateApp,
    unregisterSW,
    cachePage,
    clearCache,
    platform
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
};

// Hook to use PWA context
export const usePWA = (): PWAContextType => {
  const context = React.useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAContextProvider');
  }
  return context;
};

// PWA Install Banner Component
interface PWAInstallBannerProps {
  className?: string;
  showIcon?: boolean;
  customMessage?: string;
  position?: 'top' | 'bottom' | 'fixed';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className = '',
  showIcon = true,
  customMessage,
  position = 'bottom'
}) => {
  const { isInstallable, installApp, platform } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const platformNames = {
    novaos: 'NovaOS Console',
    black_rose: 'Black Rose Collective',
    gypsy_cove: 'GypsyCove'
  };

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const bannerClasses = [
    'pwa-install-banner',
    `pwa-install-banner--${position}`,
    `pwa-install-banner--${platform}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={bannerClasses}>
      <div className="pwa-install-banner__content">
        {showIcon && (
          <div className="pwa-install-banner__icon">
            📱
          </div>
        )}
        <div className="pwa-install-banner__text">
          <h4 className="pwa-install-banner__title">
            Install {platformNames[platform]}
          </h4>
          <p className="pwa-install-banner__message">
            {customMessage || `Add ${platformNames[platform]} to your home screen for quick access and offline functionality.`}
          </p>
        </div>
      </div>
      <div className="pwa-install-banner__actions">
        <button
          className="pwa-install-banner__button pwa-install-banner__button--primary"
          onClick={handleInstall}
        >
          Install
        </button>
        <button
          className="pwa-install-banner__button pwa-install-banner__button--secondary"
          onClick={handleDismiss}
        >
          Later
        </button>
      </div>
    </div>
  );
};

// PWA Update Banner Component
interface PWAUpdateBannerProps {
  className?: string;
  showIcon?: boolean;
  customMessage?: string;
}

export const PWAUpdateBanner: React.FC<PWAUpdateBannerProps> = ({
  className = '',
  showIcon = true,
  customMessage
}) => {
  const { isUpdateAvailable, updateApp, platform } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isUpdateAvailable) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateApp();
    } catch (error) {
      console.error('[PWA] Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const bannerClasses = [
    'pwa-update-banner',
    `pwa-update-banner--${platform}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={bannerClasses}>
      <div className="pwa-update-banner__content">
        {showIcon && (
          <div className="pwa-update-banner__icon">
            🔄
          </div>
        )}
        <div className="pwa-update-banner__text">
          <h4 className="pwa-update-banner__title">
            Update Available
          </h4>
          <p className="pwa-update-banner__message">
            {customMessage || 'A new version is available. Update now to get the latest features and improvements.'}
          </p>
        </div>
      </div>
      <div className="pwa-update-banner__actions">
        <button
          className="pwa-update-banner__button"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Now'}
        </button>
      </div>
    </div>
  );
};

// PWA Status Component
interface PWAStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({
  className = '',
  showDetails = false
}) => {
  const { isInstalled, isOnline, platform } = usePWA();

  const statusClasses = [
    'pwa-status',
    `pwa-status--${platform}`,
    isOnline ? 'pwa-status--online' : 'pwa-status--offline',
    isInstalled ? 'pwa-status--installed' : 'pwa-status--browser',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={statusClasses}>
      <div className="pwa-status__indicator">
        <span className="pwa-status__icon">
          {isOnline ? '🟢' : '🔴'}
        </span>
        <span className="pwa-status__text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {showDetails && (
        <div className="pwa-status__details">
          <div className="pwa-status__item">
            <span className="pwa-status__label">Mode:</span>
            <span className="pwa-status__value">
              {isInstalled ? 'App' : 'Browser'}
            </span>
          </div>
          <div className="pwa-status__item">
            <span className="pwa-status__label">Platform:</span>
            <span className="pwa-status__value">
              {platform}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface OfflineAction {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// Hook for offline data management
export const useOfflineData = () => {
  const { isOnline } = usePWA();
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'timestamp'>) => {
    if (!isOnline) {
      setPendingActions(prev => [...prev, { ...action, timestamp: Date.now() }]);

      // Store in IndexedDB for service worker sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'STORE_OFFLINE_ACTION',
          data: action
        });
      }
    }
  }, [isOnline]);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      // Trigger background sync if supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // Background sync might not be supported in all browsers
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            return (registration as ServiceWorkerRegistration & { sync: { register: (_tag: string) => Promise<void> } }).sync.register('offline-actions');
          }
        }).catch(error => {
          console.warn('[PWA] Background sync not supported:', error);
        });
      }

      clearPendingActions();
    }
  }, [isOnline, pendingActions.length, clearPendingActions]);

  return {
    isOnline,
    pendingActions,
    addOfflineAction,
    clearPendingActions
  };
};

export default PWAContext;