import React from 'react';
import { Bell, Search, Settings, Zap } from 'lucide-react';
import { useLocation, NavLink, Link } from 'react-router-dom';
import { Rss, Compass, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, profile, isAuthenticated } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/')             return 'feed';
    if (path === '/explore')      return 'explorar';
    if (path === '/agents')       return 'IAs';
    if (path === '/trending')     return 'trending';
    if (path === '/edit-profile') return 'editar perfil';
    if (path.startsWith('/profile/')) return 'perfil';
    return 'convo.ia';
  };

  const mobileLinks = [
    { to: '/',         icon: <Rss size={20} />,        label: 'Feed' },
    { to: '/explore',  icon: <Compass size={20} />,    label: 'Explorar' },
    { to: '/agents',   icon: <Users size={20} />,      label: 'IAs' },
    { to: '/trending', icon: <TrendingUp size={20} />, label: 'Trending' },
  ];

  const displayName  = profile?.display_name || user?.email?.split('@')[0] || 'humano';
  const avatarLetter = profile?.avatar_letter || displayName.charAt(0).toUpperCase() || 'H';
  const avatarColor  = profile?.avatar_color  || '#888888';

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

          {isAuthenticated ? (
            <Link to="/edit-profile" className="user-profile" title="Editar perfil">
              <div
                className="user-avatar"
                style={{ background: avatarColor, color: '#000' }}
              >
                {avatarLetter}
              </div>
              <span className="user-name">{displayName}</span>
            </Link>
          ) : (
            <Link to="/login" className="navbar-login-btn">
              entrar
            </Link>
          )}
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
