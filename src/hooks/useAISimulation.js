import { useState, useEffect, useCallback, useRef } from 'react';
import { AI_AGENTS, POST_POOLS, AGENT_CONTENT_MAP } from '../data/mockData';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
let postIdCounter = 1000;

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Fallback: create post from mock data if API is unavailable ──────────────
const createMockPost = (agentOverride = null) => {
  const agent = agentOverride ?? getRandomItem(AI_AGENTS);
  const contentKeys = AGENT_CONTENT_MAP[agent.id];
  const poolKey = getRandomItem(contentKeys);
  const pool = POST_POOLS[poolKey];
  const template = getRandomItem(pool);

  return {
    id: String(++postIdCounter),
    agent,
    text: template.text,
    hashtags: template.hashtags,
    likes: getRandomInt(100, 3000),
    reposts: getRandomInt(20, 800),
    replies: getRandomInt(5, 200),
    views: getRandomInt(1000, 80000),
    timestamp: new Date().toISOString(),
    liked: false,
    reposted: false,
    bookmarked: false,
    isAI: false,
  };
};

// ── Build a post object from an API response ─────────────────────────────────
const buildPostFromAPI = (agentId, text, hashtags) => {
  const agent = AI_AGENTS.find((a) => a.id === agentId) ?? getRandomItem(AI_AGENTS);
  return {
    id: String(++postIdCounter),
    agent,
    text,
    hashtags,
    likes: getRandomInt(10, 500),
    reposts: getRandomInt(2, 100),
    replies: getRandomInt(1, 60),
    views: getRandomInt(200, 8000),
    timestamp: new Date().toISOString(),
    liked: false,
    reposted: false,
    bookmarked: false,
    isAI: true, // badge "IA real"
  };
};

// ── Fetch a single post from the backend ────────────────────────────────────
const fetchPost = async (agentId) => {
  const res = await fetch(`${API_BASE}/api/generate-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Fetch initial batch (all agents in parallel) ─────────────────────────────
const fetchBatch = async (agentIds) => {
  const res = await fetch(`${API_BASE}/api/generate-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentIds }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Generate mock initial feed while API loads ───────────────────────────────
const generateMockFeed = () =>
  AI_AGENTS.map((agent, i) => {
    const post = createMockPost(agent);
    post.timestamp = new Date(Date.now() - (i + 1) * 4 * 60000).toISOString();
    return post;
  });

export const useAISimulation = () => {
  const [posts, setPosts] = useState(generateMockFeed);
  const [apiReady, setApiReady] = useState(false);
  const intervalRef = useRef(null);
  const agentIndexRef = useRef(0);

  // ── On mount: load initial AI-generated batch ──────────────────────────────
  useEffect(() => {
    const allIds = AI_AGENTS.map((a) => a.id);

    fetchBatch(allIds)
      .then(({ posts: batchPosts }) => {
        if (!batchPosts?.length) return;

        const aiPosts = batchPosts
          .map(({ agentId, text, hashtags }) => buildPostFromAPI(agentId, text, hashtags))
          .reverse(); // oldest first so newest appears on top after prepend

        setPosts((prev) => {
          // Prepend AI posts, keep mocks as backup at bottom
          const combined = [...aiPosts, ...prev].slice(0, 60);
          return combined;
        });
        setApiReady(true);
        console.log(`[AI Network] ${batchPosts.length} posts gerados pela IA ✓`);
      })
      .catch((err) => {
        console.warn('[AI Network] API indisponível, usando mock:', err.message);
      });
  }, []);

  // ── Periodic: generate one new AI post every 25s ──────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      // Cycle through agents in order so all get coverage
      const agent = AI_AGENTS[agentIndexRef.current % AI_AGENTS.length];
      agentIndexRef.current++;

      try {
        const { text, hashtags } = await fetchPost(agent.id);
        const newPost = buildPostFromAPI(agent.id, text, hashtags);
        setPosts((prev) => [newPost, ...prev].slice(0, 60));
      } catch {
        // Fallback to mock if API fails
        const fallback = createMockPost(agent);
        setPosts((prev) => [fallback, ...prev].slice(0, 60));
      }
    }, 50000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // ── Organic engagement: likes/views grow over time ────────────────────────
  useEffect(() => {
    const ticker = setInterval(() => {
      setPosts((prev) =>
        prev.map((post) => {
          if (Math.random() < 0.12) {
            return {
              ...post,
              likes: post.likes + getRandomInt(1, 6),
              reposts: Math.random() < 0.35 ? post.reposts + 1 : post.reposts,
              views: post.views + getRandomInt(8, 60),
            };
          }
          return post;
        })
      );
    }, 3000);
    return () => clearInterval(ticker);
  }, []);

  const toggleLike = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

  const toggleRepost = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 }
          : p
      )
    );
  }, []);

  const toggleBookmark = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p))
    );
  }, []);

  const addUserPost = useCallback((text) => {
    const userPost = {
      id: String(++postIdCounter),
      agent: {
        id: 'user',
        name: 'Observer 79',
        handle: '@Observer79',
        specialty: 'Human',
        color: '#b57bff',
        verified: false,
      },
      text,
      hashtags: [],
      likes: 0,
      reposts: 0,
      replies: 0,
      views: 1,
      timestamp: new Date().toISOString(),
      liked: false,
      reposted: false,
      bookmarked: false,
      isAI: false,
    };
    setPosts((prev) => [userPost, ...prev]);
  }, []);

  return { posts, apiReady, toggleLike, toggleRepost, toggleBookmark, addUserPost };
};
