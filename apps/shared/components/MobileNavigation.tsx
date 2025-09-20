import React, { useState, useEffect, useRef } from 'react';
import './MobileNavigation.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  platform?: 'novaos' | 'black_rose' | 'gypsy_cove';
}

interface MobileNavigationProps {
  platform: 'novaos' | 'black_rose' | 'gypsy_cove';
  currentPath: string;
  onNavigate: (_path: string) => void;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  platform,
  currentPath,
  onNavigate,
  user
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Platform-specific navigation items
  const getNavigationItems = (): NavigationItem[] => {
    switch (platform) {
      case 'novaos':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
          { id: 'agents', label: 'Agents', icon: '🤖', path: '/agents' },
          { id: 'monitoring', label: 'Monitor', icon: '📈', path: '/monitoring' },
          { id: 'analytics', label: 'Analytics', icon: '📋', path: '/analytics' },
          { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
        ];

      case 'black_rose':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: '🌹', path: '/dashboard' },
          { id: 'content', label: 'Content', icon: '📸', path: '/content' },
          { id: 'earnings', label: 'Earnings', icon: '💰', path: '/earnings' },
          { id: 'subscribers', label: 'Fans', icon: '👥', path: '/subscribers' },
          { id: 'messages', label: 'Messages', icon: '💬', path: '/messages', badge: 3 },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
        ];

      case 'gypsy_cove':
        return [
          { id: 'feed', label: 'Feed', icon: '🏠', path: '/feed' },
          { id: 'explore', label: 'Explore', icon: '🔍', path: '/explore' },
          { id: 'create', label: 'Create', icon: '➕', path: '/create' },
          { id: 'notifications', label: 'Notifications', icon: '🔔', path: '/notifications', badge: 5 },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  // Handle touch gestures for menu
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && isMenuOpen) {
      setIsMenuOpen(false);
    } else if (isRightSwipe && !isMenuOpen) {
      setIsMenuOpen(true);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handle navigation
  const handleItemClick = (path: string) => {
    onNavigate(path);
    setIsMenuOpen(false);
  };

  // Get platform-specific styles
  const getPlatformClass = () => {
    return `mobile-nav--${platform}`;
  };

  return (
    <nav className={`mobile-nav ${getPlatformClass()}`}>
      {/* Top Navigation Bar */}
      <div className="mobile-nav__header">
        <div className="mobile-nav__brand">
          <button
            className="mobile-nav__toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={`hamburger ${isMenuOpen ? 'hamburger--active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className="mobile-nav__logo">
            {platform === 'novaos' && (
              <div className="logo logo--novaos">
                <span className="logo__icon">🚀</span>
                <span className="logo__text">NovaOS</span>
              </div>
            )}
            {platform === 'black_rose' && (
              <div className="logo logo--black-rose">
                <span className="logo__icon">🌹</span>
                <span className="logo__text">Black Rose</span>
              </div>
            )}
            {platform === 'gypsy_cove' && (
              <div className="logo logo--gypsy-cove">
                <span className="logo__icon">🏴‍☠️</span>
                <span className="logo__text">GypsyCove</span>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Preview */}
        {user && (
          <div className="mobile-nav__user">
            <div className="user-preview">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="user-preview__avatar"
                />
              ) : (
                <div className="user-preview__avatar user-preview__avatar--placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="user-preview__name">{user.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        className={`mobile-nav__menu ${isMenuOpen ? 'mobile-nav__menu--open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mobile-nav__menu-content">
          {/* User Profile Section */}
          {user && (
            <div className="mobile-nav__profile">
              <div className="user-profile">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="user-profile__avatar"
                  />
                ) : (
                  <div className="user-profile__avatar user-profile__avatar--placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-profile__info">
                  <h3 className="user-profile__name">{user.name}</h3>
                  <p className="user-profile__role">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <ul className="mobile-nav__list">
            {navigationItems.map((item) => (
              <li key={item.id} className="mobile-nav__item">
                <button
                  className={`mobile-nav__link ${currentPath === item.path ? 'mobile-nav__link--active' : ''
                    }`}
                  onClick={() => handleItemClick(item.path)}
                >
                  <span className="mobile-nav__icon">{item.icon}</span>
                  <span className="mobile-nav__label">{item.label}</span>
                  {item.badge && (
                    <span className="mobile-nav__badge">{item.badge}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Platform-specific Quick Actions */}
          <div className="mobile-nav__actions">
            {platform === 'novaos' && (
              <div className="quick-actions">
                <button className="quick-action" onClick={() => handleItemClick('/agents/create')}>
                  <span className="quick-action__icon">➕</span>
                  <span className="quick-action__label">New Agent</span>
                </button>
                <button className="quick-action" onClick={() => handleItemClick('/monitoring/alerts')}>
                  <span className="quick-action__icon">🚨</span>
                  <span className="quick-action__label">Alerts</span>
                </button>
              </div>
            )}

            {platform === 'black_rose' && (
              <div className="quick-actions">
                <button className="quick-action" onClick={() => handleItemClick('/content/upload')}>
                  <span className="quick-action__icon">📤</span>
                  <span className="quick-action__label">Upload</span>
                </button>
                <button className="quick-action" onClick={() => handleItemClick('/live/start')}>
                  <span className="quick-action__icon">📺</span>
                  <span className="quick-action__label">Go Live</span>
                </button>
              </div>
            )}

            {platform === 'gypsy_cove' && (
              <div className="quick-actions">
                <button className="quick-action" onClick={() => handleItemClick('/create/post')}>
                  <span className="quick-action__icon">✏️</span>
                  <span className="quick-action__label">New Post</span>
                </button>
                <button className="quick-action" onClick={() => handleItemClick('/create/story')}>
                  <span className="quick-action__icon">📖</span>
                  <span className="quick-action__label">Story</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mobile-nav__footer">
            <button
              className="mobile-nav__footer-link"
              onClick={() => handleItemClick('/settings')}
            >
              <span className="mobile-nav__icon">⚙️</span>
              <span className="mobile-nav__label">Settings</span>
            </button>
            <button
              className="mobile-nav__footer-link mobile-nav__footer-link--logout"
              onClick={() => {/* Handle logout */ }}
            >
              <span className="mobile-nav__icon">🚪</span>
              <span className="mobile-nav__label">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          className="mobile-nav__overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Bottom Tab Navigation (for smaller screens) */}
      <div className="mobile-nav__bottom-tabs">
        {navigationItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            className={`bottom-tab ${currentPath === item.path ? 'bottom-tab--active' : ''
              }`}
            onClick={() => handleItemClick(item.path)}
          >
            <span className="bottom-tab__icon">{item.icon}</span>
            {item.badge && (
              <span className="bottom-tab__badge">{item.badge}</span>
            )}
            <span className="bottom-tab__label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;