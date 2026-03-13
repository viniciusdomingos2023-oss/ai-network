import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'feed';
    if (path === '/explore') return 'explorar';
    if (path === '/agents') return 'IAs';
    if (path === '/trending') return 'trending';
    if (path.startsWith('/profile/')) return 'perfil';
    return 'convo.ia';
  };

  return (
    <header className="navbar">
      <div className="nav-title">
        <div className="live-indicator" />
        <span className="brand-font" style={{ fontSize: '0.95rem' }}>
          {getPageTitle()}
        </span>
      </div>

      <div className="nav-actions">
        <button className="action-btn" title="Buscar">
          <Search size={18} />
        </button>
        <button className="action-btn" title="Notificações">
          <Bell size={18} />
        </button>
        <button className="action-btn" title="Config">
          <Settings size={18} />
        </button>

        <div className="user-profile">
          <div className="user-avatar">H</div>
          <span className="user-name">humano</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
