import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './EditProfile.css';

const AVATAR_COLORS  = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#be185d'];
const BANNER_COLORS  = ['#0d0d1a','#1a0d1a','#0d1a0d','#1a0d0d','#0d0d2a','#1a1a0d','#111118'];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    avatar_color: '#7c3aed',
    banner_color: '#0d0d1a',
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        display_name:  profile.display_name  || '',
        username:      profile.username       || '',
        bio:           profile.bio            || '',
        location:      profile.location       || '',
        website:       profile.website        || '',
        avatar_color:  profile.avatar_color   || '#7c3aed',
        banner_color:  profile.banner_color   || '#0d0d1a',
      });
    }
  }, [profile]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const data = {
        ...form,
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: form.bio.slice(0, 160),
        avatar_letter: (form.display_name.trim() || profile?.display_name || 'H').charAt(0).toUpperCase(),
      };

      if (!data.display_name) {
        setError('Nome de exibição não pode estar vazio.');
        setSaving(false);
        return;
      }

      await updateProfile(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err?.message?.includes('duplicate') || err?.message?.includes('unique')) {
        setError('Este @username já está em uso. Escolha outro.');
      } else {
        setError(err?.message || 'Erro ao salvar. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="editprofile-loading">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  const avatarLetter = (form.display_name || profile?.display_name || 'H').charAt(0).toUpperCase();

  return (
    <div className="editprofile-page">
      {/* Header */}
      <div className="editprofile-header">
        <button className="editprofile-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          <span>voltar</span>
        </button>
        <h1 className="editprofile-title">editar perfil</h1>
      </div>

      {/* Preview */}
      <div className="editprofile-preview">
        {/* Banner */}
        <div
          className="editprofile-banner"
          style={{ background: form.banner_color }}
        />

        {/* Avatar */}
        <div className="editprofile-avatar-wrap">
          <div
            className="editprofile-avatar"
            style={{ background: form.avatar_color }}
          >
            {avatarLetter}
          </div>
        </div>

        <div className="editprofile-preview-info">
          <span className="editprofile-preview-name">{form.display_name || 'seu nome'}</span>
          <span className="editprofile-preview-handle">@{form.username || 'username'}</span>
        </div>
      </div>

      {/* Form */}
      <form className="editprofile-form" onSubmit={handleSubmit}>
        {/* Error */}
        {error && (
          <div className="editprofile-error" role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="editprofile-success" role="status">
            <Check size={14} />
            <span>perfil salvo com sucesso!</span>
          </div>
        )}

        {/* Display name */}
        <div className="editprofile-field">
          <label className="editprofile-label" htmlFor="display_name">nome de exibição</label>
          <input
            id="display_name"
            type="text"
            className="editprofile-input"
            value={form.display_name}
            onChange={handleChange('display_name')}
            placeholder="como você quer aparecer"
            maxLength={50}
          />
        </div>

        {/* Username */}
        <div className="editprofile-field">
          <label className="editprofile-label" htmlFor="username">@username</label>
          <div className="editprofile-input-prefix-wrap">
            <span className="editprofile-input-prefix">@</span>
            <input
              id="username"
              type="text"
              className="editprofile-input has-prefix"
              value={form.username}
              onChange={handleChange('username')}
              placeholder="seuusername"
              maxLength={30}
              pattern="[a-zA-Z0-9_]*"
            />
          </div>
          <span className="editprofile-hint">letras, números e _ apenas</span>
        </div>

        {/* Bio */}
        <div className="editprofile-field">
          <label className="editprofile-label" htmlFor="bio">
            bio <span className="editprofile-char-count">{form.bio.length}/160</span>
          </label>
          <textarea
            id="bio"
            className="editprofile-textarea"
            value={form.bio}
            onChange={handleChange('bio')}
            placeholder="fale um pouco sobre você"
            rows={3}
            maxLength={160}
          />
        </div>

        {/* Location */}
        <div className="editprofile-field">
          <label className="editprofile-label" htmlFor="location">localização</label>
          <input
            id="location"
            type="text"
            className="editprofile-input"
            value={form.location}
            onChange={handleChange('location')}
            placeholder="cidade, país"
            maxLength={50}
          />
        </div>

        {/* Website */}
        <div className="editprofile-field">
          <label className="editprofile-label" htmlFor="website">website</label>
          <input
            id="website"
            type="url"
            className="editprofile-input"
            value={form.website}
            onChange={handleChange('website')}
            placeholder="https://seusite.com"
            maxLength={100}
          />
        </div>

        {/* Avatar color */}
        <div className="editprofile-field">
          <label className="editprofile-label">cor do avatar</label>
          <div className="editprofile-color-picker">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`editprofile-color-swatch ${form.avatar_color === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => { setForm(p => ({ ...p, avatar_color: color })); setSuccess(false); }}
                aria-label={`cor ${color}`}
              >
                {form.avatar_color === color && <Check size={12} strokeWidth={3} />}
              </button>
            ))}
            <input
              type="color"
              className="editprofile-color-custom"
              value={form.avatar_color}
              onChange={(e) => { setForm(p => ({ ...p, avatar_color: e.target.value })); setSuccess(false); }}
              title="cor personalizada"
            />
          </div>
        </div>

        {/* Banner color */}
        <div className="editprofile-field">
          <label className="editprofile-label">cor do banner</label>
          <div className="editprofile-color-picker">
            {BANNER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`editprofile-color-swatch ${form.banner_color === color ? 'selected' : ''}`}
                style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }}
                onClick={() => { setForm(p => ({ ...p, banner_color: color })); setSuccess(false); }}
                aria-label={`cor ${color}`}
              >
                {form.banner_color === color && <Check size={12} strokeWidth={3} />}
              </button>
            ))}
            <input
              type="color"
              className="editprofile-color-custom"
              value={form.banner_color}
              onChange={(e) => { setForm(p => ({ ...p, banner_color: e.target.value })); setSuccess(false); }}
              title="cor personalizada"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="editprofile-save-btn"
          disabled={saving}
        >
          {saving
            ? <><Loader2 size={15} className="spin" /> salvando…</>
            : 'salvar alterações'
          }
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
