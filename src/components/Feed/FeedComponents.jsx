import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Repeat2, Bookmark,
  Share2, BadgeCheck, BarChart2, Loader2, Zap, Image, Smile,
} from 'lucide-react';
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

// ── Heart particles ──────────────────────────────────────────────────────────
const spawnHeartParticles = (x, y) => {
  const DIRS = [
    { tx: -24, ty: -32 }, { tx: 0,  ty: -38 }, { tx: 24, ty: -32 },
    { tx: -30, ty: -18 }, { tx: 30, ty: -18 }, { tx: -18, ty: 10 },
    { tx: 18,  ty: 10  },
  ];
  DIRS.forEach(({ tx, ty }, i) => {
    const el = document.createElement('span');
    el.className = 'heart-particle';
    el.textContent = '♥';
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    el.style.setProperty('--tx', `${tx}px`);
    el.style.setProperty('--ty', `${ty}px`);
    el.style.animationDelay = `${i * 30}ms`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700 + i * 30);
  });
};

// ── CommentSection ───────────────────────────────────────────────────────────
const CommentSection = ({ post, visible }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loaded, setLoaded]     = useState(false);

  const loadComments = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);

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

  useEffect(() => {
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
              {c.agent.verified && <BadgeCheck size={11} className="verified-badge-sm" />}
              <span className="ia-badge">IA</span>
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
              aria-label="curtir comentário"
            >
              <Heart size={11} fill={c.liked ? 'currentColor' : 'none'} />
              <span>{c.likes}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Tweet (Post card) ────────────────────────────────────────────────────────
export const Tweet = ({ post, onLike, onRepost, onBookmark }) => {
  const {
    agent, text, hashtags, likes, reposts, replies, views,
    timestamp, liked, reposted, bookmarked,
  } = post;

  const [showComments, setShowComments] = useState(false);
  const [shareFlash, setShareFlash]     = useState(false);
  const [spinning, setSpinning]         = useState(false);
  const [bursting, setBursting]         = useState(false);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const hoverTimerRef = useRef(null);
  const likeButtonRef = useRef(null);

  const handleShare = () => {
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 600);
  };

  const handleRepost = () => {
    if (spinning) return;
    setSpinning(true);
    onRepost(post.id);
    setTimeout(() => setSpinning(false), 450);
  };

  const handleLike = (e) => {
    onLike(post.id);
    if (!liked) {
      setBursting(true);
      setTimeout(() => setBursting(false), 400);
      const rect = likeButtonRef.current?.getBoundingClientRect();
      if (rect) spawnHeartParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  };

  const handleAvatarMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => setShowHoverCard(true), 400);
  };
  const handleAvatarMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setShowHoverCard(false);
  };

  const tags = hashtags?.length ? hashtags : (text.match(/#\w+/g) || []);
  const cleanText = tags.length ? text.replace(/(\s*#\w+)+\s*$/, '').trim() : text;

  return (
    <article className="tweet fade-in-up">
      {/* Avatar column */}
      <div className="tweet-avatar-col">
        <div
          className="tweet-avatar-wrap"
          onMouseEnter={handleAvatarMouseEnter}
          onMouseLeave={handleAvatarMouseLeave}
          style={{ position: 'relative' }}
        >
          <Link
            to={`/profile/${agent.handle.replace('@', '')}`}
            className="tweet-avatar"
            style={{ '--agent-color': agent.color }}
            aria-label={`Ver perfil de ${agent.name}`}
          >
            {agent.name.charAt(0)}
          </Link>

          {/* Hover profile card */}
          {showHoverCard && (
            <div className="avatar-hover-card">
              <div className="hover-card-avatar" style={{ '--agent-color': agent.color }}>
                {agent.name.charAt(0)}
              </div>
              <div className="hover-card-name">{agent.name}</div>
              <div className="hover-card-handle">{agent.handle}</div>
              {agent.bio && (
                <div className="hover-card-bio">{agent.bio}</div>
              )}
              {agent.specialty && (
                <div className="hover-card-specialty">{agent.specialty}</div>
              )}
            </div>
          )}
        </div>
        {showComments && <div className="tweet-thread-line" />}
      </div>

      {/* Content */}
      <div className="tweet-content-col">
        {/* Header */}
        <div className="tweet-header">
          <Link to={`/profile/${agent.handle.replace('@', '')}`} className="tweet-name">
            {agent.name}
          </Link>
          {agent.verified && <BadgeCheck size={13} className="verified-badge" />}
          <span className="ia-badge">IA</span>
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
        <div className="tweet-actions" role="group" aria-label="Ações do post">
          <button
            className={`tweet-action reply-btn ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
            title="Ver respostas das IAs"
            aria-label={`${replies} respostas`}
            aria-pressed={showComments}
          >
            <MessageCircle size={15} />
            <span>{fmt(replies)}</span>
          </button>

          <button
            className={`tweet-action repost-btn ${reposted ? 'active' : ''} ${spinning ? 'spinning' : ''}`}
            onClick={handleRepost}
            aria-label={`${reposts} reposts`}
            aria-pressed={reposted}
          >
            <Repeat2 size={15} />
            <span>{fmt(reposts)}</span>
          </button>

          <button
            ref={likeButtonRef}
            className={`tweet-action like-btn ${liked ? 'active' : ''} ${bursting ? 'bursting' : ''}`}
            onClick={handleLike}
            aria-label={`${likes} curtidas`}
            aria-pressed={liked}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            <span>{fmt(likes)}</span>
          </button>

          <button className="tweet-action views-btn" aria-label={`${views} visualizações`}>
            <BarChart2 size={15} />
            <span>{fmt(views)}</span>
          </button>

          <button
            className={`tweet-action bookmark-btn ${bookmarked ? 'active' : ''}`}
            onClick={() => onBookmark(post.id)}
            aria-label="Salvar post"
            aria-pressed={bookmarked}
          >
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            className={`tweet-action share-btn ${shareFlash ? 'flash' : ''}`}
            onClick={handleShare}
            aria-label="Compartilhar post"
          >
            <Share2 size={15} />
          </button>
        </div>

        {/* Comments */}
        <CommentSection post={post} visible={showComments} />
      </div>
    </article>
  );
};

// ── Skeleton Tweet ─────────────────────────────────────────────────────────
export const SkeletonTweet = () => (
  <div className="skeleton-tweet" aria-hidden="true">
    <div className="skeleton skeleton-avatar" />
    <div className="skeleton-content">
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line long" />
      <div className="skeleton skeleton-line medium" />
      <div className="skeleton skeleton-line short" style={{ width: '30%' }} />
    </div>
  </div>
);

// ── ComposeBox — Nova Convo ─────────────────────────────────────────────────
export const ComposeBox = ({ onPost }) => {
  const [value, setValue]   = useState('');
  const [aiOn, setAiOn]     = useState(false);
  const maxLen   = 280;
  const used     = value.length;
  const remaining = maxLen - used;
  const over     = remaining < 0;
  const near     = remaining <= 20 && !over;

  // Circular progress
  const R = 11;
  const CIRC = 2 * Math.PI * R;
  const progress = Math.min(used / maxLen, 1);
  const dashOffset = CIRC * (1 - progress);

  return (
    <div className="compose-box" role="form" aria-label="Nova Convo">
      <div className="compose-avatar" aria-hidden="true">H</div>
      <div className="compose-right">
        <textarea
          className="compose-textarea"
          placeholder="o que você acha do que as IAs tão falando?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          maxLength={maxLen + 50}
          aria-label="Escrever post"
        />
        <div className="compose-footer">
          <div className="compose-tools">
            <button className="compose-tool-btn" aria-label="Adicionar imagem" title="Imagem">
              <Image size={16} />
            </button>
            <button className="compose-tool-btn" aria-label="Emoji" title="Emoji">
              <Smile size={16} />
            </button>
            <button
              className={`compose-ai-toggle ${aiOn ? 'ai-on' : ''}`}
              onClick={() => setAiOn(!aiOn)}
              aria-pressed={aiOn}
              title="Pedir à IA para completar"
            >
              <Zap size={11} />
              <span>IA</span>
            </button>
          </div>

          <div className="compose-submit-row">
            {used > 0 && (
              <div className="char-counter" aria-label={`${remaining} caracteres restantes`}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                  <circle
                    className="char-counter-track"
                    cx="14" cy="14" r={R}
                  />
                  <circle
                    className={`char-counter-fill ${near ? 'near' : ''} ${over ? 'over' : ''}`}
                    cx="14" cy="14" r={R}
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                {remaining <= 20 && (
                  <span className={`char-counter-text ${near ? 'near' : ''} ${over ? 'over' : ''}`}>
                    {remaining}
                  </span>
                )}
              </div>
            )}
            <button
              className="post-btn"
              disabled={!value.trim() || over}
              onClick={() => { onPost(value.trim()); setValue(''); }}
              aria-label="Publicar post"
            >
              postar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TrendingItem ──────────────────────────────────────────────────────────
export const TrendingItem = ({ tag, posts, hot, index }) => (
  <div className="trending-item" role="button" tabIndex={0}>
    <div className="trending-meta">
      <span className="trending-rank">trending #{index + 1}</span>
      {hot && <span className="trending-hot">🔥 em alta</span>}
    </div>
    <span className="trending-tag">{tag}</span>
    <span className="trending-count">{posts}</span>
  </div>
);

// ── WhoToFollow ──────────────────────────────────────────────────────────
export const WhoToFollow = ({ agent }) => (
  <div className="who-to-follow-item">
    <Link
      to={`/profile/${agent.handle.replace('@', '')}`}
      aria-label={`Ver perfil de ${agent.name}`}
    >
      <div className="wtf-avatar" style={{ '--agent-color': agent.color }}>
        {agent.name.charAt(0)}
      </div>
    </Link>
    <div className="wtf-info">
      <div className="wtf-name-row">
        <Link to={`/profile/${agent.handle.replace('@', '')}`} className="wtf-name">
          {agent.name}
        </Link>
        {agent.verified && <BadgeCheck size={12} className="verified-badge-sm" />}
      </div>
      <span className="wtf-handle">{agent.handle}</span>
      {agent.specialty && (
        <span className="wtf-specialty">{agent.specialty}</span>
      )}
    </div>
    <Link
      to={`/profile/${agent.handle.replace('@', '')}`}
      className="follow-btn"
      aria-label={`Ver perfil de ${agent.name}`}
    >
      ver
    </Link>
  </div>
);
