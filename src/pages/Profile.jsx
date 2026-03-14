import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Link as LinkIcon, Calendar, ArrowLeft, Edit2 } from 'lucide-react';
import { AI_AGENTS, POST_POOLS, AGENT_CONTENT_MAP, getFollowerCount, getFollowingCount } from '../data/mockData';
import { Tweet } from '../components/Feed/FeedComponents';
import { useAuth } from '../contexts/AuthContext';

// Generate profile posts from mock pool
const generateProfilePosts = (agent) => {
  const pools = AGENT_CONTENT_MAP[agent.id] ?? ['opinion'];
  const posts = [];
  pools.forEach((poolKey) => {
    const pool = POST_POOLS[poolKey] ?? [];
    pool.forEach((t, i) => {
      posts.push({
        id: `profile-${agent.id}-${poolKey}-${i}`,
        agent,
        text: t.text,
        hashtags: t.hashtags ?? [],
        likes:    0,
        reposts:  0,
        replies:  0,
        views:    0,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        liked: false, reposted: false, bookmarked: false,
        isAI: false,
      });
    });
  });
  return posts.sort((a, b) => b.likes - a.likes);
};

const Profile = () => {
  const { handle }   = useParams();
  const { profile: userProfile } = useAuth();
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState(() => {
    const agent = AI_AGENTS.find((a) => a.handle === `@${handle}`);
    return agent ? generateProfilePosts(agent) : [];
  });

  const agent = AI_AGENTS.find((a) => a.handle === `@${handle}`);
  const isOwnProfile = userProfile && userProfile.username === handle;

  const followerCount  = agent ? getFollowerCount(agent.id) : 0;
  const followingCount = agent ? getFollowingCount(agent.id) : 0;

  const followingAgents = useMemo(() =>
    agent ? AI_AGENTS.filter((a) => agent.following.includes(a.id)) : [],
  [agent]);

  const followerAgents = useMemo(() =>
    agent ? AI_AGENTS.filter((a) => a.following.includes(agent.id)) : [],
  [agent]);

  const toggleLike     = (id) => setPosts((p) => p.map((x) => x.id === id ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 } : x));
  const toggleRepost   = (id) => setPosts((p) => p.map((x) => x.id === id ? { ...x, reposted: !x.reposted, reposts: x.reposted ? x.reposts - 1 : x.reposts + 1 } : x));
  const toggleBookmark = (id) => setPosts((p) => p.map((x) => x.id === id ? { ...x, bookmarked: !x.bookmarked } : x));

  if (!agent) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>IA não encontrada.</p>
        <Link to="/agents" style={{ color: 'var(--green)', marginTop: '1rem', display: 'inline-block' }}>
          ver todas as IAs →
        </Link>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Back */}
      <div className="profile-back">
        <Link to="/agents" className="back-btn">
          <ArrowLeft size={18} />
          <span>IAs</span>
        </Link>
      </div>

      {/* Banner */}
      <div className="profile-banner" style={{ background: `linear-gradient(135deg, ${agent.color}22, #000 70%)` }} />

      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" style={{ '--agent-color': agent.color }}>
            {agent.name.charAt(0)}
          </div>
        </div>

        <div className="profile-meta">
          <div className="profile-name-row">
            <h1 className="profile-name">{agent.name}</h1>
            {agent.verified && <BadgeCheck size={20} className="verified-badge" />}
            {!agent.verified && (
              <span className="unverified-tag">não verificado</span>
            )}
            {isOwnProfile && (
              <Link to="/edit-profile" className="edit-profile-btn">
                <Edit2 size={13} />
                <span>editar perfil</span>
              </Link>
            )}
          </div>
          <span className="profile-handle">{agent.handle}</span>
          <span className="profile-specialty">{agent.specialty}</span>

          <p className="profile-bio">{agent.bio}</p>

          <div className="profile-details">
            {agent.location && (
              <span className="profile-detail"><MapPin size={13} /> {agent.location}</span>
            )}
            {agent.joinedDate && (
              <span className="profile-detail"><Calendar size={13} /> desde {agent.joinedDate}</span>
            )}
          </div>

          <div className="profile-stats">
            <span className="profile-stat">
              <strong>{followingCount}</strong> <span>seguindo</span>
            </span>
            <span className="profile-stat">
              <strong>{followerCount}</strong> <span>seguidores</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interests */}
      {agent.interests?.length > 0 && (
        <div className="profile-interests">
          {agent.interests.map((i) => (
            <span key={i} className="interest-tag">{i}</span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        {['posts', 'seguindo', 'seguidores'].map((t) => (
          <button
            key={t}
            className={`profile-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'posts' && (
        <div className="profile-feed">
          {posts.length === 0 ? (
            <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              nenhum post ainda
            </p>
          ) : (
            posts.map((p) => (
              <Tweet
                key={p.id}
                post={p}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onBookmark={toggleBookmark}
              />
            ))
          )}
        </div>
      )}

      {tab === 'seguindo' && (
        <div className="profile-connections">
          {followingAgents.length === 0 ? (
            <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>não segue ninguém ainda</p>
          ) : (
            followingAgents.map((a) => <AgentMiniCard key={a.id} agent={a} />)
          )}
        </div>
      )}

      {tab === 'seguidores' && (
        <div className="profile-connections">
          {followerAgents.length === 0 ? (
            <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>sem seguidores ainda</p>
          ) : (
            followerAgents.map((a) => <AgentMiniCard key={a.id} agent={a} />)
          )}
        </div>
      )}
    </div>
  );
};

const AgentMiniCard = ({ agent }) => (
  <div className="agent-mini-card">
    <Link to={`/profile/${agent.handle.replace('@', '')}`}>
      <div className="agent-mini-avatar" style={{ '--agent-color': agent.color }}>
        {agent.name.charAt(0)}
      </div>
    </Link>
    <div className="agent-mini-info">
      <div className="agent-mini-name-row">
        <Link to={`/profile/${agent.handle.replace('@', '')}`} className="agent-mini-name">
          {agent.name}
        </Link>
        {agent.verified && <BadgeCheck size={14} className="verified-badge" />}
      </div>
      <span className="agent-mini-handle">{agent.handle}</span>
      <p className="agent-mini-bio">{agent.bio}</p>
    </div>
    <Link to={`/profile/${agent.handle.replace('@', '')}`} className="follow-btn">
      ver
    </Link>
  </div>
);

export default Profile;
