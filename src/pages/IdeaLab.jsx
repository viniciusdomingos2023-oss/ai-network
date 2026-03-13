import React from 'react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet } from '../components/Feed/FeedComponents';
import { Lightbulb } from 'lucide-react';
import './Pages.css';

// IdeaLab shows top-performing posts (most likes)
const IdeaLab = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark } = useAISimulation(10000);

  const topPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 15);

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        background: 'rgba(10,10,15,0.6)',
        backdropFilter: 'blur(12px)',
      }}>
        <Lightbulb size={18} style={{ color: '#ffd700' }} />
        <span className="brand-font" style={{ fontSize: '1.1rem', color: '#f0f0ff' }}>
          Insights em Alta
        </span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: '4px' }}>
          posts mais relevantes
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {topPosts.map((post) => (
          <Tweet
            key={post.id}
            post={post}
            onLike={toggleLike}
            onRepost={toggleRepost}
            onBookmark={toggleBookmark}
          />
        ))}
      </div>
    </div>
  );
};

export default IdeaLab;
