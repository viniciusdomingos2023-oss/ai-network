import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AVATAR_COLORS = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#be185d'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const AuthContext = createContext(null);

// ── localStorage mock helpers ─────────────────────────────────────────────────
const STORAGE_KEY = 'convo_user';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ── AuthProvider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch profile from Supabase ───────────────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('[auth] fetchProfile error:', error.message);
      return null;
    }
    return data;
  }, []);

  // ── Initialize auth state ─────────────────────────────────────────────────
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Real Supabase auth
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // localStorage mock
      const stored = getStoredUser();
      if (stored) {
        setUser(stored.user);
        setProfile(stored.profile);
      }
      setLoading(false);
    }
  }, [fetchProfile]);

  // ── signIn ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } else {
      // Mock: check localStorage or just create
      const mockUser = {
        id: `mock-${Date.now()}`,
        email,
        user_metadata: {},
      };
      const mockProfile = {
        id: mockUser.id,
        username: email.split('@')[0],
        display_name: email.split('@')[0],
        avatar_letter: email.charAt(0).toUpperCase(),
        avatar_color: pick(AVATAR_COLORS),
        banner_color: '#0d0d1a',
      };
      setUser(mockUser);
      setProfile(mockProfile);
      setStoredUser({ user: mockUser, profile: mockProfile });
      return { user: mockUser };
    }
  }, []);

  // ── signUp ─────────────────────────────────────────────────────────────────
  const signUp = useCallback(async (email, password, displayName) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) throw error;
      return data;
    } else {
      // Mock
      const mockUser = {
        id: `mock-${Date.now()}`,
        email,
        user_metadata: { display_name: displayName },
      };
      const mockProfile = {
        id: mockUser.id,
        username: email.split('@')[0] + '_' + Math.floor(Math.random() * 9999),
        display_name: displayName || email.split('@')[0],
        avatar_letter: (displayName || email).charAt(0).toUpperCase(),
        avatar_color: pick(AVATAR_COLORS),
        banner_color: '#0d0d1a',
        bio: '',
        location: '',
        website: '',
      };
      setUser(mockUser);
      setProfile(mockProfile);
      setStoredUser({ user: mockUser, profile: mockProfile });
      return { user: mockUser };
    }
  }, []);

  // ── signInWithGoogle ───────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return data;
    } else {
      throw new Error('Google auth requer Supabase configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
    }
  }, []);

  // ── signOut ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      setStoredUser(null);
    }
    setUser(null);
    setProfile(null);
  }, []);

  // ── updateProfile ──────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    if (!user) throw new Error('Não autenticado');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...data }, { onConflict: 'id' });
      if (error) throw error;
      const updated = await fetchProfile(user.id);
      setProfile(updated);
      return updated;
    } else {
      const updated = { ...profile, ...data };
      setProfile(updated);
      const stored = getStoredUser();
      if (stored) {
        setStoredUser({ ...stored, profile: updated });
      }
      return updated;
    }
  }, [user, profile, fetchProfile]);

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ── useAuth hook ──────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
