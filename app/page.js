'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { computeAllModalities, cosmicProfileSummary, geocodeCity, CITIES, CATEGORIES, computeCompatibility, computeDailyReading, computeWeeklyForecast } from '@/lib/zaura';
import { Sparkles, Moon, Star, ChevronLeft, ChevronRight, LogOut, Pencil, Eye, EyeOff, Loader2, Menu, X, Download, Heart, Trash2, MessageCircle, Send, Zap, Camera, Upload, Share2, History, UserPlus, Check } from 'lucide-react';

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

const GlassCard = ({ children, className = '', ...rest }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(80,40,180,0.15)] ${className}`} {...rest}>
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
  Physical: 'from-rose-500/15 to-pink-500/10 border-rose-400/20',
};

const PHYSICAL_MODALITIES = [
  {
    id: 'palm', name: 'Palm Reading', category: 'Physical', icon: '\uD83D\uDD90\uFE0F',
    headline: 'The map in your hand',
    summary: 'Photograph your palm and let the oracle read your heart, head and life lines, mounts and hand element.',
  },
  {
    id: 'handwriting', name: 'Handwriting Analysis', category: 'Physical', icon: '\u270D\uFE0F',
    headline: 'Your soul in ink',
    summary: 'Photograph a handwriting sample and reveal what your slant, pressure and spacing say about your inner nature.',
  },
  {
    id: 'face', name: 'Face Reading', category: 'Physical', icon: '\uD83C\uDFAD',
    headline: 'The character in your features',
    summary: 'Take a front-facing portrait and let the oracle read your face shape, brow, eyes and jaw in the mian xiang tradition.',
  },
];
const ALL_CATEGORIES = [...CATEGORIES, 'Physical'];

// ---------------- AUTH VIEW ----------------
const AuthView = ({ onAuth, inviteInfo }) => {
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

        {inviteInfo && (
          <div data-testid="invite-banner" className="mb-6 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-3.5 text-center">
            <p className="text-sm text-fuchsia-100/90">
              {inviteInfo.sunGlyph} <span className="font-medium">{inviteInfo.inviterFirstName}</span> ({inviteInfo.sunSign}) invited you to read your cosmic bond
            </p>
            <p className="text-xs text-violet-200/50 mt-1">Join and enter your birth details &mdash; your compatibility reading will appear instantly</p>
          </div>
        )}

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

// ---------------- WEEK GREETING BANNER ----------------
const weekKey = () => {
  const d = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toDateString();
};

const WeekBanner = ({ profile }) => {
  const [fc, setFc] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('zaura_week_seen') !== weekKey()) {
      setFc(computeWeeklyForecast(profile));
      setVisible(true);
    }
  }, [profile]);
  if (!visible || !fc) return null;
  const dismiss = () => {
    localStorage.setItem('zaura_week_seen', weekKey());
    setVisible(false);
  };
  return (
    <div data-testid="week-banner" className="relative mb-6 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-500/15 via-sky-500/10 to-fuchsia-500/15 p-4 sm:p-5 shadow-[0_0_40px_rgba(140,110,240,0.12)]">
      <div className="flex items-start gap-3 pr-8">
        <Sparkles className="w-5 h-5 text-violet-300 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-violet-100">
            A new week opens, {profile.fullName.split(' ')[0]} &mdash; here is your cosmic weather
          </p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs" data-testid="week-banner-highlights">
            <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-100/85">&#128151; Love peaks {fc.best.love.weekday} {fc.best.love.dayNum}</span>
            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-amber-100/85">&#9874;&#65039; Work flows {fc.best.work.weekday} {fc.best.work.dayNum}</span>
            <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-sky-100/85">&#127769; Rest calls {fc.best.rest.weekday} {fc.best.rest.dayNum}</span>
          </div>
        </div>
      </div>
      <button data-testid="week-banner-dismiss" onClick={dismiss} className="absolute top-3 right-3 text-violet-200/50 hover:text-violet-100 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ---------------- WEEKLY FORECAST ----------------
const WeeklyForecast = ({ profile }) => {
  const [fc, setFc] = useState(null);
  useEffect(() => { setFc(computeWeeklyForecast(profile)); }, [profile]);
  if (!fc) return null;
  const BARS = [
    ['love', 'bg-rose-400/80', '\uD83D\uDC97'],
    ['work', 'bg-amber-400/80', '\u2692\uFE0F'],
    ['rest', 'bg-sky-400/80', '\uD83C\uDF19'],
  ];
  const bestKey = (day) => BARS.filter(([k]) => fc.best[k].dayNum === day.dayNum && fc.best[k].weekday === day.weekday).map(([k, , ic]) => ic);
  return (
    <GlassCard className="p-5 sm:p-6 mb-6" data-testid="weekly-forecast-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
          <GradientText>Seven-Day Cosmic Outlook</GradientText>
        </h2>
        <div className="flex flex-wrap gap-2 text-xs" data-testid="forecast-best-days">
          <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-rose-100/85">&#128151; Love: {fc.best.love.weekday} {fc.best.love.dayNum}</span>
          <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-amber-100/85">&#9874;&#65039; Work: {fc.best.work.weekday} {fc.best.work.dayNum}</span>
          <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-sky-100/85">&#127769; Rest: {fc.best.rest.weekday} {fc.best.rest.dayNum}</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" data-testid="forecast-grid">
        {fc.days.map((d) => (
          <div
            key={`${d.weekday}${d.dayNum}`}
            className={`rounded-xl border p-2 sm:p-3 text-center ${d.isToday ? 'border-violet-400/50 bg-violet-500/[0.12]' : 'border-white/8 bg-white/[0.03]'}`}
            title={`${d.weekday} ${d.dayNum} \u00b7 Personal Day ${d.personalDay} (${d.themeName}) \u00b7 ${d.moonPhase} \u00b7 Love ${d.love} / Work ${d.work} / Rest ${d.rest}`}
          >
            <p className="text-[10px] uppercase tracking-widest text-violet-200/40">{d.weekday}</p>
            <p className="text-sm font-medium text-violet-100/90">{d.dayNum}</p>
            <p className="text-base leading-none my-1">{d.moonIcon}</p>
            <p className="text-[10px] text-amber-100/70 mb-1.5">Day {d.personalDay}</p>
            <div className="space-y-1">
              {BARS.map(([k, color]) => (
                <div key={k} className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${d[k]}%` }} />
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-1 h-4">{bestKey(d).join(' ')}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-violet-200/30 mt-2">Bars: <span className="text-rose-200/60">love</span> &middot; <span className="text-amber-200/60">work</span> &middot; <span className="text-sky-200/60">rest</span> &mdash; from your personal day numbers, moon phases and planetary day rulers</p>
    </GlassCard>
  );
};

// ---------------- AI SOUL SYNTHESIS ----------------
const SoulSynthesis = ({ token }) => {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiCall('synthesis', { token })
      .then((d) => setNarrative(d.narrative))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [token]);

  const generate = async (regenerate = false) => {
    setLoading(true);
    setError('');
    try {
      const d = await apiCall('synthesis', { method: 'POST', token, body: { regenerate } });
      setNarrative(d.narrative);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const lines = narrative?.text ? narrative.text.split('\n').map((l) => l.trim()).filter(Boolean) : [];
  const title = (lines[0] || '').replace(/^[#*\s]+/, '').replace(/[*\s]+$/, '');
  const paras = lines.slice(1).map((p) => p.replace(/\*\*/g, ''));

  return (
    <GlassCard className="p-6 sm:p-8 mb-10" data-testid="soul-synthesis-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#128302;</span>
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>AI Soul Synthesis</GradientText>
            </h2>
            <p className="text-xs text-violet-200/50">All twenty readings, woven into one story of you</p>
          </div>
        </div>
        {narrative && !loading && (
          <button
            data-testid="synthesis-regenerate-btn"
            onClick={() => generate(true)}
            className="text-xs rounded-lg border border-white/10 px-3 py-1.5 text-violet-200/60 hover:text-violet-100 hover:border-violet-400/40 transition-colors"
          >
            Weave anew
          </button>
        )}
      </div>

      {loading && (
        <div className="py-10 text-center" data-testid="synthesis-loading">
          <Loader2 className="w-6 h-6 animate-spin text-violet-300 mx-auto mb-3" />
          <p className="text-sm text-violet-200/60 italic">The oracle is reading all twenty charts and weaving your story... this takes a moment.</p>
        </div>
      )}

      {!loading && narrative && (
        <div data-testid="synthesis-narrative">
          <h3 className="text-xl text-amber-100/90 mb-4 italic" style={{ fontFamily: 'var(--font-mystic)' }}>{title}</h3>
          <div className="space-y-4 text-sm leading-relaxed text-violet-100/80">
            {paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <p className="mt-5 text-[10px] uppercase tracking-widest text-violet-200/30">Woven {new Date(narrative.createdAt).toLocaleString()} &middot; for reflection, not prediction</p>
        </div>
      )}

      {!loading && !narrative && checked && (
        <div className="py-6 text-center">
          <p className="text-sm text-violet-100/60 mb-5 max-w-xl mx-auto">
            Twenty ancient systems have each read your birth moment. Let the oracle weave every thread &mdash; your sun and shadow, numbers and totems &mdash; into one flowing narrative of who you are.
          </p>
          <button
            data-testid="synthesis-generate-btn"
            onClick={() => generate(false)}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Weave My Soul Story
          </button>
        </div>
      )}

      {error && <p data-testid="synthesis-error" className="mt-4 text-sm text-rose-300/90 text-center">{error}</p>}
    </GlassCard>
  );
};

// ---------------- DAILY COSMIC READING + POWER DAY ----------------
const POWER_DAYS = [1, 8];

const PowerDayBanner = ({ daily }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!daily || !POWER_DAYS.includes(daily.personalDay)) return;
    const key = 'zaura_powerday_seen';
    const today = new Date().toDateString();
    if (typeof window !== 'undefined' && localStorage.getItem(key) !== today) setVisible(true);
  }, [daily]);
  if (!visible || !daily) return null;
  const dismiss = () => {
    localStorage.setItem('zaura_powerday_seen', new Date().toDateString());
    setVisible(false);
  };
  return (
    <div data-testid="power-day-banner" className="relative mb-6 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-fuchsia-500/10 to-violet-500/15 p-4 sm:p-5 shadow-[0_0_40px_rgba(240,200,120,0.12)]">
      <div className="flex items-start gap-3 pr-8">
        <Zap className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-100">
            {daily.personalDay === 1 ? 'Power Day \u2014 a new cycle opens for you today' : 'Power Day \u2014 the gates of manifestation stand open'}
          </p>
          <p className="text-xs text-violet-100/70 mt-0.5">
            Your Personal Day shifted to {daily.personalDay} &middot; {daily.themeName}. {daily.themeText}
          </p>
        </div>
      </div>
      <button data-testid="power-day-dismiss" onClick={dismiss} className="absolute top-3 right-3 text-amber-200/50 hover:text-amber-100 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const DailyReading = ({ profile }) => {
  const [daily, setDaily] = useState(null);
  useEffect(() => { setDaily(computeDailyReading(profile)); }, [profile]);
  if (!daily) return null;
  const isPower = POWER_DAYS.includes(daily.personalDay);
  return (
    <>
    <PowerDayBanner daily={daily} />
    <GlassCard className="p-5 sm:p-6 mb-6" data-testid="daily-reading-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-mystic)' }}>
          <span className="text-lg">{daily.moonIcon}</span>
          <GradientText>Today&rsquo;s Cosmic Reading</GradientText>
        </h2>
        <span className="text-xs text-violet-200/40">{daily.dateLabel}</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 ${isPower ? 'border-amber-400/50 bg-amber-500/[0.12] shadow-[0_0_24px_rgba(240,200,120,0.15)]' : 'border-amber-400/15 bg-amber-500/[0.06]'}`} data-testid="daily-personal-day">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-semibold text-amber-100/90">{daily.personalDay}</span>
            <span className="text-xs uppercase tracking-widest text-violet-200/40">Personal Day &middot; {daily.themeName}</span>
            {isPower && <Zap className="w-3.5 h-3.5 text-amber-300" />}
          </div>
          <p className="text-xs text-violet-100/60 leading-relaxed">{daily.themeText}</p>
        </div>
        <div className="rounded-xl border border-violet-400/15 bg-violet-500/[0.06] p-4" data-testid="daily-moon">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg">{daily.moonIcon}</span>
            <span className="text-xs uppercase tracking-widest text-violet-200/40">{daily.moonPhase}</span>
          </div>
          <p className="text-xs text-violet-100/60 leading-relaxed">{daily.moonText}</p>
        </div>
        <div className="rounded-xl border border-sky-400/15 bg-sky-500/[0.06] p-4" data-testid="daily-ruler">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg">&#10024;</span>
            <span className="text-xs uppercase tracking-widest text-violet-200/40">Day of {daily.rulerName}</span>
          </div>
          <p className="text-xs text-violet-100/60 leading-relaxed">A day of {daily.rulerText}.</p>
        </div>
      </div>
    </GlassCard>
    </>
  );
};

// ---------------- PHOTO READING (Palm / Handwriting) ----------------
const PHOTO_META = {
  palm: {
    title: 'Palm Reading', icon: '\uD83D\uDD90\uFE0F',
    desc: 'Hold your dominant palm open, flat and well-lit. The oracle will read your lines, mounts and hand element.',
    tip: 'Best results: bright light, palm filling the frame, fingers slightly spread.',
  },
  handwriting: {
    title: 'Handwriting Analysis', icon: '\u270D\uFE0F',
    desc: 'Photograph a few handwritten lines \u2014 a journal entry, a note, or a signature on unlined paper.',
    tip: 'Best results: 3+ lines of natural cursive or print, written in ink, evenly lit.',
  },
  face: {
    title: 'Face Reading', icon: '\uD83C\uDFAD',
    desc: 'Take a relaxed, front-facing portrait in good light. The oracle reads your features in the ancient mian xiang tradition.',
    tip: 'Best results: face the camera directly, neutral expression, hair away from forehead, soft even light.',
  },
};

const PhotoReadingView = ({ token, type, onBack }) => {
  const meta = PHOTO_META[type];
  const [reading, setReading] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [b64, setB64] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const fileRef = React.useRef(null);

  useEffect(() => {
    apiCall('photo-readings', { token })
      .then((d) => setReading((d.readings || []).find((r) => r.type === type) || null))
      .catch(() => {})
      .finally(() => setLoaded(true));
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, type]);

  const stopCamera = () => {
    streamRef.current?.getTracks?.().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: type === 'face' ? 'user' : 'environment', width: { ideal: 1280 } } });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 50);
    } catch {
      setError('Camera unavailable \u2014 you can upload a photo instead.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setPreview(dataUrl);
    setB64(dataUrl.replace(/^data:image\/\w+;base64,/, ''));
    stopCamera();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const { fileToBase64 } = await import('@/lib/share');
      const raw = await fileToBase64(file, 1024);
      setB64(raw);
      setPreview(`data:image/jpeg;base64,${raw}`);
      stopCamera();
    } catch {
      setError('Could not read that image \u2014 try another file.');
    }
    e.target.value = '';
  };

  const analyze = async () => {
    if (!b64) return;
    setBusy(true); setError('');
    try {
      const d = await apiCall('photo-reading', { method: 'POST', token, body: { type, imageBase64: b64 } });
      setReading(d.reading);
      setShowCapture(false);
      setPreview(null); setB64(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const lines = reading?.text ? reading.text.split('\n').map((l) => l.trim()).filter(Boolean) : [];
  const title = (lines[0] || '').replace(/^[#*\s]+/, '').replace(/[*\s]+$/, '');
  const paras = lines.slice(1).map((p) => p.replace(/\*\*/g, ''));
  const captureMode = showCapture || (!reading && loaded);

  return (
    <div className="relative min-h-screen">
      <Stars />
      <header className="relative border-b border-white/5 bg-[#070616]/80 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button data-testid="photo-back-btn" onClick={() => { stopCamera(); onBack(); }} className="flex items-center gap-1.5 text-sm text-violet-200/70 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-lg tracking-[0.2em]" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>ZAURA</GradientText>
          </span>
          <span className="w-24" />
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">{meta.icon}</span>
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>{meta.title}</GradientText>
          </h1>
          <p className="text-sm text-violet-200/60 max-w-md mx-auto">{meta.desc}</p>
        </div>

        {busy && (
          <GlassCard className="p-10 text-center" data-testid="photo-analyzing">
            <Loader2 className="w-6 h-6 animate-spin text-violet-300 mx-auto mb-3" />
            <p className="text-sm text-violet-200/60 italic">The oracle is studying your {type === 'palm' ? 'palm' : 'handwriting'}... this takes a moment.</p>
          </GlassCard>
        )}

        {!busy && reading && !showCapture && (
          <GlassCard className="p-6 sm:p-10" data-testid="photo-reading-result">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl text-amber-100/90 italic" style={{ fontFamily: 'var(--font-mystic)' }}>{title}</h2>
              <button data-testid="photo-new-btn" onClick={() => { setShowCapture(true); setError(''); }} className="text-xs rounded-lg border border-white/10 px-3 py-1.5 text-violet-200/60 hover:text-violet-100 hover:border-violet-400/40 transition-colors flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> New photo
              </button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-violet-100/80">
              {paras.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-widest text-violet-200/30">Read {new Date(reading.createdAt).toLocaleString()} &middot; for reflection, not prediction</p>
          </GlassCard>
        )}

        {!busy && captureMode && (
          <GlassCard className="p-6 sm:p-8" data-testid="photo-capture-panel">
            {cameraOn && (
              <div className="mb-4">
                <video ref={videoRef} playsInline muted className="w-full rounded-xl border border-white/10 bg-black" data-testid="photo-video" />
                <div className="flex gap-3 mt-3 justify-center">
                  <button data-testid="photo-capture-btn" onClick={capture} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                  <button onClick={stopCamera} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-violet-200/60 hover:text-violet-100 transition-colors">Cancel</button>
                </div>
              </div>
            )}
            {!cameraOn && preview && (
              <div className="mb-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="max-h-72 mx-auto rounded-xl border border-white/10" data-testid="photo-preview" />
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  <button data-testid="photo-analyze-btn" onClick={analyze} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Reveal My Reading
                  </button>
                  <button onClick={() => { setPreview(null); setB64(null); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-violet-200/60 hover:text-violet-100 transition-colors">Retake</button>
                </div>
              </div>
            )}
            {!cameraOn && !preview && (
              <div className="text-center py-6">
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  <button data-testid="photo-camera-btn" onClick={startCamera} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 py-3 text-sm font-medium transition-colors flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Take Photo
                  </button>
                  <button data-testid="photo-upload-btn" onClick={() => fileRef.current?.click()} className="rounded-xl border border-violet-400/25 bg-violet-500/10 hover:bg-violet-500/20 px-5 py-3 text-sm text-violet-100/90 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload Photo
                  </button>
                  <input ref={fileRef} data-testid="photo-file-input" type="file" accept="image/*" onChange={onFile} className="hidden" />
                </div>
                <p className="text-xs text-violet-200/40">{meta.tip}</p>
                <p className="text-[10px] text-violet-200/30 mt-2">Your photo is analyzed once and never stored.</p>
                {reading && (
                  <button onClick={() => setShowCapture(false)} className="mt-4 text-xs text-violet-200/50 hover:text-violet-100 underline underline-offset-4">Back to my current reading</button>
                )}
              </div>
            )}
            {error && <p data-testid="photo-error" className="mt-2 text-sm text-rose-300/90 text-center">{error}</p>}
          </GlassCard>
        )}
      </div>
    </div>
  );
};

// ---------------- READING TIMELINE ----------------
const TYPE_COLORS = {
  profile: 'border-amber-400/40 bg-amber-500/15',
  synthesis: 'border-violet-400/40 bg-violet-500/15',
  photo: 'border-rose-400/40 bg-rose-500/15',
  partner: 'border-fuchsia-400/40 bg-fuchsia-500/15',
  bondStory: 'border-pink-400/40 bg-pink-500/15',
  oracle: 'border-sky-400/40 bg-sky-500/15',
};

const TimelineView = ({ token, profile, onBack, onJump }) => {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiCall('timeline', { token })
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [token]);

  const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="relative min-h-screen">
      <Stars />
      <header className="relative border-b border-white/5 bg-[#070616]/80 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button data-testid="timeline-back-btn" onClick={onBack} className="flex items-center gap-1.5 text-sm text-violet-200/70 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-lg tracking-[0.2em]" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>ZAURA</GradientText>
          </span>
          <span className="w-24" />
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <History className="w-6 h-6 text-violet-300 mx-auto mb-2" />
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Your Journey</GradientText>
          </h1>
          <p className="text-sm text-violet-200/60">Every reading, story and bond &mdash; the unfolding record of {profile.fullName.split(' ')[0]}&rsquo;s path with Zaura</p>
          <p className="text-xs text-violet-200/35 mt-1.5">Tap any moment to revisit it instantly</p>
        </div>

        {!loaded && (
          <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin text-violet-300 mx-auto" /></div>
        )}

        {loaded && events.length === 0 && (
          <GlassCard className="p-10 text-center">
            <p className="text-sm text-violet-200/60">Your journey is just beginning &mdash; explore a modality or ask the oracle to write your first chapter.</p>
          </GlassCard>
        )}

        {loaded && events.length > 0 && (
          <div className="relative pl-12" data-testid="timeline-list">
            <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-400/50 via-fuchsia-400/25 to-transparent" />
            <div className="space-y-5">
              {events.map((e) => (
                <div key={e.id} className="relative" data-testid={`timeline-event-${e.type}`}>
                  <div className={`absolute -left-[34px] top-1 w-9 h-9 rounded-full border flex items-center justify-center text-base backdrop-blur ${TYPE_COLORS[e.type] || 'border-white/20 bg-white/10'}`}>
                    {e.icon}
                  </div>
                  <button
                    data-testid={`timeline-jump-${e.type}`}
                    onClick={() => onJump(e)}
                    className="w-full text-left group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-violet-400/40 hover:bg-violet-500/[0.07] transition-colors p-4 ml-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-violet-100/90 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mystic)' }}>
                        {e.title}
                        <ChevronRight className="w-3.5 h-3.5 text-violet-200/30 group-hover:text-violet-200/80 transition-colors" />
                      </h3>
                      <span className="text-[10px] text-violet-200/40 whitespace-nowrap">{fmt(e.date)} &middot; {fmtTime(e.date)}</span>
                    </div>
                    <p className="text-xs text-violet-100/60 leading-relaxed italic">{e.subtitle}</p>
                  </button>
                </div>
              ))}
            </div>
            <div className="relative mt-8 text-center">
              <p className="text-xs text-violet-200/30">&#10038; the story continues &#10038;</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- ORACLE CHAT ----------------
const OracleChat = ({ token, profile, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const bottomRef = React.useRef(null);

  useEffect(() => {
    apiCall('oracle', { token })
      .then((d) => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError('');
    setInput('');
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'user', text }]);
    setBusy(true);
    try {
      const d = await apiCall('oracle', { method: 'POST', token, body: { message: text } });
      setMessages((m) => [...m, d.reply]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const clearChat = async () => {
    try { await apiCall('oracle', { method: 'DELETE', token }); setMessages([]); setError(''); } catch {}
  };

  const SUGGESTIONS = [
    'What is my greatest hidden strength?',
    'How do my Sun and Moon signs work together?',
    'What should I focus on this year?',
    'What does my Human Design type mean for my work?',
  ];

  return (
    <div className="relative min-h-screen flex flex-col">
      <Stars />
      <header className="relative border-b border-white/5 bg-[#070616]/80 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button data-testid="oracle-back-btn" onClick={onBack} className="flex items-center gap-1.5 text-sm text-violet-200/70 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="text-center">
            <span className="text-lg tracking-[0.2em] block" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>THE ORACLE</GradientText>
            </span>
          </div>
          <button data-testid="oracle-clear-btn" onClick={clearChat} className="text-xs text-violet-200/50 hover:text-rose-200 transition-colors rounded-lg border border-white/10 px-3 py-1.5">
            New thread
          </button>
        </div>
      </header>

      <div className="relative flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <div className="flex-1 space-y-4 pb-4" data-testid="oracle-messages">
          {loaded && messages.length === 0 && (
            <div className="text-center py-10">
              <span className="text-4xl block mb-3">&#128302;</span>
              <p className="text-sm text-violet-100/70 mb-1" style={{ fontFamily: 'var(--font-mystic)' }}>The Oracle knows your twenty readings, {profile.fullName.split(' ')[0]}.</p>
              <p className="text-xs text-violet-200/40 mb-6">Ask anything about your cosmic profile.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs rounded-full border border-violet-400/25 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 text-violet-100/70 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-violet-600/40 border border-violet-400/20 text-violet-50' : 'bg-white/[0.05] border border-white/10 text-violet-100/85'}`}>
                {m.role === 'assistant' && <span className="text-xs text-amber-200/70 block mb-1" style={{ fontFamily: 'var(--font-mystic)' }}>Zaura</span>}
                {m.text.split('\n').filter(Boolean).map((p, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{p}</p>)}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start" data-testid="oracle-thinking">
              <div className="rounded-2xl px-4 py-3 bg-white/[0.05] border border-white/10 text-sm text-violet-200/50 italic flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> The oracle gazes into your chart...
              </div>
            </div>
          )}
          {error && <p data-testid="oracle-error" className="text-center text-sm text-rose-300/90">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="sticky bottom-4 flex gap-2">
          <input
            data-testid="oracle-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the oracle about your readings..."
            maxLength={1000}
            className="flex-1 rounded-xl bg-[#0d0a24]/90 backdrop-blur-lg border border-white/15 px-4 py-3 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50"
          />
          <button
            data-testid="oracle-send-btn"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-3 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

// ---------------- AI BOND STORY ----------------
const BondStory = ({ token, partnerId }) => {
  const [story, setStory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStory(null); setError('');
    if (!partnerId) return;
    apiCall(`bond-story?partnerId=${partnerId}`, { token }).then((d) => setStory(d.story)).catch(() => {});
  }, [partnerId, token]);

  if (!partnerId) return null;

  const generate = async (regenerate = false) => {
    setBusy(true); setError('');
    try {
      const d = await apiCall('bond-story', { method: 'POST', token, body: { partnerId, regenerate } });
      setStory(d.story);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const lines = story?.text ? story.text.split('\n').map((l) => l.trim()).filter(Boolean) : [];
  const title = (lines[0] || '').replace(/^[#*\s]+/, '').replace(/[*\s]+$/, '');
  const paras = lines.slice(1).map((p) => p.replace(/\*\*/g, ''));

  return (
    <GlassCard className="p-6 sm:p-8 mt-6" data-testid="bond-story-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-mystic)' }}>
          <span>&#128149;</span> <GradientText>AI Bond Story</GradientText>
        </h3>
        {story && !busy && (
          <button data-testid="bond-story-regenerate" onClick={() => generate(true)} className="text-xs rounded-lg border border-white/10 px-3 py-1.5 text-violet-200/60 hover:text-violet-100 hover:border-violet-400/40 transition-colors">
            Retell
          </button>
        )}
      </div>
      {busy && (
        <div className="py-8 text-center" data-testid="bond-story-loading">
          <Loader2 className="w-5 h-5 animate-spin text-violet-300 mx-auto mb-2" />
          <p className="text-sm text-violet-200/60 italic">The oracle is reading the space between your two charts...</p>
        </div>
      )}
      {!busy && story && (
        <div data-testid="bond-story-text">
          <h4 className="text-lg text-amber-100/90 mb-3 italic" style={{ fontFamily: 'var(--font-mystic)' }}>{title}</h4>
          <div className="space-y-3 text-sm leading-relaxed text-violet-100/80">
            {paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      )}
      {!busy && !story && (
        <div className="text-center py-4">
          <p className="text-sm text-violet-100/60 mb-4">Let the oracle tell the myth of these two souls \u2014 their harmonies, frictions, and the practice that tends the bond.</p>
          <button data-testid="bond-story-generate" onClick={() => generate(false)} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Tell Our Story
          </button>
        </div>
      )}
      {error && <p data-testid="bond-story-error" className="mt-3 text-sm text-rose-300/90 text-center">{error}</p>}
    </GlassCard>
  );
};

// ---------------- BOND COMPARISON ----------------
const BondComparison = ({ profile, partners }) => {
  const rows = useMemo(() => partners.map((p) => {
    try {
      return { p, r: computeCompatibility(profile, { fullName: p.partnerName, birthDate: p.birthDate, birthTime: p.birthTime }) };
    } catch { return null; }
  }).filter(Boolean).sort((x, y2) => y2.r.overall - x.r.overall), [profile, partners]);

  if (rows.length < 2) return null;
  const cols = rows[0].r.aspects;
  const best = rows[0].r.overall;

  return (
    <GlassCard className="p-5 sm:p-6 mb-8" data-testid="bond-comparison">
      <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'var(--font-mystic)' }}>
        <GradientText>Compare Your Bonds</GradientText>
      </h3>
      <p className="text-xs text-violet-200/40 mb-4">All saved bonds, side by side across the six systems</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-violet-200/40">
              <th className="text-left font-normal pb-2 pr-3">Bond</th>
              <th className="text-center font-normal pb-2 px-2">Overall</th>
              {cols.map((c) => (
                <th key={c.id} className="text-center font-normal pb-2 px-1" title={c.name}>
                  <span className="text-sm">{c.icon}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, r }) => (
              <tr key={p.id} className="border-t border-white/5" data-testid={`compare-row-${p.id}`}>
                <td className="py-2.5 pr-3">
                  <span className="text-violet-100/85">{p.partnerName}</span>
                  {r.overall === best && <span className="ml-2 text-[9px] uppercase tracking-widest text-amber-200/70 border border-amber-400/25 rounded-full px-1.5 py-0.5">strongest</span>}
                </td>
                <td className="text-center px-2">
                  <span className={`inline-block min-w-[2.5rem] rounded-lg px-2 py-1 text-sm font-medium ${r.overall === best ? 'bg-amber-500/20 text-amber-100' : 'bg-white/[0.05] text-violet-100/80'}`}>{r.overall}</span>
                </td>
                {r.aspects.map((a) => (
                  <td key={a.id} className="text-center px-1 py-2.5">
                    <span
                      className="inline-block min-w-[2.2rem] rounded-md px-1.5 py-1 text-xs"
                      style={{ backgroundColor: `rgba(167,139,250,${(a.score / 100) * 0.38})`, color: a.score >= 75 ? '#fde9b8' : 'rgba(220,214,245,0.75)' }}
                      title={`${a.name}: ${a.score}`}
                    >
                      {a.score}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-violet-200/30 mt-3">{cols.map((c) => `${c.icon} ${c.name}`).join('  \u00b7  ')}</p>
    </GlassCard>
  );
};

// ---------------- COMPATIBILITY READING ----------------
const ScoreRing = ({ score }) => {
  const r = 52, c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#zgrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        <defs>
          <linearGradient id="zgrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f0d296" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold" data-testid="compat-score">{score}</span>
        <span className="text-[9px] uppercase tracking-widest text-violet-200/40">of 100</span>
      </div>
    </div>
  );
};

const CompatibilityView = ({ profile, token, onBack, initialPartnerId }) => {
  const [pName, setPName] = useState('');
  const [pDate, setPDate] = useState('');
  const [pTime, setPTime] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [bondShareBusy, setBondShareBusy] = useState(false);
  const [currentPartnerId, setCurrentPartnerId] = useState(null);

  const shareBond = async () => {
    if (!report) return;
    setBondShareBusy(true);
    try {
      const { generateBondShareCard } = await import('@/lib/share');
      await generateBondShareCard({ report });
    } catch (e) {
      console.error('Bond share failed:', e);
    } finally {
      setBondShareBusy(false);
    }
  };

  const loadPartners = useCallback(() => {
    apiCall('partners', { token }).then((d) => setPartners(d.partners || [])).catch(() => {});
  }, [token]);
  useEffect(() => { loadPartners(); }, [loadPartners]);

  const runReading = (name, date, time, save = true, knownId = null) => {
    setError('');
    setCurrentPartnerId(knownId);
    try {
      const partner = { fullName: name.trim(), birthDate: date, birthTime: time || null };
      const rep = computeCompatibility(profile, partner);
      setReport(rep);
      if (save) {
        apiCall('partners', {
          method: 'POST', token,
          body: { partnerName: name.trim(), birthDate: date, birthTime: time || null, overall: rep.overall, verdict: rep.verdict },
        }).then((d) => { setCurrentPartnerId(d.partner?.id || null); loadPartners(); }).catch(() => {});
      }
    } catch {
      setError('Could not compute the reading \u2014 check the birth date.');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!pName.trim() || !pDate) { setError('Name and birth date are required'); return; }
    runReading(pName, pDate, pTime);
  };

  const openSaved = (p) => {
    setPName(p.partnerName); setPDate(p.birthDate); setPTime(p.birthTime || '');
    runReading(p.partnerName, p.birthDate, p.birthTime, false, p.id);
  };

  const jumpedRef = React.useRef(false);
  useEffect(() => {
    if (!initialPartnerId || jumpedRef.current || !partners.length) return;
    const p = partners.find((x) => x.id === initialPartnerId);
    if (p) { jumpedRef.current = true; openSaved(p); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partners, initialPartnerId]);

  const removeSaved = async (e, p) => {
    e.stopPropagation();
    try { await apiCall(`partners/${p.id}`, { method: 'DELETE', token }); loadPartners(); } catch {}
  };

  const downloadCompatPdf = async () => {
    if (!report) return;
    setPdfBusy(true);
    try {
      let storyText = null;
      if (currentPartnerId) {
        try {
          const d = await apiCall(`bond-story?partnerId=${currentPartnerId}`, { token });
          storyText = d.story?.text || null;
        } catch {}
      }
      const { generateCompatibilityPdf } = await import('@/lib/pdf');
      await generateCompatibilityPdf({ report, storyText });
    } catch (err) {
      console.error('Compat PDF failed:', err);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Stars />
      <header className="relative border-b border-white/5 bg-[#070616]/80 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button data-testid="compat-back-btn" onClick={onBack} className="flex items-center gap-1.5 text-sm text-violet-200/70 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-lg tracking-[0.2em]" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>ZAURA</GradientText>
          </span>
          <span className="w-24" />
        </div>
      </header>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <Heart className="w-6 h-6 text-fuchsia-300 mx-auto mb-2" />
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Compatibility Reading</GradientText>
          </h1>
          <p className="text-sm text-violet-200/60">Six ancient systems weigh the bond between {profile.fullName.split(' ')[0]} and another soul</p>
        </div>

        <GlassCard className="p-6 sm:p-8 mb-8">
          <form onSubmit={submit} className="grid sm:grid-cols-[1fr_170px_140px_auto] gap-4 items-end">
            <div>
              <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Their name</label>
              <input data-testid="compat-name-input" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. River Sage" className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm placeholder:text-violet-200/30 focus:outline-none focus:border-violet-400/50" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Birth date</label>
              <input data-testid="compat-date-input" type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-violet-400/50 [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-violet-200/50 mb-1.5 block">Time <span className="normal-case text-violet-200/30">(opt.)</span></label>
              <input data-testid="compat-time-input" type="time" value={pTime} onChange={(e) => setPTime(e.target.value)} className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-violet-400/50 [color-scheme:dark]" />
            </div>
            <button data-testid="compat-submit-btn" className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" /> Read Us
            </button>
          </form>
          {error && <p data-testid="compat-error" className="mt-3 text-sm text-rose-300/90">{error}</p>}
        </GlassCard>

        {partners.length > 0 && (
          <div className="mb-8" data-testid="saved-partners">
            <h3 className="text-xs uppercase tracking-[0.25em] text-violet-200/40 mb-3">Saved Bonds</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {partners.map((p) => (
                <button
                  key={p.id}
                  data-testid={`saved-partner-${p.id}`}
                  onClick={() => openSaved(p)}
                  className="group text-left rounded-xl border border-white/10 bg-white/[0.03] hover:border-fuchsia-400/30 hover:bg-fuchsia-500/[0.06] p-4 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-violet-100/90 truncate">{p.partnerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-amber-100/90 font-medium">{p.overall}</span>
                      <span
                        role="button"
                        data-testid={`delete-partner-${p.id}`}
                        onClick={(e) => removeSaved(e, p)}
                        className="opacity-0 group-hover:opacity-100 text-violet-200/40 hover:text-rose-300 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-violet-200/50">{p.verdict}</p>
                  <p className="text-[10px] text-violet-200/30 mt-1">{new Date(p.birthDate + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <BondComparison profile={profile} partners={partners} />

        {report && (
          <div data-testid="compat-report">
            <GlassCard className="p-8 mb-6 text-center relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  data-testid="bond-share-btn"
                  onClick={shareBond}
                  disabled={bondShareBusy}
                  className="flex items-center gap-1.5 rounded-lg border border-sky-400/25 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 text-xs text-sky-100/90 transition-colors disabled:opacity-50"
                >
                  {bondShareBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  data-testid="compat-pdf-btn"
                  onClick={downloadCompatPdf}
                  disabled={pdfBusy}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs text-amber-100/90 transition-colors disabled:opacity-50"
                >
                  {pdfBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Keepsake PDF</span>
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <span className="text-3xl block">{report.glyphA}</span>
                  <p className="text-sm mt-1 text-violet-100/80">{report.nameA}</p>
                  <p className="text-xs text-violet-200/40">{report.sunA}</p>
                </div>
                <ScoreRing score={report.overall} />
                <div className="text-center">
                  <span className="text-3xl block">{report.glyphB}</span>
                  <p className="text-sm mt-1 text-violet-100/80">{report.nameB}</p>
                  <p className="text-xs text-violet-200/40">{report.sunB}</p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>
                <GradientText>{report.verdict}</GradientText>
              </h2>
              <p className="text-sm text-violet-100/70 max-w-xl mx-auto leading-relaxed">{report.verdictText}</p>
            </GlassCard>

            <div className="grid sm:grid-cols-2 gap-4">
              {report.aspects.map((a) => (
                <GlassCard key={a.id} className="p-5" data-testid={`compat-aspect-${a.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{a.icon}</span>
                      <h3 className="text-sm font-medium">{a.name}</h3>
                    </div>
                    <span className="text-lg text-amber-100/90 font-medium">{a.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-200" style={{ width: `${a.score}%` }} />
                  </div>
                  <p className="text-sm text-violet-200/80 mb-1.5" style={{ fontFamily: 'var(--font-mystic)' }}>{a.headline}</p>
                  <p className="text-xs text-violet-100/60 leading-relaxed">{a.text}</p>
                </GlassCard>
              ))}
            </div>
            <BondStory token={token} partnerId={currentPartnerId} />
            <p className="text-center text-xs text-violet-200/30 mt-8">For reflection, not prediction &mdash; every bond is ultimately written by its keepers. &#10024;</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- DASHBOARD ----------------
const Dashboard = ({ user, token, profile, modalities, summary, onOpen, onEdit, onLogout, onCompat, onOracle, onPhoto, onTimeline, scrollTo, onScrolled }) => {
  const [filter, setFilter] = useState('All');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [inviteState, setInviteState] = useState('idle'); // idle | busy | copied
  const shown = filter === 'All' ? modalities : modalities.filter((m) => m.category === filter);

  const inviteFriend = async () => {
    setInviteState('busy');
    try {
      const d = await apiCall('invites', { method: 'POST', token });
      const url = `${window.location.origin}/?invite=${d.code}`;
      const text = `${profile.fullName.split(' ')[0]} invited you to read your cosmic bond on Zaura`;
      let done = false;
      try {
        if (navigator.share) { await navigator.share({ title: 'Zaura Bond Invite', text, url }); done = true; }
      } catch (e) { if (e?.name === 'AbortError') done = true; }
      if (!done) await navigator.clipboard.writeText(url);
      setInviteState('copied');
      setTimeout(() => setInviteState('idle'), 2500);
    } catch (e) {
      console.error('Invite failed:', e);
      setInviteState('idle');
    }
  };

  useEffect(() => {
    if (!scrollTo) return;
    const t = setTimeout(() => {
      document.querySelector(`[data-testid="${scrollTo}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onScrolled?.();
    }, 350);
    return () => clearTimeout(t);
  }, [scrollTo, onScrolled]);

  const shareCard = async () => {
    setShareBusy(true);
    try {
      const { generateShareCard } = await import('@/lib/share');
      await generateShareCard({ profile, summary });
    } catch (e) {
      console.error('Share card failed:', e);
    } finally {
      setShareBusy(false);
    }
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      let narrativeText = null;
      let photoReadings = [];
      try {
        const d = await apiCall('synthesis', { token });
        narrativeText = d.narrative?.text || null;
      } catch {}
      try {
        const pr = await apiCall('photo-readings', { token });
        photoReadings = pr.readings || [];
      } catch {}
      const { generateKeepsakePdf } = await import('@/lib/pdf');
      await generateKeepsakePdf({ profile, modalities, summary, narrativeText, photoReadings });
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setPdfBusy(false);
    }
  };

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-5">
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
            <div className="flex flex-wrap gap-3">
              <button
                data-testid="download-pdf-btn"
                onClick={downloadPdf}
                disabled={pdfBusy}
                className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-sm text-amber-100/90 transition-colors disabled:opacity-50"
              >
                {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pdfBusy ? 'Weaving pages...' : 'Download Keepsake PDF'}
              </button>
              <button
                data-testid="compatibility-btn"
                onClick={onCompat}
                className="flex items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-4 py-2.5 text-sm text-fuchsia-100/90 transition-colors"
              >
                <Heart className="w-4 h-4" /> Compatibility Reading
              </button>
              <button
                data-testid="oracle-btn"
                onClick={onOracle}
                className="flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2.5 text-sm text-violet-100/90 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Ask the Oracle
              </button>
              <button
                data-testid="share-card-btn"
                onClick={shareCard}
                disabled={shareBusy}
                className="flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2.5 text-sm text-sky-100/90 transition-colors disabled:opacity-50"
              >
                {shareBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share Card
              </button>
              <button
                data-testid="timeline-btn"
                onClick={onTimeline}
                className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 text-sm text-emerald-100/90 transition-colors"
              >
                <History className="w-4 h-4" /> My Journey
              </button>
              <button
                data-testid="invite-btn"
                onClick={inviteFriend}
                disabled={inviteState === 'busy'}
                className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-sm text-rose-100/90 transition-colors disabled:opacity-50"
              >
                {inviteState === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : inviteState === 'copied' ? <Check className="w-4 h-4 text-emerald-300" /> : <UserPlus className="w-4 h-4" />}
                {inviteState === 'copied' ? 'Link copied!' : 'Invite a Friend'}
              </button>
            </div>
          </GlassCard>
        </div>

        <WeekBanner profile={profile} />

        <DailyReading profile={profile} />

        <WeeklyForecast profile={profile} />

        <SoulSynthesis token={token} />

        {/* filters */}
        <div className="flex flex-wrap gap-2 mb-6" data-testid="category-filters">
          {ALL_CATEGORIES.map((c) => (
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
          {(filter === 'All' || filter === 'Physical') && PHYSICAL_MODALITIES.map((m) => (
            <button
              key={m.id}
              data-testid={`modality-card-${m.id}`}
              onClick={() => onPhoto(m.id)}
              className={`text-left rounded-2xl border bg-gradient-to-br p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(220,80,140,0.25)] ${CAT_COLORS.Physical}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{m.icon}</span>
                <span className="text-[10px] uppercase tracking-widest text-rose-200/50 border border-rose-400/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Camera className="w-2.5 h-2.5" /> {m.category}</span>
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
  const [photoType, setPhotoType] = useState(null);
  const [compatJumpId, setCompatJumpId] = useState(null);
  const [dashScroll, setDashScroll] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);

  // capture ?invite= from URL, persist, and load inviter info for the auth banner
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      localStorage.setItem('zaura_invite', code);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const pending = localStorage.getItem('zaura_invite');
    if (pending) {
      apiCall(`invite/${pending}`)
        .then(setInviteInfo)
        .catch(() => { localStorage.removeItem('zaura_invite'); });
    }
  }, []);

  // once authenticated with a profile, accept any pending invite -> jump to pre-filled bond
  useEffect(() => {
    if (!token || !profile || typeof window === 'undefined') return;
    const code = localStorage.getItem('zaura_invite');
    if (!code) return;
    apiCall(`invite/${code}/accept`, { method: 'POST', token })
      .then((d) => {
        localStorage.removeItem('zaura_invite');
        setInviteInfo(null);
        if (d.partnerId) { setCompatJumpId(d.partnerId); setView('compat'); }
      })
      .catch(() => { localStorage.removeItem('zaura_invite'); setInviteInfo(null); });
  }, [token, profile]);

  const handleTimelineJump = useCallback((e) => {
    if (e.type === 'photo' && e.photoType) { setPhotoType(e.photoType); setView('photo'); }
    else if ((e.type === 'partner' || e.type === 'bondStory') && e.partnerId) { setCompatJumpId(e.partnerId); setView('compat'); }
    else if (e.type === 'oracle') setView('oracle');
    else if (e.type === 'synthesis') { setDashScroll('soul-synthesis-card'); setView('dashboard'); }
    else setView('dashboard');
  }, []);

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
  if (view === 'auth') return <AuthView onAuth={handleAuth} inviteInfo={inviteInfo} />;
  if (view === 'birth') return <BirthForm token={token} user={user} existing={profile} onSaved={(p) => { setProfile(p); setView('dashboard'); }} />;
  if (view === 'detail' && profile) {
    return <DetailView modalities={modalities} activeId={activeModality} onSelect={setActiveModality} onBack={() => setView('dashboard')} />;
  }
  if (view === 'timeline' && profile) {
    return <TimelineView token={token} profile={profile} onBack={() => setView('dashboard')} onJump={handleTimelineJump} />;
  }
  if (view === 'photo' && profile && photoType) {
    return <PhotoReadingView token={token} type={photoType} onBack={() => setView('dashboard')} />;
  }
  if (view === 'oracle' && profile) {
    return <OracleChat token={token} profile={profile} onBack={() => setView('dashboard')} />;
  }
  if (view === 'compat' && profile) {
    return <CompatibilityView profile={profile} token={token} initialPartnerId={compatJumpId} onBack={() => { setCompatJumpId(null); setView('dashboard'); }} />;
  }
  if (view === 'dashboard' && profile) {
    return (
      <Dashboard
        user={user}
        token={token}
        profile={profile}
        modalities={modalities}
        summary={summary}
        onOpen={(id) => { setActiveModality(id); setView('detail'); }}
        onEdit={() => setView('birth')}
        onLogout={handleLogout}
        onCompat={() => setView('compat')}
        onOracle={() => setView('oracle')}
        onPhoto={(t) => { setPhotoType(t); setView('photo'); }}
        onTimeline={() => setView('timeline')}
        scrollTo={dashScroll}
        onScrolled={() => setDashScroll(null)}
      />
    );
  }
  return <AuthView onAuth={handleAuth} inviteInfo={inviteInfo} />;
};

export default App;
