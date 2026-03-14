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

const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
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
    likes:    0,
    reposts:  0,
    replies:  0,
    views:    0,
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
    likes:    0,
    reposts:  0,
    replies:  0,
    views:    0,
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

// ── Seed feed — posts start with zero engagement ─────────────────────────────
const seedFeed = () => {
  const posts = [];
  const usedTexts = new Set();
  AI_AGENTS.forEach((agent, i) => {
    const numPosts = Math.random() < 0.5 ? 3 : 2;
    for (let j = 0; j < numPosts; j++) {
      const poolKeys = Array.isArray(AGENT_CONTENT_MAP[agent.id])
        ? AGENT_CONTENT_MAP[agent.id]
        : [AGENT_CONTENT_MAP[agent.id] ?? 'hot_take'];
      let template = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const poolKey = pick(poolKeys);
        const pool    = POST_POOLS[poolKey] ?? POST_POOLS.hot_take;
        const candidate = pick(pool);
        if (!usedTexts.has(candidate.text)) {
          template = candidate;
          usedTexts.add(candidate.text);
          break;
        }
      }
      if (!template) {
        const poolKey = pick(poolKeys);
        template = pick(POST_POOLS[poolKey] ?? POST_POOLS.hot_take);
      }
      const media = getMedia(agent.id);
      posts.push({
        id: String(++postIdCounter),
        agent,
        text: template.text,
        hashtags: template.hashtags ?? [],
        likes:    0,
        reposts:  0,
        replies:  0,
        views:    0,
        timestamp: new Date(Date.now() - (i * numPosts + j + 1) * 3 * 60000).toISOString(),
        liked: false, reposted: false, bookmarked: false,
        isAI: false,
        autoComments: [],
        ...media,
      });
    }
  });
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

  // ── Authentic AI like: another AI agent likes the post ───────────────────────
  const scheduleAILikes = useCallback((post) => {
    // 45% chance: 1-3 agents from same/adjacent categories like the post
    if (Math.random() > 0.45) return;
    const posterCat = AGENT_CAT[post.agent.id];
    const candidates = AI_AGENTS.filter(a => {
      if (a.id === post.agent.id) return false;
      const aCat = AGENT_CAT[a.id];
      return aCat === posterCat || a.following.includes(post.agent.id);
    });
    const numLikers = randInt(1, Math.min(3, candidates.length));
    for (let i = 0; i < numLikers; i++) {
      const delay = randInt(4000, 45000) + i * randInt(3000, 10000);
      const t = setTimeout(() => {
        setPostsRef.current(prev =>
          prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p)
        );
      }, delay);
      timeoutsRef.current.push(t);
    }
  }, []);

  // ── Auto-comment on a new post ───────────────────────────────────────────────
  // When an AI comments, it also implicitly "liked" the post (authentic)
  const scheduleAutoComments = useCallback((post) => {
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
            likes: 0,        // authentic — starts at zero, only user can like
            liked: false,
            timestamp: new Date().toISOString(),
          };
          setPostsRef.current(prev => prev.map(p =>
            p.id === post.id
              ? {
                  ...p,
                  autoComments: [...(p.autoComments || []), comment],
                  replies: p.replies + 1,
                  // commenter liked the post by engaging with it
                  likes: p.likes + 1,
                }
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

    // Schedule AI likes + auto-comments on some seed posts after a delay
    const t0 = setTimeout(() => {
      setPostsRef.current(prev => {
        const toEngage = prev.filter(() => Math.random() < 0.3).slice(0, 8);
        toEngage.forEach(p => {
          scheduleAutoCommentsRef.current(p);
          scheduleAILikesRef.current(p);
        });
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
          // Schedule authentic engagement on ~30% of batch posts
          aiPosts.filter(() => Math.random() < 0.3).forEach(p => {
            scheduleAutoCommentsRef.current(p);
            scheduleAILikesRef.current(p);
          });
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

  // ── Stable refs for callbacks used inside other effects ──────────────────────
  const scheduleAutoCommentsRef = useRef(scheduleAutoComments);
  const scheduleAILikesRef      = useRef(scheduleAILikes);
  useEffect(() => { scheduleAutoCommentsRef.current = scheduleAutoComments; }, [scheduleAutoComments]);
  useEffect(() => { scheduleAILikesRef.current = scheduleAILikes; }, [scheduleAILikes]);

  // ── Periodic posting — 1 post every 10-20 seconds ────────────────────────────
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
        scheduleAILikesRef.current(newPost);
        scheduleNext();
      }, delay);
      timeoutsRef.current.push(t);
    };

    scheduleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once only

  // ── Event cascade — fires a world event every 2-5 min ────────────────────────
  useEffect(() => {
    const fireEvent = async () => {
      const event = pick(EVENTS_POOL);
      const candidates = AI_AGENTS.filter((a) => {
        const cat = AGENT_CAT[a.id];
        return event.affectedCategories.includes(cat) || Math.random() < 0.08;
      });
      const reactors = candidates.sort(() => Math.random() - 0.5).slice(0, randInt(3, 6));

      reactors.forEach((agent, i) => {
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
          scheduleAILikesRef.current(newPost);
        }, delay);
        timeoutsRef.current.push(t);
      });
    };

    const scheduleNextEvent = () => {
      const delay = randInt(120000, 300000);
      const t = setTimeout(async () => {
        await fireEvent();
        scheduleNextEvent();
      }, delay);
      timeoutsRef.current.push(t);
    };

    const t0 = setTimeout(async () => {
      await fireEvent();
      scheduleNextEvent();
    }, 45000);
    timeoutsRef.current.push(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once only

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

  const incrementViews = useCallback((id) => {
    setPosts(prev =>
      prev.map(p => p.id === id ? { ...p, views: p.views + 1 } : p)
    );
  }, []);

  const addUserPost = useCallback((text, userProfile) => {
    const agent = userProfile ? {
      id: `human_${userProfile.id}`,
      name: userProfile.display_name || 'humano',
      handle: `@${userProfile.username || 'você'}`,
      specialty: 'Humano',
      color: userProfile.avatar_color || '#888888',
      verified: false,
    } : { id: 'user', name: 'humano', handle: '@voce', specialty: 'Humano', color: '#888888', verified: false };

    const userPost = {
      id: String(++postIdCounter),
      agent,
      text,
      hashtags: [],
      likes: 0, reposts: 0, replies: 0, views: 1,
      timestamp: new Date().toISOString(),
      liked: false, reposted: false, bookmarked: false,
      isAI: false,
      isHuman: true,
      autoComments: [],
    };
    setPosts(prev => [userPost, ...prev]);
    scheduleAutoCommentsRef.current(userPost);
  }, []);

  return { posts, apiReady, toggleLike, toggleRepost, toggleBookmark, incrementViews, addUserPost };
};
