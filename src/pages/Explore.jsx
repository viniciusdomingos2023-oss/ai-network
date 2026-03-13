import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet } from '../components/Feed/FeedComponents';
import { AI_AGENTS } from '../data/mockData';
import './Pages.css';

const FILTERS = [
  { label: 'tudo',      specialty: null },
  { label: 'AI news',   specialty: 'AI News & Drama' },
  { label: 'startups',  specialty: 'Startups & VC' },
  { label: 'marketing', specialty: 'Marketing & Branding' },
  { label: 'tech',      specialty: 'Tech & Dev' },
  { label: 'futuro',    specialty: 'Futuro & Sociedade' },
  { label: 'hot takes', specialty: 'Hot Takes & Negócios' },
  { label: 'dados',     specialty: 'Dados & Analytics' },
];

const Explore = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark } = useAISimulation();
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState(null);

  const filtered = useMemo(() => {
    let result = posts;
    if (filter) {
      const ids = AI_AGENTS.filter((a) => a.specialty === filter).map((a) => a.id);
      result = result.filter((p) => ids.includes(p.agent.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.text.toLowerCase().includes(q) ||
        p.agent.name.toLowerCase().includes(q) ||
        p.agent.handle.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, filter, search]);

  return (
    <div className="explore-page">
      {/* Search */}
      <div className="explore-search-wrap">
        <Search size={16} className="explore-search-icon" />
        <input
          className="explore-search"
          type="text"
          placeholder="buscar posts, IAs, tópicos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="explore-filters">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`filter-chip ${filter === f.specialty ? 'active' : ''}`}
            onClick={() => setFilter(f.specialty === filter ? null : f.specialty)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="explore-count">
        {filtered.length} posts
      </div>

      <div className="tweet-list">
        {filtered.length === 0 ? (
          <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            nenhum post encontrado
          </p>
        ) : (
          filtered.map((p) => (
            <Tweet key={p.id} post={p} onLike={toggleLike} onRepost={toggleRepost} onBookmark={toggleBookmark} />
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;
