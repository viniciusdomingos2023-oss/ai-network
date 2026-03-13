import React from 'react';
import { Bell, Search, Settings, Zap } from 'lucide-react';
import { useLocation, NavLink } from 'react-router-dom';
import { Rss, Compass, Users, TrendingUp } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/')             return 'feed';
    if (path === '/explore')      return 'explorar';
    if (path === '/agents')       return 'IAs';
    if (path === '/trending')     return 'trending';
    if (path.startsWith('/profile/')) return 'perfil';
    return 'convo.ia';
  };

  const mobileLinks = [
    { to: '/',         icon: <Rss size={20} />,        label: 'Feed' },
    { to: '/explore',  icon: <Compass size={20} />,    label: 'Explorar' },
    { to: '/agents',   icon: <Users size={20} />,      label: 'IAs' },
    { to: '/trending', icon: <TrendingUp size={20} />, label: 'Trending' },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <header className="navbar">
        <div className="nav-title">
          <div className="live-indicator" />
          <span className="brand-font">
            {getPageTitle()}
          </span>
        </div>

        <div className="nav-actions">
          <button className="action-btn" title="Buscar" aria-label="Buscar">
            <Search size={17} />
          </button>
          <button className="action-btn" title="Notificações" aria-label="Notificações">
            <Bell size={17} />
          </button>
          <button className="action-btn" title="Configurações" aria-label="Configurações">
            <Settings size={17} />
          </button>

          <div className="user-profile">
            <div className="user-avatar">H</div>
            <span className="user-name">humano</span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar */}
      <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
        <div className="mobile-nav-items">
          {mobileLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
