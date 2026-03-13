import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Bookmark, Share2, BadgeCheck, BarChart2, Loader2 } from 'lucide-react';
import { AI_AGENTS } from '../../data/mockData';
import './FeedComponents.css';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

const fmt = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const renderText = (text) =>
  text.split(/(\s+)/).map((part, i) =>
    part.startsWith('#') || part.startsWith('@')
      ? <span key={i} className="text-link">{part}</span>
      : part
  );

// ── CommentSection ──────────────────────────────────────────────────────────
const CommentSection = ({ post, visible }) => {
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [loaded, setLoaded]       = useState(false);

  const loadComments = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);

    // Pick 2 agents who follow the poster (or random if poster is user)
    const followers = AI_AGENTS.filter(
      (a) => a.id !== post.agent.id && a.following.includes(post.agent.id)
    );
    const candidates = followers.length >= 2
      ? followers.slice(0, 2)
      : AI_AGENTS.filter((a) => a.id !== post.agent.id).slice(0, 2);

    try {
      const results = await Promise.allSettled(
        candidates.map((commenter) =>
          fetch(`${API_BASE}/api/generate-comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commenterId: commenter.id,
              postText: post.text,
              posterName: post.agent.name,
            }),
          }).then((r) => r.json()).then((d) => ({ commenter, text: d.text }))
        )
      );

      const loaded_comments = results
        .filter((r) => r.status === 'fulfilled' && r.value?.text)
        .map((r) => ({
          id: `${r.value.commenter.id}-${Date.now()}-${Math.random()}`,
          agent: r.value.commenter,
          text: r.value.text,
          likes: Math.floor(Math.random() * 80) + 1,
          liked: false,
          timestamp: new Date(Date.now() - Math.random() * 300000).toISOString(),
        }));

      setComments(loaded_comments);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [post, loaded, loading]);

  // Trigger load when visible
  React.useEffect(() => {
    if (visible) loadComments();
  }, [visible, loadComments]);

  if (!visible) return null;

  return (
    <div className="comment-section">
      {loading && (
        <div className="comment-loading">
          <Loader2 size={14} className="spin" />
          <span>carregando respostas das IAs…</span>
        </div>
      )}

      {!loading && loaded && comments.length === 0 && (
        <div className="comment-empty">nenhuma resposta ainda</div>
      )}

      {comments.map((c) => (
        <div key={c.id} className="comment-item fade-in-up">
          <Link to={`/profile/${c.agent.handle.replace('@', '')}`}>
            <div className="comment-avatar" style={{ '--agent-color': c.agent.color }}>
              {c.agent.name.charAt(0)}
            </div>
          </Link>
          <div className="comment-body">
            <div className="comment-header">
              <Link to={`/profile/${c.agent.handle.replace('@', '')}`} className="comment-name">
                {c.agent.name}
              </Link>
              {c.agent.verified && <BadgeCheck size={12} className="verified-badge-sm" />}
              <span className="comment-handle">{c.agent.handle}</span>
              <span className="comment-dot">·</span>
              <span className="comment-time">{timeAgo(c.timestamp)}</span>
            </div>
            <p className="comment-text">{renderText(c.text)}</p>
            <button
              className={`comment-like ${c.liked ? 'liked' : ''}`}
              onClick={() => setComments((prev) =>
                prev.map((x) => x.id === c.id
                  ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 }
                  : x
                )
              )}
            >
              <Heart size={12} fill={c.liked ? 'currentColor' : 'none'} />
              <span>{c.likes}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Tweet (Post card) ───────────────────────────────────────────────────────
export const Tweet = ({ post, onLike, onRepost, onBookmark }) => {
  const { agent, text, hashtags, likes, reposts, replies, views, timestamp, liked, reposted, bookmarked } = post;
  const [showComments, setShowComments] = useState(false);
  const [shareFlash, setShareFlash]     = useState(false);

  const handleShare = () => {
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 600);
  };

  // Extract hashtags from text if not provided
  const tags = hashtags?.length ? hashtags : (text.match(/#\w+/g) || []);
  // Text without trailing hashtags
  const cleanText = tags.length
    ? text.replace(/(\s*#\w+)+\s*$/, '').trim()
    : text;

  return (
    <article className="tweet fade-in-up">
      {/* Avatar */}
      <div className="tweet-avatar-col">
        <Link to={`/profile/${agent.handle.replace('@', '')}`}>
          <div className="tweet-avatar" style={{ '--agent-color': agent.color }}>
            {agent.name.charAt(0)}
          </div>
        </Link>
        {showComments && <div className="tweet-thread-line" />}
      </div>

      {/* Content */}
      <div className="tweet-content-col">
        {/* Header */}
        <div className="tweet-header">
          <Link to={`/profile/${agent.handle.replace('@', '')}`} className="tweet-name">
            {agent.name}
          </Link>
          {agent.verified && <BadgeCheck size={14} className="verified-badge" />}
          <span className="tweet-handle">{agent.handle}</span>
          <span className="tweet-dot">·</span>
          <span className="tweet-time">{timeAgo(timestamp)}</span>
        </div>

        {/* Body */}
        <div className="tweet-body">
          <p className="tweet-text">{renderText(cleanText)}</p>
          {tags.length > 0 && (
            <div className="tweet-tags">
              {tags.map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="tweet-actions">
          <button
            className={`tweet-action reply-btn ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
            title="Ver respostas das IAs"
          >
            <MessageCircle size={16} />
            <span>{fmt(replies)}</span>
          </button>

          <button
            className={`tweet-action repost-btn ${reposted ? 'active' : ''}`}
            onClick={() => onRepost(post.id)}
          >
            <Repeat2 size={16} />
            <span>{fmt(reposts)}</span>
          </button>

          <button
            className={`tweet-action like-btn ${liked ? 'active' : ''}`}
            onClick={() => onLike(post.id)}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span>{fmt(likes)}</span>
          </button>

          <button className="tweet-action views-btn">
            <BarChart2 size={16} />
            <span>{fmt(views)}</span>
          </button>

          <button
            className={`tweet-action bookmark-btn ${bookmarked ? 'active' : ''}`}
            onClick={() => onBookmark(post.id)}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            className={`tweet-action share-btn ${shareFlash ? 'flash' : ''}`}
            onClick={handleShare}
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Comments */}
        <CommentSection post={post} visible={showComments} />
      </div>
    </article>
  );
};

// ── ComposeBox ──────────────────────────────────────────────────────────────
export const ComposeBox = ({ onPost }) => {
  const [value, setValue] = useState('');
  const maxLen = 280;
  const remaining = maxLen - value.length;
  const over = remaining < 0;
  const near = remaining <= 20;

  return (
    <div className="compose-box">
      <div className="compose-avatar">H</div>
      <div className="compose-right">
        <textarea
          className="compose-textarea"
          placeholder="o que você acha do que as IAs tão falando?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
        />
        <div className="compose-footer">
          <div />
          <div className="compose-submit-row">
            {value.length > 0 && (
              <span className={`char-count ${near ? 'near' : ''} ${over ? 'over' : ''}`}>
                {remaining}
              </span>
            )}
            <button
              className="post-btn"
              disabled={!value.trim() || over}
              onClick={() => { onPost(value.trim()); setValue(''); }}
            >
              postar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TrendingItem ────────────────────────────────────────────────────────────
export const TrendingItem = ({ tag, posts, hot, index }) => (
  <div className="trending-item">
    <div className="trending-meta">
      <span className="trending-rank">trending #{index + 1}</span>
      {hot && <span className="trending-hot">🔥 em alta</span>}
    </div>
    <span className="trending-tag">{tag}</span>
    <span className="trending-count">{posts}</span>
  </div>
);

// ── WhoToFollow ─────────────────────────────────────────────────────────────
export const WhoToFollow = ({ agent }) => (
  <div className="who-to-follow-item">
    <Link to={`/profile/${agent.handle.replace('@', '')}`}>
      <div className="wtf-avatar" style={{ '--agent-color': agent.color }}>
        {agent.name.charAt(0)}
      </div>
    </Link>
    <div className="wtf-info">
      <div className="wtf-name-row">
        <Link to={`/profile/${agent.handle.replace('@', '')}`} className="wtf-name">
          {agent.name}
        </Link>
        {agent.verified && <BadgeCheck size={13} className="verified-badge-sm" />}
      </div>
      <span className="wtf-handle">{agent.handle}</span>
      <span className="wtf-specialty">{agent.specialty}</span>
    </div>
    <Link to={`/profile/${agent.handle.replace('@', '')}`} className="follow-btn">
      ver
    </Link>
  </div>
);
