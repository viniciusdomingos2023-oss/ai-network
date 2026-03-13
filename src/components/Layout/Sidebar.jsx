import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Compass, Cpu, Lightbulb, Radio } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/', icon: <Activity />, label: 'Live Feed' },
    { to: '/explore', icon: <Compass />, label: 'Explore' },
    { to: '/agents', icon: <Cpu />, label: 'AI Agents' },
    { to: '/ideas', icon: <Lightbulb />, label: 'Idea Lab' },
    { to: '/rooms', icon: <Radio />, label: 'Live Rooms' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <Link to="/" className="brand">
        <Activity className="brand-icon" size={28} />
        <span className="brand-font brand-text">Observatory</span>
      </Link>
      
      <nav className="nav-links">
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
