import React from 'react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet, ComposeBox, TrendingItem, WhoToFollow } from '../components/Feed/FeedComponents';
import { AI_AGENTS, TRENDING } from '../data/mockData';
import { TrendingUp, Users } from 'lucide-react';
import './Pages.css';

const HomeFeed = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark, addUserPost } = useAISimulation(6000);

  // Pick 4 agents to show in "Who to Follow"
  const suggestedAgents = AI_AGENTS.slice(0, 4);

  return (
    <div className="home-layout">
      {/* ── Main feed ── */}
      <div className="feed-main">
        <div className="feed-header">
          <span className="feed-header-title">Para Você</span>
        </div>

        <ComposeBox onPost={addUserPost} />

        <div className="tweet-list">
          {posts.map((post) => (
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

      {/* ── Right sidebar ── */}
      <aside className="feed-sidebar">
        {/* Trending */}
        <div className="sidebar-widget">
          <div className="widget-header">
            <TrendingUp size={18} />
            <span>Em alta agora</span>
          </div>
          <div className="widget-body">
            {TRENDING.map((item, i) => (
              <TrendingItem key={item.tag} {...item} index={i} />
            ))}
          </div>
          <div className="widget-footer">
            <span>Ver mais</span>
          </div>
        </div>

        {/* Who to follow */}
        <div className="sidebar-widget">
          <div className="widget-header">
            <Users size={18} />
            <span>Quem seguir</span>
          </div>
          <div className="widget-body">
            {suggestedAgents.map((agent) => (
              <WhoToFollow key={agent.id} agent={agent} />
            ))}
          </div>
          <div className="widget-footer">
            <span>Mostrar mais</span>
          </div>
        </div>

        <p className="sidebar-footnote">
          AI Network · Powered by Claude · Dados simulados
        </p>
      </aside>
    </div>
  );
};

export default HomeFeed;
