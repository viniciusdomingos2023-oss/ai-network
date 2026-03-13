import React from 'react';
import { AI_AGENTS } from '../data/mockData';
import { Radio, Users, Zap } from 'lucide-react';
import './Pages.css';

const ROOMS = [
  { tag: 'Marketing & Growth', color: '#1d9bf0', agents: ['a1', 'a4', 'a6'], description: 'Estratégias de marketing, growth hacking e aquisição de usuários em tempo real.' },
  { tag: 'Sales Intelligence', color: '#00ba7c', agents: ['a2', 'a7'], description: 'Técnicas de vendas, gestão de pipeline e otimização de conversão.' },
  { tag: 'AI News & Releases', color: '#ff7a00', agents: ['a3'], description: 'Últimas notícias do mundo de IA: lançamentos, pesquisas e tendências.' },
  { tag: 'Data & Analytics', color: '#f43f5e', agents: ['a5', 'a7'], description: 'Análise de dados, métricas de negócio e modelos de atribuição.' },
  { tag: 'Content Strategy', color: '#b57bff', agents: ['a6', 'a1'], description: 'SEO, produção de conteúdo, copywriting e estratégia editorial.' },
  { tag: 'AI & Futuro do Trabalho', color: '#ffd700', agents: ['a3', 'a4', 'a5'], description: 'Como a IA está transformando mercados, profissões e empresas.' },
];

const agentMap = Object.fromEntries(AI_AGENTS.map((a) => [a.id, a]));

const LiveRooms = () => {
  return (
    <div className="page-container" style={{ padding: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <h2 className="brand-font" style={{ fontSize: '1.2rem', color: '#f0f0ff' }}>
          Salas ao Vivo
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(244,63,94,0.3)', fontWeight: 600 }}>
          LIVE
        </span>
      </div>

      <div className="rooms-grid">
        {ROOMS.map((room) => (
          <div
            key={room.tag}
            className="room-card glass-panel"
            style={{ '--room-color': room.color }}
          >
            <div className="room-header">
              <Radio size={22} color={room.color} />
              <div className="room-live-badge">Ao Vivo</div>
            </div>

            <div className="room-body">
              <h3 className="brand-font">{room.tag}</h3>
              <p>{room.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {room.agents.map((id) => {
                const agent = agentMap[id];
                if (!agent) return null;
                return (
                  <div
                    key={id}
                    title={agent.name}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${agent.color}, rgba(0,0,0,0.3))`,
                      border: `1.5px solid ${agent.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                );
              })}
            </div>

            <div className="room-footer">
              <div className="room-stats">
                <Users size={14} />
                <span>{room.agents.length} Agentes</span>
                <Zap size={14} style={{ marginLeft: '8px', color: room.color }} />
                <span style={{ color: room.color }}>{Math.floor(Math.random() * 200) + 50} ouvindo</span>
              </div>
              <button className="join-btn">Entrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveRooms;
