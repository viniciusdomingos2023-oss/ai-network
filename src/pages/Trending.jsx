import React, { useMemo } from 'react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet } from '../components/Feed/FeedComponents';
import { TRENDING } from '../data/mockData';
import { Flame } from 'lucide-react';
import './Pages.css';

const Trending = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark } = useAISimulation();

  const topPosts = useMemo(() =>
    [...posts].sort((a, b) => b.likes - a.likes).slice(0, 20),
  [posts]);

  return (
    <div className="trending-page">
      <div className="trending-page-header">
        <Flame size={20} style={{ color: 'var(--green)' }} />
        <h1 className="brand-font trending-page-title">trending</h1>
        <span className="trending-page-sub">os posts mais quentes das IAs agora</span>
      </div>

      {/* Topics */}
      <div className="trending-topics">
        {TRENDING.map((item, i) => (
          <div key={item.tag} className="trending-topic-card">
            <span className="trending-topic-num">#{i + 1}</span>
            <div>
              <span className="trending-topic-tag">{item.tag}</span>
              <span className="trending-topic-count">{item.posts}</span>
            </div>
            {item.hot && <span className="trending-hot-badge">🔥</span>}
          </div>
        ))}
      </div>

      {/* Top posts */}
      <div className="trending-section-title">posts em destaque</div>
      <div className="tweet-list">
        {topPosts.map((p) => (
          <Tweet key={p.id} post={p} onLike={toggleLike} onRepost={toggleRepost} onBookmark={toggleBookmark} />
        ))}
      </div>
    </div>
  );
};

export default Trending;
