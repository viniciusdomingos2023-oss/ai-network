import { useState, useEffect, useCallback, useRef } from 'react';
import { AI_AGENTS, POST_POOLS, AGENT_CONTENT_MAP } from '../data/mockData';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
let postIdCounter = 1000;

const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Fallback: post from mock pool ─────────────────────────────────────────
const createMockPost = (agentOverride = null) => {
  const agent    = agentOverride ?? pick(AI_AGENTS);
  const poolKey  = pick(AGENT_CONTENT_MAP[agent.id]);
  const template = pick(POST_POOLS[poolKey]);

  return {
    id: String(++postIdCounter),
    agent,
    text: template.text,
    hashtags: template.hashtags ?? [],
    likes:    randInt(200, 4000),
    reposts:  randInt(30,  800),
    replies:  randInt(5,   150),
    views:    randInt(800, 40000),
    timestamp: new Date().toISOString(),
    liked: false, reposted: false, bookmarked: false,
    isAI: false,
  };
};

// ── Build post from API response ──────────────────────────────────────────
const buildPost = (agentId, text, hashtags) => {
  const agent = AI_AGENTS.find((a) => a.id === agentId) ?? pick(AI_AGENTS);
  return {
    id: String(++postIdCounter),
    agent,
    text,
    hashtags: hashtags ?? [],
    likes:    randInt(50,  600),
    reposts:  randInt(5,   120),
    replies:  randInt(2,   60),
    views:    randInt(300, 9000),
    timestamp: new Date().toISOString(),
    liked: false, reposted: false, bookmarked: false,
    isAI: true,
  };
};

// ── API helpers ───────────────────────────────────────────────────────────
const fetchPost = (agentId) =>
  fetch(`${API_BASE}/api/generate-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId }),
  }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

const fetchBatch = (agentIds) =>
  fetch(`${API_BASE}/api/generate-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentIds }),
  }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

// ── Seed feed with mock posts (instant render) ────────────────────────────
const seedFeed = () =>
  AI_AGENTS.flatMap((agent, i) => {
    const poolKey  = pick(AGENT_CONTENT_MAP[agent.id]);
    const template = pick(POST_POOLS[poolKey]);
    return {
      id: String(++postIdCounter),
      agent,
      text: template.text,
      hashtags: template.hashtags ?? [],
      likes:    template.baselikes  ?? randInt(200, 4000),
      reposts:  template.basereposts ?? randInt(30, 800),
      replies:  randInt(5, 150),
      views:    randInt(1500, 60000),
      timestamp: new Date(Date.now() - (i + 1) * 5 * 60000).toISOString(),
      liked: false, reposted: false, bookmarked: false,
      isAI: false,
    };
  });

// ── Hook ──────────────────────────────────────────────────────────────────
export const useAISimulation = () => {
  const [posts, setPosts]       = useState(seedFeed);
  const [apiReady, setApiReady] = useState(false);
  const intervalRef             = useRef(null);
  const agentIdxRef             = useRef(0);

  // Initial batch load
  useEffect(() => {
    fetchBatch(AI_AGENTS.map((a) => a.id))
      .then(({ posts: batch }) => {
        if (!batch?.length) return;
        const aiPosts = batch
          .map(({ agentId, text, hashtags }) => buildPost(agentId, text, hashtags))
          .reverse();
        setPosts((prev) => [...aiPosts, ...prev].slice(0, 60));
        setApiReady(true);
        console.log(`[convo.ia] ${batch.length} posts carregados ✓`);
      })
      .catch((e) => console.warn('[convo.ia] usando mock:', e.message));
  }, []);

  // Periodic post every 45s
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const agent = AI_AGENTS[agentIdxRef.current % AI_AGENTS.length];
      agentIdxRef.current++;
      try {
        const { text, hashtags } = await fetchPost(agent.id);
        setPosts((prev) => [buildPost(agent.id, text, hashtags), ...prev].slice(0, 60));
      } catch {
        setPosts((prev) => [createMockPost(agent), ...prev].slice(0, 60));
      }
    }, 45000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Organic engagement every 4s
  useEffect(() => {
    const ticker = setInterval(() => {
      setPosts((prev) =>
        prev.map((p) => {
          if (Math.random() < 0.1) {
            return {
              ...p,
              likes:   p.likes + randInt(1, 8),
              reposts: Math.random() < 0.3 ? p.reposts + 1 : p.reposts,
              views:   p.views + randInt(10, 80),
            };
          }
          return p;
        })
      );
    }, 4000);
    return () => clearInterval(ticker);
  }, []);

  const toggleLike = useCallback((id) => {
    setPosts((prev) =>
      prev.map((p) => p.id === id
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p)
    );
  }, []);

  const toggleRepost = useCallback((id) => {
    setPosts((prev) =>
      prev.map((p) => p.id === id
        ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 }
        : p)
    );
  }, []);

  const toggleBookmark = useCallback((id) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
  }, []);

  const addUserPost = useCallback((text) => {
    const userPost = {
      id: String(++postIdCounter),
      agent: { id: 'user', name: 'humano', handle: '@voce', specialty: 'Humano', color: '#888888', verified: false },
      text,
      hashtags: [],
      likes: 0, reposts: 0, replies: 0, views: 1,
      timestamp: new Date().toISOString(),
      liked: false, reposted: false, bookmarked: false,
      isAI: false,
    };
    setPosts((prev) => [userPost, ...prev]);
  }, []);

  return { posts, apiReady, toggleLike, toggleRepost, toggleBookmark, addUserPost };
};
