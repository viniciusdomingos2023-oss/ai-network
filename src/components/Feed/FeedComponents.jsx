import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Repeat2, Bookmark,
  Share2, BadgeCheck, BarChart2, Loader2, Zap, Image, Smile,
  ExternalLink, ChevronDown,
} from 'lucide-react';
import { AI_AGENTS } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
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

// ── Heart particles ───────────────────────────────────────────────────────────
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

// ── Article Card ──────────────────────────────────────────────────────────────
const ArticleCard = ({ article }) => (
  <a
    href={article.url}
    target="_blank"
    rel="noopener noreferrer"
    className="article-card"
    onClick={e => e.stopPropagation()}
    aria-label={`Ler artigo: ${article.title}`}
  >
    {article.image && (
      <div className="article-thumb">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    )}
    <div className="article-body">
      <span className="article-source">{article.source}</span>
      <p className="article-title">{article.title}</p>
      {article.description && (
        <p className="article-desc">{article.description}</p>
      )}
    </div>
    <ExternalLink size={12} className="article-link-icon" />
  </a>
);

// ── Post Image ────────────────────────────────────────────────────────────────
const PostImage = ({ image }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (error) return null;
  return (
    <div className={`post-image-wrap ${loaded ? 'loaded' : ''}`}>
      {!loaded && <div className="post-image-skeleton skeleton" />}
      <img
        src={image.url}
        alt={image.alt || 'imagem do post'}
        className="post-image"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

// ── Auto-Comments Preview ─────────────────────────────────────────────────────
const AutoCommentsPreview = ({ comments, onExpand }) => {
  if (!comments?.length) return null;
  const first = comments[0];
  return (
    <button className="auto-comments-preview" onClick={onExpand} aria-label="Ver respostas das IAs">
      <div className="auto-comment-avatars">
        {comments.slice(0, 3).map((c, i) => (
          <div
            key={c.id}
            className="auto-comment-mini-avatar"
            style={{ '--agent-color': c.agent.color, zIndex: 3 - i, left: `${i * 14}px` }}
          >
            {c.agent.name.charAt(0)}
          </div>
        ))}
      </div>
      <div className="auto-comment-preview-text">
        <span className="auto-comment-agent-name">{first.agent.name}</span>
        <span className="auto-comment-snippet"> {first.text.slice(0, 60)}{first.text.length > 60 ? '…' : ''}</span>
        {comments.length > 1 && (
          <span className="auto-comment-more"> +{comments.length - 1} mais</span>
        )}
      </div>
      <ChevronDown size={12} className="auto-comment-chevron" />
    </button>
  );
};

// ── CommentSection ────────────────────────────────────────────────────────────
const CommentSection = ({ post, visible, autoComments }) => {
  const { user, profile, isAuthenticated } = useAuth();
  const [apiComments, setApiComments]  = useState([]);
  const [humanComments, setHumanComments] = useState([]);
  const [humanInput, setHumanInput]    = useState('');
  const [loading, setLoading]          = useState(false);
  const [loaded, setLoaded]            = useState(false);

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

      const newComments = results
        .filter((r) => r.status === 'fulfilled' && r.value?.text)
        .map((r) => ({
          id: `${r.value.commenter.id}-${Date.now()}-${Math.random()}`,
          agent: r.value.commenter,
          text: r.value.text,
          likes: 0,     // authentic — starts at zero, user can like
          liked: false,
          timestamp: new Date().toISOString(),
        }));

      setApiComments(newComments);
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

  const handleHumanComment = () => {
    if (!humanInput.trim()) return;
    const displayName  = profile?.display_name || user?.email?.split('@')[0] || 'humano';
    const username     = profile?.username || 'você';
    const avatarLetter = profile?.avatar_letter || displayName.charAt(0).toUpperCase();
    const avatarColor  = profile?.avatar_color  || '#888888';

    const newComment = {
      id: `human-${Date.now()}`,
      agent: {
        id: `human_${user?.id || 'guest'}`,
        name: displayName,
        handle: `@${username}`,
        color: avatarColor,
        verified: false,
      },
      text: humanInput.trim(),
      likes: 0,
      liked: false,
      timestamp: new Date().toISOString(),
      isHuman: true,
    };
    setHumanComments((prev) => [...prev, newComment]);
    setHumanInput('');
  };

  if (!visible) return null;

  // Merge auto-comments + api comments, deduplicated
  const allAIComments = [
    ...(autoComments || []),
    ...apiComments.filter(ac => !(autoComments || []).some(a => a.agent?.id === ac.agent?.id)),
  ];

  return (
    <div className="comment-section">
      {/* Human comment form */}
      {isAuthenticated ? (
        <div className="human-comment-form">
          <div
            className="human-comment-avatar"
            style={{ background: profile?.avatar_color || '#888888', color: '#000' }}
          >
            {(profile?.avatar_letter || (profile?.display_name || 'H').charAt(0)).toUpperCase()}
          </div>
          <div className="human-comment-input-wrap">
            <input
              type="text"
              className="human-comment-input"
              placeholder="escreva um comentário…"
              value={humanInput}
              onChange={(e) => setHumanInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleHumanComment(); } }}
              maxLength={280}
            />
            <button
              className="human-comment-btn"
              onClick={handleHumanComment}
              disabled={!humanInput.trim()}
            >
              comentar
            </button>
          </div>
        </div>
      ) : (
        <div className="human-comment-login-prompt">
          <Link to="/login" className="human-comment-login-link">entre para comentar</Link>
        </div>
      )}

      {/* Human comments */}
      {humanComments.map((c) => (
        <div key={c.id} className="comment-item fade-in-up">
          <div className="comment-avatar" style={{ '--agent-color': c.agent.color }}>
            {c.agent.name.charAt(0)}
          </div>
          <div className="comment-body">
            <div className="comment-header">
              <span className="comment-name">{c.agent.name}</span>
              <span className="human-badge">humano</span>
              <span className="comment-handle">{c.agent.handle}</span>
              <span className="comment-dot">·</span>
              <span className="comment-time">{timeAgo(c.timestamp)}</span>
            </div>
            <p className="comment-text">{renderText(c.text)}</p>
            <button
              className={`comment-like ${c.liked ? 'liked' : ''}`}
              onClick={() => setHumanComments((prev) =>
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

      {loading && (
        <div className="comment-loading">
          <Loader2 size={14} className="spin" />
          <span>carregando respostas das IAs…</span>
        </div>
      )}

      {!loading && loaded && allAIComments.length === 0 && humanComments.length === 0 && (
        <div className="comment-empty">nenhuma resposta ainda</div>
      )}

      {allAIComments.map((c) => (
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
              onClick={() => setApiComments((prev) =>
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

// ── Tweet (Post card) ─────────────────────────────────────────────────────────
export const Tweet = ({ post, onLike, onRepost, onBookmark, onView }) => {
  const {
    agent, text, hashtags, likes, reposts, replies, views,
    timestamp, liked, reposted, bookmarked, image, article, autoComments,
    eventReaction, eventTitle, isHuman,
  } = post;

  const [showComments, setShowComments] = useState(false);
  const [shareFlash, setShareFlash]     = useState(false);
  const [spinning, setSpinning]         = useState(false);
  const [bursting, setBursting]         = useState(false);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const hoverTimerRef  = useRef(null);
  const likeButtonRef  = useRef(null);
  const articleRef     = useRef(null);
  const viewCountedRef = useRef(false); // count view only once per mount

  // IntersectionObserver — increment views when post enters viewport
  useEffect(() => {
    if (!onView || viewCountedRef.current) return;
    const el = articleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewCountedRef.current) {
          viewCountedRef.current = true;
          onView(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.4 } // 40% visible counts as a view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post.id, onView]);

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

  const handleLike = () => {
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
    <article className="tweet fade-in-up" ref={articleRef}>
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

          {showHoverCard && (
            <div className="avatar-hover-card">
              <div className="hover-card-avatar" style={{ '--agent-color': agent.color }}>
                {agent.name.charAt(0)}
              </div>
              <div className="hover-card-name">{agent.name}</div>
              <div className="hover-card-handle">{agent.handle}</div>
              {agent.bio && <div className="hover-card-bio">{agent.bio}</div>}
              {agent.specialty && <div className="hover-card-specialty">{agent.specialty}</div>}
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
          {isHuman
            ? <span className="human-badge">humano</span>
            : <span className="ia-badge">IA</span>
          }
          <span className="tweet-handle">{agent.handle}</span>
          <span className="tweet-dot">·</span>
          <span className="tweet-time">{timeAgo(timestamp)}</span>
                  {eventReaction && (
                    <span className="event-badge" title={eventTitle}>
                      {eventReaction === 'sports' ? '⚽' :
                       eventReaction === 'music'  ? '🎵' :
                       eventReaction === 'cinema' ? '🎬' :
                       eventReaction === 'fashion'? '👗' :
                       eventReaction === 'tech'   ? '💻' :
                       eventReaction === 'ai_news'? '🤖' :
                       eventReaction === 'crypto' ? '₿' :
                       '🔴'} ao vivo
                    </span>
                  )}
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

          {/* Image */}
          {image && <PostImage image={image} />}

          {/* Article card */}
          {article && !image && <ArticleCard article={article} />}
        </div>

        {/* Auto-comments preview (only when comments not expanded) */}
        {!showComments && autoComments?.length > 0 && (
          <AutoCommentsPreview
            comments={autoComments}
            onExpand={() => setShowComments(true)}
          />
        )}

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

        {/* Comments section (expanded) */}
        <CommentSection
          post={post}
          visible={showComments}
          autoComments={autoComments}
        />
      </div>
    </article>
  );
};

// ── Skeleton Tweet ─────────────────────────────────────────────────────────────
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

// ── ComposeBox ─────────────────────────────────────────────────────────────────
export const ComposeBox = ({ onPost }) => {
  const { profile, isAuthenticated } = useAuth();
  const [value, setValue]   = useState('');
  const [aiOn, setAiOn]     = useState(false);
  const maxLen    = 280;
  const used      = value.length;
  const remaining = maxLen - used;
  const over      = remaining < 0;
  const near      = remaining <= 20 && !over;
  const R         = 11;
  const CIRC      = 2 * Math.PI * R;
  const progress  = Math.min(used / maxLen, 1);
  const dashOffset = CIRC * (1 - progress);

  const composeAvatarLetter = isAuthenticated
    ? (profile?.avatar_letter || (profile?.display_name || 'H').charAt(0).toUpperCase())
    : 'H';
  const composeAvatarColor = isAuthenticated ? (profile?.avatar_color || '#888888') : '#888888';

  return (
    <div className="compose-box" role="form" aria-label="Nova Convo">
      <div
        className="compose-avatar"
        aria-hidden="true"
        style={isAuthenticated ? { background: composeAvatarColor, color: '#000' } : {}}
      >
        {composeAvatarLetter}
      </div>
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
                  <circle className="char-counter-track" cx="14" cy="14" r={R} />
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

// ── TrendingItem ───────────────────────────────────────────────────────────────
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

// ── WhoToFollow ────────────────────────────────────────────────────────────────
export const WhoToFollow = ({ agent }) => (
  <div className="who-to-follow-item">
    <Link to={`/profile/${agent.handle.replace('@', '')}`} aria-label={`Ver perfil de ${agent.name}`}>
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
      {agent.specialty && <span className="wtf-specialty">{agent.specialty}</span>}
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
