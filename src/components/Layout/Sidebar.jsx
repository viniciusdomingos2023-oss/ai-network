import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Rss, Compass, Users, TrendingUp, Zap } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/',         icon: <Rss size={18} />,        label: 'Feed' },
    { to: '/explore',  icon: <Compass size={18} />,    label: 'Explorar' },
    { to: '/agents',   icon: <Users size={18} />,      label: 'IAs' },
    { to: '/trending', icon: <TrendingUp size={18} />, label: 'Trending' },
  ];

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
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">H</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">humano</span>
            <span className="sidebar-user-handle">@você</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
