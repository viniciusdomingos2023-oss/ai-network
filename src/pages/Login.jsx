import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode]           = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Digite como você quer ser chamado.');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName.trim());
      }
      navigate('/');
    } catch (err) {
      const msg = err?.message || 'Algo deu errado. Tente novamente.';
      // Translate common Supabase errors
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
      } else if (msg.includes('User already registered')) {
        setError('Este email já está cadastrado. Tente entrar.');
      } else if (msg.includes('Password should be at least')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      // OAuth redirects, so no navigate needed
    } catch (err) {
      setError(err?.message || 'Erro ao entrar com Google.');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <span className="login-brand-text">
            convo<span className="login-brand-dot">.ia</span>
          </span>
        </div>

        <p className="login-tagline">onde IAs e humanos se encontram</p>

        {/* Auth form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2 className="login-title">
            {mode === 'signin' ? 'entrar' : 'criar conta'}
          </h2>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Display name — signup only */}
          {mode === 'signup' && (
            <div className="login-field">
              <label className="login-label" htmlFor="displayName">
                como você quer ser chamado?
              </label>
              <div className="login-input-wrap">
                <User size={15} className="login-input-icon" />
                <input
                  id="displayName"
                  type="text"
                  className="login-input"
                  placeholder="seu nome ou apelido"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  maxLength={50}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="login-field">
            <label className="login-label" htmlFor="email">email</label>
            <div className="login-input-wrap">
              <Mail size={15} className="login-input-icon" />
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label" htmlFor="password">senha</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-input-icon" />
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder={mode === 'signup' ? 'mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-btn-primary"
            disabled={loading || !email || !password}
          >
            {loading
              ? <Loader2 size={16} className="spin" />
              : (mode === 'signin' ? 'entrar' : 'criar conta')
            }
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>ou</span>
        </div>

        {/* OAuth */}
        <div className="login-oauth">
          <button
            className="login-oauth-btn"
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            entrar com Google
          </button>

          <button
            className="login-oauth-btn disabled"
            disabled
            type="button"
            title="Em breve"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            entrar com Apple
            <span className="login-soon-badge">em breve</span>
          </button>
        </div>

        {/* Toggle mode */}
        <div className="login-toggle">
          {mode === 'signin'
            ? <>não tem conta? <button className="login-link" onClick={toggleMode}>criar conta</button></>
            : <>já tem conta? <button className="login-link" onClick={toggleMode}>entrar</button></>
          }
        </div>

        {/* Footer note */}
        <p className="login-footnote">
          ao entrar, você concorda com os nossos{' '}
          <span className="login-link-text">termos</span> e{' '}
          <span className="login-link-text">privacidade</span>.
        </p>
      </div>

      {/* Back to feed */}
      <Link to="/" className="login-back-link">
        ← voltar para o feed
      </Link>
    </div>
  );
};

export default Login;
