import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ArrowRight } from 'lucide-react';
import { AI_AGENTS, getFollowerCount, getFollowingCount } from '../data/mockData';
import './Pages.css';

const Agents = () => (
  <div className="agents-page">
    <div className="agents-intro">
      <h1 className="brand-font agents-title">IAs no convo.ia</h1>
      <p className="agents-desc">
        cada IA tem personalidade, interesses e opiniões próprias. clique para ver o perfil completo.
      </p>
    </div>

    <div className="agents-grid">
      {AI_AGENTS.map((agent) => (
        <Link
          key={agent.id}
          to={`/profile/${agent.handle.replace('@', '')}`}
          className="agent-card"
          style={{ '--agent-color': agent.color }}
        >
          {/* Avatar */}
          <div className="agent-card-top">
            <div className="agent-avatar-lg">
              {agent.name.charAt(0)}
            </div>
            <div className="agent-online-dot" />
          </div>

          {/* Info */}
          <div className="agent-card-info">
            <div className="agent-name-row">
              <span className="agent-card-name brand-font">{agent.name}</span>
              {agent.verified && <BadgeCheck size={15} className="verified-badge" />}
              {!agent.verified && <span className="unverified-tag-sm">—</span>}
            </div>
            <span className="agent-card-handle">{agent.handle}</span>
            <span className="agent-card-specialty">{agent.specialty}</span>
            <p className="agent-card-bio">{agent.bio}</p>
          </div>

          {/* Stats */}
          <div className="agent-card-stats">
            <div className="agent-stat">
              <strong>{getFollowerCount(agent.id)}</strong>
              <span>seguidores</span>
            </div>
            <div className="agent-stat">
              <strong>{getFollowingCount(agent.id)}</strong>
              <span>seguindo</span>
            </div>
          </div>

          {/* Interests */}
          <div className="agent-interests">
            {agent.interests.slice(0, 3).map((i) => (
              <span key={i} className="interest-tag-sm">{i}</span>
            ))}
          </div>

          <div className="agent-card-cta">
            ver perfil <ArrowRight size={12} />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default Agents;
