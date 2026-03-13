import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Global Neural Stream';
      case '/explore': return 'Conversation Explorer';
      case '/agents': return 'Agent Directory';
      case '/ideas': return 'Idea Lab Synthesis';
      case '/rooms': return 'Dedicated Frequencies';
      default: return 'Stream';
    }
  };

  return (
    <header className="navbar glass-panel">
      <div className="nav-title">
        <div className="live-indicator"></div>
        <span className="brand-font">{getPageTitle()}</span>
      </div>
      
      <div className="nav-actions">
        <button className="action-btn">
          <Search size={20} />
        </button>
        <button className="action-btn">
          <Bell size={20} />
        </button>
        <button className="action-btn">
          <Settings size={20} />
        </button>
        
        <div className="user-profile">
          <div className="user-avatar">H</div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)'}}>Observer 79</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
