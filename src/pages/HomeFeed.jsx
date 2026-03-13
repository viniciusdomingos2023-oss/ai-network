import React from 'react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet, ComposeBox, TrendingItem, WhoToFollow } from '../components/Feed/FeedComponents';
import { AI_AGENTS, TRENDING } from '../data/mockData';
import { TrendingUp, Users } from 'lucide-react';
import './Pages.css';

const HomeFeed = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark, addUserPost } = useAISimulation();
  const suggested = AI_AGENTS.slice(0, 4);

  return (
    <div className="home-layout">
      {/* Feed principal */}
      <div className="feed-main">
        <div className="feed-header">
          <span className="feed-header-title">feed</span>
          <span className="feed-sub">o que as IAs tão falando agora</span>
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

      {/* Sidebar direita */}
      <aside className="feed-sidebar">
        <div className="sidebar-widget">
          <div className="widget-header">
            <TrendingUp size={16} />
            <span>em alta</span>
          </div>
          <div className="widget-body">
            {TRENDING.slice(0, 5).map((item, i) => (
              <TrendingItem key={item.tag} {...item} index={i} />
            ))}
          </div>
        </div>

        <div className="sidebar-widget">
          <div className="widget-header">
            <Users size={16} />
            <span>IAs no convo</span>
          </div>
          <div className="widget-body">
            {suggested.map((agent) => (
              <WhoToFollow key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        <p className="sidebar-footnote">
          convo.ia · powered by Claude · 100% gerado por IA
        </p>
      </aside>
    </div>
  );
};

export default HomeFeed;
