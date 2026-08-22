'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { computeAllModalities, cosmicProfileSummary, geocodeCity, CITIES, CATEGORIES } from '@/lib/zaura';
import { Sparkles, Moon, Star, ChevronLeft, ChevronRight, LogOut, Pencil, Eye, EyeOff, Loader2, Menu, X } from 'lucide-react';

const API = '/api';
const TOKEN_KEY = 'zaura_token';

// ---------------- fetch helpers ----------------
async function apiCall(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Something went wrong');
  return data;
}

// ---------------- decorative bits ----------------
const NEBULA_AUTH = 'https://images.pexels.com/photos/38695396/pexels-photo-38695396.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
const BANNER_IMG = 'https://images.pexels.com/photos/6931870/pexels-photo-6931870.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
const CARD_BACK_IMG = 'https://images.pexels.com/photos/6932066/pexels-photo-6932066.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
const NEBULA_SOFT = 'https://images.pexels.com/photos/3180831/pexels-photo-3180831.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

const Stars = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
    {[...Array(40)].map((_, i) => (
      <span
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          width: i % 5 === 0 ? 2.5 : 1.5,
          height: i % 5 === 0 ? 2.5 : 1.5,
          top: `${(i * 61) % 100}%`,
          left: `${(i * 37) % 100}%`,
          opacity: 0.15 + ((i * 13) % 40) / 100,
        }}
      />
    ))}
  </div>
);

const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(80,40,180,0.15)] ${className}`}>
    {children}
  </div>
);

const GradientText = ({ children, className = '' }) => (
  <span className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent ${className}`}>{children}</span>
);

const CAT_COLORS = {
  Astrology: 'from-violet-500/20 to-indigo-500/10 border-violet-400/20',
  Numbers: 'from-amber-500/15 to-orange-500/10 border-amber-400/20',
  Esoteric: 'from-fuchsia-500/15 to-purple-500/10 border-fuchsia-400/20',
  Personality: 'from-emerald-500/15 to-teal-500/10 border-emerald-400/20',
  Spiritual: 'from-sky-500/15 to-cyan-500/10 border-sky-400/20',
};

// ---------------- AUTH VIEW ----------------
const AuthView = ({ onAuth }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await apiCall(mode === 'login' ? 'auth/login' : 'auth/register', {
        method: 'POST',
        body: mode === 'login' ? { email, password } : { email, password, name },
      });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${NEBULA_AUTH})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070616]/60 via-[#070616]/80 to-[#070616]" />
      <Stars />
      <GlassCard className="relative w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Moon className="w-5 h-5 text-violet-300" />
            <h1 className="text-4xl tracking-[0.25em] font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>ZAURA</GradientText>
            </h1>
            <Star className="w-5 h-5 text-amber-200" />
          </div>
          <p className="text-sm text-violet-200/60">Your cosmic self, revealed through 20 mystical modalities</p>
        </div>

        <div className="flex rounded-xl bg-white/[0.05] p-1 mb-6 border border-white/10">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              data-testid={`auth-tab-${m}`}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${mode === m ? 'bg-violet-500/30 text-white' : 'text-violet-200/50 hover:text-violet-100'}`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <input
              data-testid="auth-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50"
            />
          )}
          <input
            data-testid="auth-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50"
          />
          <div className="relative">
            <input
              data-testid="auth-password-input"
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 pr-11 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-200/40 hover:text-violet-100">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p data-testid="auth-error" className="text-sm text-rose-300/90 text-center">{error}</p>}
          <button
            data-testid="auth-submit-btn"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 py-3 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {mode === 'login' ? 'Enter the Cosmos' : 'Begin Your Journey'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

// ---------------- BIRTH FORM ----------------
const BirthForm = ({ token, user, existing, onSaved }) => {
  const [fullName, setFullName] = useState(existing?.fullName || user?.name || '');
  const [birthDate, setBirthDate] = useState(existing?.birthDate || '');
  const [birthTime, setBirthTime] = useState(existing?.birthTime || '');
  const [birthCity, setBirthCity] = useState(existing?.birthCity || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const geo = useMemo(() => geocodeCity(birthCity), [birthCity]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await apiCall('profile', {
        method: 'POST',
        token,
        body: { fullName, birthDate, birthTime: birthTime || null, birthCity, lat: geo?.lat ?? null, lng: geo?.lng ?? null },
      });
      onSaved(data.profile);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${NEBULA_SOFT})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070616]/70 via-[#070616]/85 to-[#070616]" />
      <Stars />
      <GlassCard className="relative w-full max-w-lg p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>The Moment You Arrived</GradientText>
          </h2>
          <p className="text-sm text-violet-200/60">Your birth details unlock 20 layers of cosmic insight</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Full birth name</label>
            <input
              data-testid="birth-name-input"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Luna Rose Winters"
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Birth date</label>
              <input
                data-testid="birth-date-input"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-violet-400/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Birth time <span className="normal-case text-violet-200/30">(optional)</span></label>
              <input
                data-testid="birth-time-input"
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-violet-400/50 [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Birth city <span className="normal-case text-violet-200/30">(optional)</span></label>
            <input
              data-testid="birth-city-input"
              list="zaura-cities"
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              placeholder="Start typing a city..."
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50"
            />
            <datalist id="zaura-cities">
              {CITIES.map((c) => <option key={c.name} value={c.name} />)}
            </datalist>
            {birthCity && (
              <p className="text-xs mt-1.5 text-violet-200/40">
                {geo ? `\u2713 ${geo.matched} \u00b7 ${geo.lat}\u00b0, ${geo.lng}\u00b0` : 'City noted \u2014 coordinates unknown (readings still work)'}
              </p>
            )}
          </div>
          {error && <p data-testid="birth-error" className="text-sm text-rose-300/90 text-center">{error}</p>}
          <button
            data-testid="birth-submit-btn"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 py-3.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Reveal My Cosmic Profile
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

// ---------------- FLIP CARD ----------------
const CosmicFlipCard = ({ profile, summary }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="h-[340px] cursor-pointer select-none" style={{ perspective: '1400px' }} onClick={() => setFlipped(!flipped)} data-testid="cosmic-flip-card">
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* front */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden border border-violet-400/20" style={{ backfaceVisibility: 'hidden' }}>
          <div className="absolute inset-0" style={{ backgroundImage: `url(${CARD_BACK_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0824]/70 via-[#0b0824]/80 to-[#070616]/95" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            <span className="text-5xl mb-3">{summary.sunGlyph}</span>
            <h3 className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>{profile.fullName}</GradientText>
            </h3>
            <p className="text-violet-200/70 text-sm mb-4">{summary.headlines.western}</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1">{summary.headlines.lifePath}</span>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1">{summary.headlines.chinese}</span>
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1">{summary.headlines.spiritAnimal}</span>
            </div>
            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-violet-200/40">tap to flip</p>
          </div>
        </div>
        {/* back */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden border border-amber-400/20 bg-[#0b0824]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${NEBULA_SOFT})`, backgroundSize: 'cover' }} />
          <div className="relative h-full flex flex-col justify-center px-7 py-6">
            <h4 className="text-lg mb-4 text-center" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>Cosmic Signature</GradientText>
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['\u2600\ufe0f', summary.headlines.western],
                ['\ud83c\udf19', summary.headlines.moonPhase],
                ['\ud83d\udd22', summary.headlines.lifePath],
                ['\u2699\ufe0f', summary.headlines.humanDesign],
                ['\ud83c\udccf', summary.headlines.tarot],
                ['\ud83d\udd6f\ufe0f', summary.headlines.soulAge],
              ].map(([ic, txt]) => (
                <li key={txt} className="flex items-center gap-3 text-violet-100/80">
                  <span>{ic}</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-center text-xs italic text-violet-200/50">&ldquo;{summary.trait}&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- DASHBOARD ----------------
const Dashboard = ({ user, profile, modalities, summary, onOpen, onEdit, onLogout }) => {
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? modalities : modalities.filter((m) => m.category === filter);
  return (
    <div className="relative min-h-screen">
      <Stars />
      {/* header */}
      <header className="relative border-b border-white/5">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${BANNER_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070616]/40 to-[#070616]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-violet-300" />
            <span className="text-2xl tracking-[0.25em] font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>ZAURA</GradientText>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button data-testid="edit-profile-btn" onClick={onEdit} className="flex items-center gap-1.5 text-xs text-violet-200/60 hover:text-violet-100 transition-colors rounded-lg border border-white/10 px-3 py-1.5">
              <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit birth info</span>
            </button>
            <button data-testid="logout-btn" onClick={onLogout} className="flex items-center gap-1.5 text-xs text-violet-200/60 hover:text-rose-200 transition-colors rounded-lg border border-white/10 px-3 py-1.5">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-2">
            <CosmicFlipCard profile={profile} summary={summary} />
          </div>
          <GlassCard className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-200/40 mb-2">Welcome back</p>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-3" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>{profile.fullName.split(' ')[0]}, the stars remember you</GradientText>
            </h2>
            <p className="text-sm text-violet-100/70 leading-relaxed mb-5">
              Born {new Date(profile.birthDate + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              {profile.birthTime ? ` at ${profile.birthTime}` : ''}{profile.birthCity ? ` in ${profile.birthCity}` : ''} &mdash; a {summary.sunSign} soul of the {summary.element} element. Below, twenty ancient systems each read the same sacred moment.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                ['Sun Sign', `${summary.sunGlyph} ${summary.sunSign}`],
                ['Life Path', summary.headlines.lifePath?.replace('Life Path ', '')],
                ['Element', summary.element],
                ['Modalities', `${modalities.length}`],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] py-3 px-2">
                  <p className="text-lg font-medium">{val}</p>
                  <p className="text-[10px] uppercase tracking-widest text-violet-200/40 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-2 mb-6" data-testid="category-filters">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              data-testid={`filter-${c.toLowerCase()}`}
              onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-1.5 text-xs border transition-colors ${filter === c ? 'bg-violet-500/25 border-violet-400/40 text-white' : 'border-white/10 text-violet-200/50 hover:text-violet-100 hover:border-white/25'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* modality grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="modality-grid">
          {shown.map((m) => (
            <button
              key={m.id}
              data-testid={`modality-card-${m.id}`}
              onClick={() => onOpen(m.id)}
              className={`text-left rounded-2xl border bg-gradient-to-br p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(120,60,220,0.25)] ${CAT_COLORS[m.category] || 'from-white/5 to-white/0 border-white/10'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{m.icon}</span>
                <span className="text-[10px] uppercase tracking-widest text-violet-200/40 border border-white/10 rounded-full px-2 py-0.5">{m.category}</span>
              </div>
              <h3 className="text-lg font-medium mb-0.5" style={{ fontFamily: 'var(--font-mystic)' }}>{m.name}</h3>
              <p className="text-sm text-amber-100/90 mb-1.5">{m.headline}</p>
              <p className="text-xs text-violet-100/50 leading-relaxed line-clamp-2">{m.summary}</p>
            </button>
          ))}
        </div>
        <footer className="text-center text-xs text-violet-200/30 mt-12 pb-6">
          Zaura reads the sky of your first breath &mdash; explore, contemplate, and take what resonates. &#10024;
        </footer>
      </main>
    </div>
  );
};

// ---------------- DETAIL VIEW ----------------
const DetailView = ({ modalities, activeId, onSelect, onBack }) => {
  const idx = modalities.findIndex((m) => m.id === activeId);
  const m = modalities[idx];
  const [navOpen, setNavOpen] = useState(false);
  if (!m) return null;
  const prev = modalities[(idx - 1 + modalities.length) % modalities.length];
  const next = modalities[(idx + 1) % modalities.length];
  return (
    <div className="relative min-h-screen">
      <Stars />
      <header className="relative border-b border-white/5 bg-[#070616]/80 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button data-testid="back-to-dashboard-btn" onClick={onBack} className="flex items-center gap-1.5 text-sm text-violet-200/70 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-lg tracking-[0.2em]" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>ZAURA</GradientText>
          </span>
          <button className="lg:hidden text-violet-200/70" onClick={() => setNavOpen(!navOpen)} data-testid="detail-nav-toggle">
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="hidden lg:block w-24" />
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        {/* sidebar nav */}
        <aside className={`${navOpen ? 'block' : 'hidden'} lg:block`}>
          <GlassCard className="p-3 lg:sticky lg:top-24 max-h-[70vh] overflow-y-auto">
            {modalities.map((item) => (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => { onSelect(item.id); setNavOpen(false); }}
                className={`w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${item.id === m.id ? 'bg-violet-500/20 text-white' : 'text-violet-200/50 hover:text-violet-100 hover:bg-white/[0.04]'}`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </GlassCard>
        </aside>

        {/* content */}
        <div>
          <GlassCard className="p-6 sm:p-10 mb-6" data-testid="detail-content">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl">{m.icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200/40">{m.category}</p>
                <h1 className="text-3xl sm:text-4xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
                  <GradientText>{m.name}</GradientText>
                </h1>
              </div>
            </div>
            <p className="text-lg text-amber-100/90 mt-3 mb-2">{m.headline}</p>
            <p className="text-sm text-violet-100/70 leading-relaxed mb-8">{m.summary}</p>
            <div className="space-y-5">
              {m.sections.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                    <h3 className="text-xs uppercase tracking-[0.25em] text-violet-200/50">{s.label}</h3>
                    <span className="text-base text-amber-100/90 font-medium">{s.value}</span>
                  </div>
                  {s.text && <p className="text-sm text-violet-100/70 leading-relaxed">{s.text}</p>}
                </div>
              ))}
            </div>
          </GlassCard>
          <div className="flex items-center justify-between">
            <button data-testid="prev-modality-btn" onClick={() => onSelect(prev.id)} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-violet-200/70 hover:text-white hover:border-violet-400/40 transition-colors">
              <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">{prev.name}</span><span className="sm:hidden">Prev</span>
            </button>
            <span className="text-xs text-violet-200/40">{idx + 1} / {modalities.length}</span>
            <button data-testid="next-modality-btn" onClick={() => onSelect(next.id)} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-violet-200/70 hover:text-white hover:border-violet-400/40 transition-colors">
              <span className="hidden sm:inline">{next.name}</span><span className="sm:hidden">Next</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- ROOT APP ----------------
const App = () => {
  const [view, setView] = useState('loading'); // loading | auth | birth | dashboard | detail
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeModality, setActiveModality] = useState(null);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!t) { setView('auth'); return; }
    apiCall('auth/me', { token: t })
      .then((data) => {
        setToken(t);
        setUser(data.user);
        if (data.profile) { setProfile(data.profile); setView('dashboard'); }
        else setView('birth');
      })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setView('auth'); });
  }, []);

  const handleAuth = useCallback((t, u) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    apiCall('profile', { token: t }).then((d) => {
      if (d.profile) { setProfile(d.profile); setView('dashboard'); }
      else setView('birth');
    }).catch(() => setView('birth'));
  }, []);

  const handleLogout = useCallback(() => {
    if (token) apiCall('auth/logout', { method: 'POST', token }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null); setUser(null); setProfile(null);
    setView('auth');
  }, [token]);

  const modalities = useMemo(() => (profile ? computeAllModalities(profile) : []), [profile]);
  const summary = useMemo(() => (profile ? cosmicProfileSummary(profile) : null), [profile]);

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Moon className="w-8 h-8 text-violet-300 mx-auto mb-3" />
          <p className="text-sm text-violet-200/50 tracking-[0.3em] uppercase">Aligning the stars...</p>
        </div>
      </div>
    );
  }
  if (view === 'auth') return <AuthView onAuth={handleAuth} />;
  if (view === 'birth') return <BirthForm token={token} user={user} existing={profile} onSaved={(p) => { setProfile(p); setView('dashboard'); }} />;
  if (view === 'detail' && profile) {
    return <DetailView modalities={modalities} activeId={activeModality} onSelect={setActiveModality} onBack={() => setView('dashboard')} />;
  }
  if (view === 'dashboard' && profile) {
    return (
      <Dashboard
        user={user}
        profile={profile}
        modalities={modalities}
        summary={summary}
        onOpen={(id) => { setActiveModality(id); setView('detail'); }}
        onEdit={() => setView('birth')}
        onLogout={handleLogout}
      />
    );
  }
  return <AuthView onAuth={handleAuth} />;
};

export default App;
