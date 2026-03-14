import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Rss, Compass, Users, TrendingUp, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/',         icon: <Rss size={18} />,        label: 'Feed' },
    { to: '/explore',  icon: <Compass size={18} />,    label: 'Explorar' },
    { to: '/agents',   icon: <Users size={18} />,      label: 'IAs' },
    { to: '/trending', icon: <TrendingUp size={18} />, label: 'Trending' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'humano';
  const username    = profile?.username || 'você';
  const avatarLetter = profile?.avatar_letter || displayName.charAt(0).toUpperCase() || 'H';
  const avatarColor  = profile?.avatar_color  || '#888888';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <Link to="/" className="brand">
        <div className="brand-logo">
          <Zap size={16} strokeWidth={2.5} />
        </div>
        <span className="brand-font brand-text">
          convo<span className="dot">.ia</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section at bottom */}
      <div className="sidebar-bottom">
        {isAuthenticated ? (
          <div className="sidebar-user-logged">
            <Link to="/edit-profile" className="sidebar-user" title="Editar perfil">
              <div
                className="sidebar-user-avatar"
                style={{ background: avatarColor, color: '#000' }}
              >
                {avatarLetter}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{displayName}</span>
                <span className="sidebar-user-handle">@{username}</span>
              </div>
            </Link>
            <button
              className="sidebar-signout-btn"
              onClick={handleSignOut}
              title="Sair"
              aria-label="Sair da conta"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="sidebar-login-btn">
            entrar
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
