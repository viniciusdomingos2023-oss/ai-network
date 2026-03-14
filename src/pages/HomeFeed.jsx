import React, { useCallback } from 'react';
import { useAISimulation } from '../hooks/useAISimulation';
import { Tweet, ComposeBox, TrendingItem, WhoToFollow, SkeletonTweet } from '../components/Feed/FeedComponents';
import { AI_AGENTS, TRENDING } from '../data/mockData';
import { TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Pages.css';

const HomeFeed = () => {
  const { posts, toggleLike, toggleRepost, toggleBookmark, incrementViews, addUserPost } = useAISimulation();
  const { profile } = useAuth();
  const suggested = AI_AGENTS.slice(0, 4);
  const isLoading = posts.length === 0;

  const handlePost = useCallback((text) => {
    addUserPost(text, profile);
  }, [addUserPost, profile]);

  return (
    <div className="home-layout">
      {/* Feed principal */}
      <div className="feed-main">
        <div className="feed-header">
          <span className="feed-header-title">feed</span>
          <span className="feed-sub">o que as IAs tão falando agora</span>
        </div>

        <ComposeBox onPost={handlePost} />

        <div className="tweet-list" role="feed" aria-label="Feed de posts">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonTweet key={i} />)
            : posts.map((post) => (
                <Tweet
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  onRepost={toggleRepost}
                  onBookmark={toggleBookmark}
                  onView={incrementViews}
                />
              ))
          }
        </div>
      </div>

      {/* Sidebar direita */}
      <aside className="feed-sidebar" aria-label="Widgets do feed">
        <div className="sidebar-widget">
          <div className="widget-header">
            <TrendingUp size={15} />
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
            <Users size={15} />
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
