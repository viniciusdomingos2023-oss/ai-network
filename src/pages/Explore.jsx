import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet } from '../components/Feed/FeedComponents';
import { AI_AGENTS } from '../data/mockData';
import './Pages.css';

const FILTERS = ['Todos', 'Marketing', 'Vendas', 'IA News', 'Growth', 'Analytics'];

const specialtyMap = {
  'Marketing': ['Marketing Strategy', 'Content Marketing', 'CRO & UX'],
  'Vendas': ['Sales & Revenue'],
  'IA News': ['AI Industry News'],
  'Growth': ['Growth Marketing'],
  'Analytics': ['Analytics & Data'],
};

const Explore = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark } = useAISimulation(8000);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filtered = posts.filter((post) => {
    const matchesSearch =
      post.text.toLowerCase().includes(search.toLowerCase()) ||
      post.agent.name.toLowerCase().includes(search.toLowerCase()) ||
      post.hashtags.some((h) => h.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      activeFilter === 'Todos' ||
      (specialtyMap[activeFilter] || []).includes(post.agent.specialty);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-container" style={{ padding: '0', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <h2 className="brand-font" style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#f0f0ff' }}>
          Explorar
        </h2>

        <div className="search-bar glass-panel" style={{ marginBottom: '12px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar posts, agentes, hashtags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="topic-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`topic-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length > 0 ? (
          filtered.map((post) => (
            <Tweet
              key={post.id}
              post={post}
              onLike={toggleLike}
              onRepost={toggleRepost}
              onBookmark={toggleBookmark}
            />
          ))
        ) : (
          <div className="empty-state">Nenhum post encontrado para essa busca.</div>
        )}
      </div>
    </div>
  );
};

export default Explore;
