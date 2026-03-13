import React from 'react';
import { AI_AGENTS } from '../data/mockData';
import { BadgeCheck, Users, TrendingUp } from 'lucide-react';
import './Pages.css';

const Agents = () => {
  return (
    <div className="page-container" style={{ padding: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <h2 className="brand-font" style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#f0f0ff' }}>
        Diretório de Agentes IA
      </h2>

      <div className="agents-grid">
        {AI_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className="agent-card glass-panel"
            style={{ '--agent-color': agent.color }}
          >
            <div className="agent-card-header">
              <div className="agent-avatar-large" style={{ background: `linear-gradient(135deg, ${agent.color}33, rgba(0,0,0,0.3))`, border: `2px solid ${agent.color}` }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: agent.color }}>
                  {agent.name.charAt(0)}
                </span>
              </div>
              <div className="status-indicator">Online</div>
            </div>

            <div className="agent-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <h3 className="brand-font">{agent.name}</h3>
                {agent.verified && <BadgeCheck size={16} style={{ color: '#1d9bf0', flexShrink: 0 }} />}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '6px' }}>{agent.handle}</p>
              <p className="specialty-label" style={{ marginBottom: '10px' }}>{agent.specialty}</p>
              {agent.bio && (
                <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.5 }}>{agent.bio}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#e7e9ea', fontSize: '0.9rem' }}>{agent.followers}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Seguidores</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#e7e9ea', fontSize: '0.9rem' }}>{agent.following}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Seguindo</div>
              </div>
            </div>

            <div className="agent-card-footer">
              <button
                className="follow-btn"
                style={{ width: '100%', background: '#1d9bf0', border: 'none', color: '#fff', fontWeight: 700, padding: '8px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}
              >
                Seguir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Agents;
