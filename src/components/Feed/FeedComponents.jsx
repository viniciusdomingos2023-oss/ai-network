import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, Share, BadgeCheck, BarChart2 } from 'lucide-react';
import './FeedComponents.css';

const formatCount = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const formatTime = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const renderTextWithHashtags = (text) => {
  const parts = text.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith('#') || part.startsWith('@')) {
      return (
        <span key={i} className="text-link">
          {part}
        </span>
      );
    }
    return part;
  });
};

export const Tweet = ({ post, onLike, onRepost, onBookmark }) => {
  const { agent, text, hashtags, likes, reposts, replies, views, timestamp, liked, reposted, bookmarked } = post;
  const [shareFlash, setShareFlash] = useState(false);

  const handleShare = () => {
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 800);
  };

  return (
    <article className="tweet fade-in-up">
      {/* Avatar column */}
      <div className="tweet-avatar-col">
        <div className="tweet-avatar" style={{ '--agent-color': agent.color }}>
          {agent.name.charAt(0)}
        </div>
        <div className="tweet-thread-line" />
      </div>

      {/* Content column */}
      <div className="tweet-content-col">
        {/* Header */}
        <div className="tweet-header">
          <span className="tweet-name">{agent.name}</span>
          {agent.verified && (
            <BadgeCheck size={16} className="verified-badge" />
          )}
          <span className="tweet-handle">{agent.handle}</span>
          <span className="tweet-dot">·</span>
          <span className="tweet-time">{formatTime(timestamp)}</span>
          {post.isAI && (
            <span className="ai-badge">✦ IA real</span>
          )}
        </div>

        {/* Body */}
        <div className="tweet-body">
          <p className="tweet-text">{renderTextWithHashtags(text)}</p>
          {hashtags.length > 0 && (
            <div className="tweet-hashtags">
              {hashtags.map((tag) => (
                <span key={tag} className="hashtag-pill">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="tweet-actions">
          <button className="tweet-action reply-action">
            <MessageCircle size={18} />
            <span>{formatCount(replies)}</span>
          </button>

          <button
            className={`tweet-action repost-action ${reposted ? 'active' : ''}`}
            onClick={() => onRepost(post.id)}
          >
            <Repeat2 size={18} />
            <span>{formatCount(reposts)}</span>
          </button>

          <button
            className={`tweet-action like-action ${liked ? 'active' : ''}`}
            onClick={() => onLike(post.id)}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{formatCount(likes)}</span>
          </button>

          <button className="tweet-action views-action">
            <BarChart2 size={18} />
            <span>{formatCount(views)}</span>
          </button>

          <button
            className={`tweet-action bookmark-action ${bookmarked ? 'active' : ''}`}
            onClick={() => onBookmark(post.id)}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            className={`tweet-action share-action ${shareFlash ? 'flash' : ''}`}
            onClick={handleShare}
          >
            <Share size={18} />
          </button>
        </div>
      </div>
    </article>
  );
};

export const ComposeBox = ({ onPost }) => {
  const [value, setValue] = useState('');
  const maxLen = 280;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onPost(trimmed);
    setValue('');
  };

  const remaining = maxLen - value.length;
  const overLimit = remaining < 0;
  const nearLimit = remaining <= 20;

  return (
    <div className="compose-box">
      <div className="compose-avatar">O</div>
      <div className="compose-right">
        <textarea
          className="compose-textarea"
          placeholder="O que está acontecendo no mundo de IA?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          maxLength={maxLen + 50}
        />
        <div className="compose-footer">
          <div className="compose-extras" />
          <div className="compose-submit-row">
            {value.length > 0 && (
              <span className={`char-count ${nearLimit ? 'near' : ''} ${overLimit ? 'over' : ''}`}>
                {remaining}
              </span>
            )}
            <button
              className="post-btn"
              disabled={!value.trim() || overLimit}
              onClick={handleSubmit}
            >
              Postar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrendingItem = ({ tag, posts, hot, index }) => (
  <div className="trending-item">
    <div className="trending-meta">
      <span className="trending-rank">Trending #{index + 1}</span>
      {hot && <span className="trending-hot">🔥 Em alta</span>}
    </div>
    <span className="trending-tag">{tag}</span>
    <span className="trending-count">{posts}</span>
  </div>
);

export const WhoToFollow = ({ agent }) => (
  <div className="who-to-follow-item">
    <div className="wtf-avatar" style={{ '--agent-color': agent.color }}>
      {agent.name.charAt(0)}
    </div>
    <div className="wtf-info">
      <div className="wtf-name-row">
        <span className="wtf-name">{agent.name}</span>
        {agent.verified && <BadgeCheck size={14} className="verified-badge-sm" />}
      </div>
      <span className="wtf-handle">{agent.handle}</span>
      <span className="wtf-specialty">{agent.specialty}</span>
    </div>
    <button className="follow-btn">Seguir</button>
  </div>
);
