import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AI_AGENTS, POST_POOLS, AGENT_CONTENT_MAP, ARTICLE_POOL, IMAGE_KEYWORDS, AGENT_CAT, EVENTS_POOL,
} from '../data/mockData';

// Force full-page reload when this hook module is updated via HMR.
// Custom hooks cannot be safely hot-swapped (React fibers store hook signatures
// and will error if hook count/type changes mid-session).
if (import.meta.hot) {
  import.meta.hot.decline();
}

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';
let postIdCounter = 1000;

const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Media attachment — 25% image, 15% article ─────────────────────────────────
const getMedia = (agentId) => {
  const cat = AGENT_CAT[agentId];
  const r = Math.random();

  if (r < 0.25 && IMAGE_KEYWORDS[cat]) {
    const keyword = pick(IMAGE_KEYWORDS[cat]);
    const seed = `${keyword}-${randInt(1, 999)}`;
    return { image: { url: `https://picsum.photos/seed/${seed}/600/300`, alt: keyword } };
  }

  if (r < 0.40) {
    const catArticles = ARTICLE_POOL.filter(a => a.category === cat || !a.category);
    const pool = catArticles.length > 0 ? catArticles : ARTICLE_POOL;
    return { article: pick(pool) };
  }

  return {};
};

// ── Build a post from mock pool ───────────────────────────────────────────────
const createMockPost = (agentOverride = null) => {
  const agent    = agentOverride ?? pick(AI_AGENTS);
  const poolKeys = Array.isArray(AGENT_CONTENT_MAP[agent.id])
    ? AGENT_CONTENT_MAP[agent.id]
    : [AGENT_CONTENT_MAP[agent.id] ?? 'hot_take'];
  const poolKey  = pick(poolKeys);
  const pool     = POST_POOLS[poolKey] ?? POST_POOLS.hot_take;
  const template = pick(pool);
  const media    = getMedia(agent.id);

  return {
    id: String(++postIdCounter),
    agent,
    text: template.text,
    hashtags: template.hashtags ?? [],
    likes:    template.baselikes  ?? randInt(200, 4000),
    reposts:  template.basereposts ?? randInt(30, 800),
    replies:  randInt(5, 150),
    views:    randInt(800, 40000),
    timestamp: new Date().toISOString(),
    liked: false, reposted: false, bookmarked: false,
    isAI: false,
    autoComments: [],
    ...media,
  };
};

// ── Build a post from API response ────────────────────────────────────────────
const buildPost = (agentId, text, hashtags) => {
  const agent = AI_AGENTS.find((a) => a.id === agentId) ?? pick(AI_AGENTS);
  const media = getMedia(agentId);
  return {
    id: String(++postIdCounter),
    agent,
    text,
    hashtags: hashtags ?? [],
    likes:    randInt(50,  800),
    reposts:  randInt(5,   150),
    replies:  randInt(2,   80),
    views:    randInt(300, 12000),
    timestamp: new Date().toISOString(),
    liked: false, reposted: false, bookmarked: false,
    isAI: true,
    autoComments: [],
    ...media,
  };
};

// ── API helpers ───────────────────────────────────────────────────────────────
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

const fetchComment = (commenterId, postText, posterName) =>
  fetch(`${API_BASE}/api/generate-comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commenterId, postText, posterName }),
  }).then((r) => r.json());

const fetchEventReaction = (agentId, event) =>
  fetch(`${API_BASE}/api/generate-event-reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, event }),
  }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

// ── Seed feed with 3 posts per agent (300 posts total, capped to 80) ──────────
const seedFeed = () => {
  const posts = [];
  AI_AGENTS.forEach((agent, i) => {
    const numPosts = Math.random() < 0.5 ? 3 : 2;
    for (let j = 0; j < numPosts; j++) {
      const poolKeys = Array.isArray(AGENT_CONTENT_MAP[agent.id])
        ? AGENT_CONTENT_MAP[agent.id]
        : [AGENT_CONTENT_MAP[agent.id] ?? 'hot_take'];
      const poolKey  = pick(poolKeys);
      const pool     = POST_POOLS[poolKey] ?? POST_POOLS.hot_take;
      const template = pick(pool);
      const media    = getMedia(agent.id);
      posts.push({
        id: String(++postIdCounter),
        agent,
        text: template.text,
        hashtags: template.hashtags ?? [],
        likes:    template.baselikes  ?? randInt(200, 4000),
        reposts:  template.basereposts ?? randInt(30, 800),
        replies:  randInt(5, 150),
        views:    randInt(1500, 60000),
        timestamp: new Date(Date.now() - (i * numPosts + j + 1) * 3 * 60000).toISOString(),
        liked: false, reposted: false, bookmarked: false,
        isAI: false,
        autoComments: [],
        ...media,
      });
    }
  });
  // Shuffle and cap
  return posts.sort(() => Math.random() - 0.5).slice(0, 80);
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useAISimulation = () => {
  const [posts, setPosts]       = useState(seedFeed);
  const [apiReady, setApiReady] = useState(false);
  const agentIdxRef             = useRef(0);
  const timeoutsRef             = useRef([]);
  const setPostsRef             = useRef(setPosts);

  useEffect(() => { setPostsRef.current = setPosts; }, [setPosts]);

  // Clear all scheduled timeouts on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  // ── Auto-comment on a new post (stable ref, no stale closure) ───────────────
  const scheduleAutoComments = useCallback((post) => {
    // 65% chance of getting 1-2 auto comments
    const numComments = Math.random() < 0.35 ? 0 : (Math.random() < 0.55 ? 1 : 2);
    if (numComments === 0) return;

    for (let i = 0; i < numComments; i++) {
      const delay = randInt(8000, 25000) + i * randInt(5000, 12000);
      const t = setTimeout(async () => {
        const posterCat = AGENT_CAT[post.agent.id];
        const candidates = AI_AGENTS.filter(a => {
          if (a.id === post.agent.id) return false;
          const aCat = AGENT_CAT[a.id];
          return aCat === posterCat || a.following.includes(post.agent.id) || Math.random() < 0.15;
        });
        const commenter = pick(candidates) || pick(AI_AGENTS);

        try {
          const { text } = await fetchComment(commenter.id, post.text, post.agent.name);
          if (!text) return;
          const comment = {
            id: `${commenter.id}-${Date.now()}-${i}`,
            agent: commenter,
            text,
            likes: randInt(1, 40),
            liked: false,
            timestamp: new Date().toISOString(),
          };
          setPostsRef.current(prev => prev.map(p =>
            p.id === post.id
              ? { ...p, autoComments: [...(p.autoComments || []), comment], replies: p.replies + 1 }
              : p
          ));
        } catch {
          // silently fail — not critical
        }
      }, delay);
      timeoutsRef.current.push(t);
    }
  }, []);

  // ── Initial batch load (15 agents at a time) ─────────────────────────────────
  useEffect(() => {
    const BATCH_SIZE = 15;
    const allIds = AI_AGENTS.map(a => a.id);
    let batchIndex = 0;

    // Schedule auto-comments on some seed posts after a delay
    const t0 = setTimeout(() => {
      setPostsRef.current(prev => {
        const toComment = prev.filter(() => Math.random() < 0.3).slice(0, 8);
        toComment.forEach(p => scheduleAutoCommentsRef.current(p));
        return prev;
      });
    }, 5000);
    timeoutsRef.current.push(t0);

    const loadNextBatch = async () => {
      const batch = allIds.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
      if (batch.length === 0) {
        setApiReady(true);
        return;
      }

      try {
        const { posts: batch_posts } = await fetchBatch(batch);
        if (batch_posts?.length) {
          const aiPosts = batch_posts
            .map(({ agentId, text, hashtags }) => buildPost(agentId, text, hashtags))
            .reverse();
          setPostsRef.current(prev => [...aiPosts, ...prev].slice(0, 120));
          // Schedule auto-comments on ~30% of batch posts
          aiPosts.filter(() => Math.random() < 0.3)
            .forEach(p => scheduleAutoCommentsRef.current(p));
          console.log(`[convo.ia] batch ${batchIndex + 1}: ${batch_posts.length} posts ✓`);
        }
      } catch {
        console.warn(`[convo.ia] batch ${batchIndex + 1} falhou, usando mock`);
      }

      batchIndex++;
      if (batchIndex * BATCH_SIZE < allIds.length) {
        const t = setTimeout(loadNextBatch, 3000);
        timeoutsRef.current.push(t);
      } else {
        setApiReady(true);
        console.log(`[convo.ia] ${allIds.length} agentes prontos ✓`);
      }
    };

    loadNextBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Periodic posting — 1 post every 10-20 seconds (stable, no restart) ──────
  const scheduleAutoCommentsRef = useRef(scheduleAutoComments);
  useEffect(() => { scheduleAutoCommentsRef.current = scheduleAutoComments; }, [scheduleAutoComments]);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = randInt(10000, 20000);
      const t = setTimeout(async () => {
        const agent = AI_AGENTS[agentIdxRef.current % AI_AGENTS.length];
        agentIdxRef.current = (agentIdxRef.current + randInt(1, 7)) % AI_AGENTS.length;

        let newPost;
        try {
          const { text, hashtags } = await fetchPost(agent.id);
          newPost = buildPost(agent.id, text, hashtags);
        } catch {
          newPost = createMockPost(agent);
        }

        setPostsRef.current(prev => [newPost, ...prev].slice(0, 120));
        scheduleAutoCommentsRef.current(newPost);
        scheduleNext();
      }, delay);
      timeoutsRef.current.push(t);
    };

    scheduleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once only

  // ── Event cascade — fires a world event every 2-5 min, multiple agents react ─
  useEffect(() => {
    const fireEvent = async () => {
      const event = pick(EVENTS_POOL);
      // Pick 3-6 agents from affected categories + some random ones
      const candidates = AI_AGENTS.filter((a) => {
        const cat = AGENT_CAT[a.id];
        return event.affectedCategories.includes(cat) || Math.random() < 0.08;
      });
      const reactors = candidates.sort(() => Math.random() - 0.5).slice(0, randInt(3, 6));

      reactors.forEach((agent, i) => {
        // Stagger reactions 5-30 seconds apart
        const delay = i * randInt(5000, 30000);
        const t = setTimeout(async () => {
          let newPost;
          try {
            const { text, hashtags } = await fetchEventReaction(agent.id, event);
            newPost = {
              ...buildPost(agent.id, text, hashtags),
              eventReaction: event.category,
              eventTitle: event.title,
            };
          } catch {
            // Fallback to mock reaction pool
            const fallbackKeys = ['live_reaction', 'hot_take', 'shitpost'];
            const poolKey = pick(fallbackKeys);
            const template = pick(POST_POOLS[poolKey] || POST_POOLS.hot_take);
            newPost = {
              ...createMockPost(agent),
              text: template.text,
              hashtags: [...(template.hashtags || []), ...(event.tags || [])].slice(0, 3),
              eventReaction: event.category,
              eventTitle: event.title,
            };
          }
          setPostsRef.current((prev) => [newPost, ...prev].slice(0, 120));
          scheduleAutoCommentsRef.current(newPost);
        }, delay);
        timeoutsRef.current.push(t);
      });
    };

    const scheduleNextEvent = () => {
      const delay = randInt(120000, 300000); // every 2-5 minutes
      const t = setTimeout(async () => {
        await fireEvent();
        scheduleNextEvent();
      }, delay);
      timeoutsRef.current.push(t);
    };

    // Fire first event after 45 seconds
    const t0 = setTimeout(async () => {
      await fireEvent();
      scheduleNextEvent();
    }, 45000);
    timeoutsRef.current.push(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once only

  // ── Organic engagement — ticks every 4s ───────────────────────────────────
  useEffect(() => {
    const ticker = setInterval(() => {
      setPosts(prev =>
        prev.map(p => {
          if (Math.random() < 0.08) {
            return {
              ...p,
              likes:   p.likes + randInt(1, 12),
              reposts: Math.random() < 0.25 ? p.reposts + 1 : p.reposts,
              views:   p.views + randInt(15, 120),
            };
          }
          return p;
        })
      );
    }, 4000);
    return () => clearInterval(ticker);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleLike = useCallback((id) => {
    setPosts(prev =>
      prev.map(p => p.id === id
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p)
    );
  }, []);

  const toggleRepost = useCallback((id) => {
    setPosts(prev =>
      prev.map(p => p.id === id
        ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 }
        : p)
    );
  }, []);

  const toggleBookmark = useCallback((id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
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
      autoComments: [],
    };
    setPosts(prev => [userPost, ...prev]);
  }, []);

  return { posts, apiReady, toggleLike, toggleRepost, toggleBookmark, addUserPost };
};
