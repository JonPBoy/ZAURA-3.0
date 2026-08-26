'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Star, Sparkles, Sun, Compass, Heart, Flame, Users, Bell, Wand2, Zap,
  ArrowRight, Check, X, Camera, Bot, Calendar, ChevronRight, ScrollText, Infinity as InfinityIcon,
  Eye, BookOpen, Feather, Layers, Gauge,
} from 'lucide-react';

// ---------------- BRAND TOKENS ----------------
const GradientText = ({ children, className = '' }) => (
  <span className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent ${className}`}>{children}</span>
);

const Logo = ({ size = 'header' }) => {
  const sizes = { hero: 'h-16 sm:h-20', dashboard: 'h-9 sm:h-11', header: 'h-6 sm:h-7' };
  return (
    <img src="/zaura-logo.webp" alt="Zaura" draggable={false}
      className={`${sizes[size] || sizes.header} w-auto object-contain select-none drop-shadow-[0_0_22px_rgba(139,92,246,0.45)]`} />
  );
};

const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(80,40,180,0.15)] ${className}`}>
    {children}
  </div>
);

const CAT = {
  Astrology:   { chip: 'text-violet-200 bg-violet-500/15 border-violet-400/25',   ring: 'group-hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.6)]' },
  Numbers:     { chip: 'text-amber-200 bg-amber-500/15 border-amber-400/25',       ring: 'group-hover:shadow-[0_0_60px_-10px_rgba(245,158,11,0.55)]' },
  Esoteric:    { chip: 'text-fuchsia-200 bg-fuchsia-500/15 border-fuchsia-400/25', ring: 'group-hover:shadow-[0_0_60px_-10px_rgba(217,70,239,0.55)]' },
  Personality: { chip: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/25', ring: 'group-hover:shadow-[0_0_60px_-10px_rgba(52,211,153,0.5)]' },
  Spiritual:   { chip: 'text-sky-200 bg-sky-500/15 border-sky-400/25',             ring: 'group-hover:shadow-[0_0_60px_-10px_rgba(56,189,248,0.5)]' },
  Physical:    { chip: 'text-rose-200 bg-rose-500/15 border-rose-400/25',          ring: 'group-hover:shadow-[0_0_60px_-10px_rgba(244,114,182,0.55)]' },
};

// ---------------- 23 MODALITIES ----------------
const MODALITIES = [
  // Astrology (8)
  { id: 'western',   name: 'Western Astrology',       cat: 'Astrology',   icon: '\u2650', tag: 'Sun · Moon · Rising', preview: 'You are a Scorpio Sun with a Leo Rising — depth wears a crown.' },
  { id: 'vedic',     name: 'Vedic Astrology',         cat: 'Astrology',   icon: '\u0950', tag: 'Rashi & Nakshatra',   preview: 'Your Moon lands in Rohini — the star that nourishes what it touches.' },
  { id: 'chinese',   name: 'Chinese Zodiac',          cat: 'Astrology',   icon: '\uD83D\uDC09', tag: '12-year cycle',       preview: 'Wood Dragon — you rise where others hesitate.' },
  { id: 'celtic',    name: 'Celtic Tree Astrology',   cat: 'Astrology',   icon: '\uD83C\uDF33', tag: '13 sacred trees',     preview: 'Rowan — the tree of vision and quiet protection.' },
  { id: 'egyptian',  name: 'Egyptian Astrology',      cat: 'Astrology',   icon: '\uD83D\uDC31', tag: 'Neteru of Kemet',     preview: 'Ruled by Anubis — you were born to guide others through thresholds.' },
  { id: 'mayan',     name: "Mayan Tzolk'in",          cat: 'Astrology',   icon: '\uD83C\uDF3D', tag: '260-day sacred count',preview: 'Yellow Warrior — you question everything until it becomes truth.' },
  { id: 'hellenistic',name: 'Hellenistic Astrology',  cat: 'Astrology',   icon: '\uD83C\uDFDB\uFE0F', tag: 'Ancient sect & lots', preview: 'A diurnal chart — you were made to walk into the light.' },
  { id: 'moonphase', name: 'Birth Moon Phase',        cat: 'Astrology',   icon: '\uD83C\uDF15', tag: 'Lunar temperament',   preview: 'Full Moon soul — visible, radiant, and never unnoticed.' },
  // Numbers (3)
  { id: 'numerology',   name: 'Numerology',           cat: 'Numbers',     icon: '\uD83D\uDD22', tag: 'Life Path & Expression', preview: 'Life Path 7 — the mystic and quiet analyst.' },
  { id: 'destinyMatrix',name: 'Destiny Matrix',       cat: 'Numbers',     icon: '\uD83D\uDD2E', tag: '22 arcana grid',        preview: 'Your Sky energy is the Empress — sovereignty through beauty.' },
  { id: 'nameAnalysis', name: 'Name Analysis',        cat: 'Numbers',     icon: '\uD83D\uDCDC', tag: 'Vowels · Consonants',   preview: 'The vowels in your name whisper: I want to be understood.' },
  // Esoteric (5)
  { id: 'humanDesign',  name: 'Human Design',         cat: 'Esoteric',    icon: '\u2699\uFE0F', tag: 'Type · Strategy · Authority', preview: 'Generator, Sacral Authority — wait for the yes in your body.' },
  { id: 'geneKeys',     name: 'Gene Keys',            cat: 'Esoteric',    icon: '\uD83E\uDDEC', tag: 'Shadow · Gift · Siddhi', preview: 'Gene Key 22 — from dishonour into grace.' },
  { id: 'iching',       name: 'I Ching',              cat: 'Esoteric',    icon: '\u262F\uFE0F', tag: '64 hexagrams',           preview: 'Hexagram 24 — the return, quiet reversal after the storm.' },
  { id: 'kabbalah',     name: 'Kabbalah',             cat: 'Esoteric',    icon: '\uD83D\uDD4E', tag: 'Tree of Life sephira',   preview: 'Rooted in Tiferet — the heart of the tree.' },
  { id: 'tarot',        name: 'Tarot Birth Cards',    cat: 'Esoteric',    icon: '\uD83C\uDCCF', tag: 'Major arcana pair',      preview: 'The Star and The Empress walk beside you.' },
  // Personality (1)
  { id: 'enneagram',    name: 'Enneagram',            cat: 'Personality', icon: '\u2724\uFE0F', tag: '9 sacred fixations',     preview: 'Type 4w5 — the individualist with the mystic\u2019s eye.' },
  // Spiritual (3)
  { id: 'soulAge',      name: 'Soul Age',             cat: 'Spiritual',   icon: '\uD83D\uDD6F\uFE0F', tag: 'Infant \u2192 Transcendent', preview: 'Old Soul — you came in already remembering.' },
  { id: 'spiritAnimal', name: 'Spirit Animal',        cat: 'Spiritual',   icon: '\uD83E\uDD85', tag: 'Totem medicine',          preview: 'Owl walks with you \u2014 seeing in the dark is your gift.' },
  { id: 'chakra',       name: 'Chakra Profile',       cat: 'Spiritual',   icon: '\uD83E\uDDD8', tag: '7 energy centers',        preview: 'Throat and third-eye are your open gates.' },
  // Physical (3 photo readings)
  { id: 'palm',         name: 'Palm Reading',         cat: 'Physical',    icon: '\uD83D\uDD90\uFE0F', tag: 'Live AI vision',    preview: 'Your heart line arcs high \u2014 you love out loud.' },
  { id: 'handwriting',  name: 'Handwriting Analysis', cat: 'Physical',    icon: '\u270D\uFE0F',       tag: 'Graphological AI',  preview: 'Slanted right \u2014 you meet the future halfway.' },
  { id: 'face',         name: 'Face Reading',         cat: 'Physical',    icon: '\uD83C\uDFAD',       tag: 'Mien Shiang AI',    preview: 'A wide brow \u2014 you were born to see patterns others miss.' },
];

const CATEGORIES = ['All', 'Astrology', 'Numbers', 'Esoteric', 'Personality', 'Spiritual', 'Physical'];

// ---------------- BACKDROP ----------------
function StarField() {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    setStars(Array.from({ length: 70 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 6,
      dur: 3 + Math.random() * 5,
    })));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <span key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size,
            opacity: 0.6,
            animation: `zaura-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes zaura-twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.9; } }` }} />
    </div>
  );
}

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-violet-600/25 blur-[140px] animate-[zaura-drift_18s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 -right-40 w-[560px] h-[560px] rounded-full bg-fuchsia-600/20 blur-[160px] animate-[zaura-drift_22s_ease-in-out_-6s_infinite]" />
      <div className="absolute bottom-0 left-1/3 w-[480px] h-[480px] rounded-full bg-amber-500/10 blur-[140px] animate-[zaura-drift_26s_ease-in-out_-11s_infinite]" />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes zaura-drift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-25px) scale(1.06); } 66% { transform: translate(-25px,15px) scale(0.96); } }` }} />
    </div>
  );
}

// ---------------- NAV ----------------
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#070616]/85 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link href="/welcome" className="flex items-center gap-2">
          <Logo size="header" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-violet-200/70">
          <a href="#modalities" className="hover:text-white transition-colors">Modalities</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <Link href="/" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_30px_-8px_rgba(139,92,246,0.7)] transition-all">
          Enter the Cosmos
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </header>
  );
}

// ---------------- HERO ----------------
function OrbitingGlyphs() {
  // Small ring of drifting modality glyphs behind the hero
  const items = ['\u2650', '\u2648', '\u0950', '\uD83D\uDD22', '\u262F\uFE0F', '\uD83C\uDF15', '\uD83E\uDD85', '\uD83E\uDDD8', '\uD83D\uDD2E', '\u2724\uFE0F', '\uD83C\uDCCF', '\u2699\uFE0F'];
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      <div className="relative w-[520px] h-[520px] sm:w-[640px] sm:h-[640px]">
        {items.map((g, i) => {
          const angle = (i / items.length) * Math.PI * 2;
          const r = 240;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <motion.span key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.85, 1.05, 0.85] }}
              transition={{ duration: 6 + i * 0.15, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              className="absolute left-1/2 top-1/2 text-2xl sm:text-3xl"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}>
              {g}
            </motion.span>
          );
        })}
        {/* soft inner rings */}
        <div className="absolute inset-8 rounded-full border border-white/5" />
        <div className="absolute inset-24 rounded-full border border-white/5" />
        <div className="absolute inset-40 rounded-full border border-white/5" />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-36 sm:pt-44 pb-28 sm:pb-36">
      <OrbitingGlyphs />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-violet-200/70 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-200" /> A new kind of self-discovery
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-3">
            <Moon className="w-6 h-6 text-violet-300" />
            <Logo size="hero" />
            <Star className="w-6 h-6 text-amber-200" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-4xl sm:text-6xl lg:text-7xl leading-[1.05] font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-mystic)' }}>
          <GradientText>Read your soul</GradientText>
          <br />
          <span className="text-white/95">in starlight.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35 }}
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-violet-100/70 leading-relaxed">
          One birth moment. Twenty-three sacred lenses. A cosmic operating system for daily life &mdash;
          <em className="text-violet-100/90"> nothing this deep has ever been shipped as an app before.</em>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3.5 text-sm font-medium text-white shadow-[0_0_40px_-8px_rgba(139,92,246,0.8)] transition-all">
            <Sparkles className="w-4 h-4" /> Enter the Cosmos
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a href="#modalities" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-6 py-3.5 text-sm text-violet-100/90 transition-colors">
            Explore the 23 modalities
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-6 text-[11px] uppercase tracking-[0.3em] text-violet-200/40">
          Free forever tier &middot; no credit card &middot; instant reading
        </motion.p>
      </div>
    </section>
  );
}

// ---------------- TRUST STRIP ----------------
function TrustStrip() {
  const stats = [
    { k: '23', v: 'sacred modalities' },
    { k: '8', v: 'astrological traditions' },
    { k: '3', v: 'AI vision readings' },
    { k: '\u221E', v: 'daily oracle chats' },
    { k: '1', v: 'birth moment. yours.' },
  ];
  return (
    <section className="relative border-y border-white/5 bg-white/[0.015] backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="text-center">
            <div className="text-2xl sm:text-3xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
              <GradientText>{s.k}</GradientText>
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-200/50 mt-1">{s.v}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ---------------- NEVER-BUILT COMPARISON ----------------
function NeverBuilt() {
  const rows = [
    { label: 'Western sun/moon/rising',       zaura: true,  others: 'Sun only' },
    { label: 'Vedic Rashi + Nakshatra',       zaura: true,  others: false },
    { label: 'Chinese, Celtic, Egyptian, Mayan, Hellenistic', zaura: true, others: false },
    { label: 'Numerology + Destiny Matrix + Name Analysis',   zaura: true, others: 'Life path only' },
    { label: 'Human Design + Gene Keys + I Ching + Kabbalah + Tarot', zaura: true, others: false },
    { label: 'Enneagram, Soul Age, Spirit Animal, Chakra',    zaura: true, others: false },
    { label: 'AI Palm, Face & Handwriting reading',           zaura: true, others: false },
    { label: 'Live moon calendar with personal power days',   zaura: true, others: 'Generic phase only' },
    { label: 'AI Oracle chat with memory',                    zaura: true, others: false },
    { label: 'Cosmic bond scoring + AI love story',           zaura: true, others: 'Basic sun-sign match' },
    { label: 'PDF keepsake + share cards',                    zaura: true, others: false },
    { label: 'One unified reading, not 20 apps',              zaura: true, others: false },
  ];
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12">
          <div className="text-[11px] uppercase tracking-[0.3em] text-violet-200/50 mb-4">The comparison</div>
          <h2 className="text-3xl sm:text-5xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Nothing this robust has ever been built.</GradientText>
          </h2>
          <p className="mt-4 text-violet-100/70 max-w-2xl mx-auto">
            Most apps give you a sun sign and a daily horoscope. Zaura is a full-stack cosmic operating system.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9 }}>
          <GlassCard className="overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 sm:px-8 py-4 border-b border-white/5 text-[11px] uppercase tracking-[0.22em] text-violet-200/50">
              <span></span>
              <span className="w-24 sm:w-28 text-center"><GradientText>Zaura</GradientText></span>
              <span className="w-24 sm:w-28 text-center">Everything else</span>
            </div>
            {rows.map((r, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="grid grid-cols-[1fr_auto_auto] items-center px-5 sm:px-8 py-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                <span className="text-sm text-violet-100/85">{r.label}</span>
                <span className="w-24 sm:w-28 flex justify-center">
                  {r.zaura === true ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/60 to-fuchsia-500/60 shadow-[0_0_18px_rgba(139,92,246,0.55)]">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </span>
                  ) : <span className="text-violet-200/40 text-xs">{r.zaura}</span>}
                </span>
                <span className="w-24 sm:w-28 flex justify-center">
                  {r.others === false ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.04] border border-white/10">
                      <X className="w-3.5 h-3.5 text-violet-200/40" />
                    </span>
                  ) : <span className="text-violet-200/45 text-[11px] text-center leading-tight">{r.others}</span>}
                </span>
              </motion.div>
            ))}
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------- MODALITY CARD + GRID ----------------
function ModalityCard({ mod, index }) {
  const style = CAT[mod.cat];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 8) * 0.04 }}
      className="group relative">
      <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 h-full transition-all duration-500 hover:-translate-y-1 ${style.ring}`}>
        {/* animated aurora sweep on hover */}
        <div className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background: 'radial-gradient(circle at 30% 20%, rgba(217,70,239,0.18), transparent 60%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.18), transparent 60%)' }} />
        <div className="relative flex items-start justify-between mb-3">
          <div className="text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-4deg]">{mod.icon}</div>
          <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${style.chip}`}>{mod.cat}</span>
        </div>
        <div className="relative">
          <h3 className="text-lg font-medium text-white/95" style={{ fontFamily: 'var(--font-mystic)' }}>{mod.name}</h3>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-violet-200/45">{mod.tag}</p>
        </div>
        {/* live preview line: hidden by default, revealed on hover */}
        <div className="relative mt-4 min-h-[52px]">
          <p className="text-sm text-violet-100/70 italic leading-snug opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
             style={{ fontFamily: 'var(--font-mystic)' }}>
            &ldquo;{mod.preview}&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ModalityGrid() {
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? MODALITIES : MODALITIES.filter((m) => m.cat === filter);
  return (
    <section id="modalities" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="text-[11px] uppercase tracking-[0.3em] text-violet-200/50 mb-4">The full library</div>
          <h2 className="text-3xl sm:text-5xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Twenty-three lenses on one soul.</GradientText>
          </h2>
          <p className="mt-4 text-violet-100/70 max-w-2xl mx-auto">
            Hover any card to hear how Zaura might speak to you. Every reading is computed from your exact birth moment &mdash; not a template.
          </p>
        </div>

        {/* filter chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((c) => (
            <button key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${filter === c
                ? 'border-violet-400/60 bg-violet-500/20 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.7)]'
                : 'border-white/10 bg-white/[0.03] text-violet-200/60 hover:text-white hover:border-white/25'}`}>
              {c}
            </button>
          ))}
        </div>

        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((m, i) => (
              <motion.div key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}>
                <ModalityCard mod={m} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------- FEATURE BENTO ----------------
function BondDonut() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setScore(89), 400);
    return () => clearTimeout(t);
  }, []);
  const size = 140, stroke = 12, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  const offset = C * (1 - score / 100);
  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c46b" />
            <stop offset="50%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} stroke="url(#donut-grad)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
          <GradientText>{score}</GradientText>
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200/70 mt-1">Blaze</span>
      </div>
    </div>
  );
}

function MoonCalendarPreview() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const phase = (d) => {
    const i = Math.floor(((d - 1) / 28) * 8);
    return ['\uD83C\uDF11', '\uD83C\uDF12', '\uD83C\uDF13', '\uD83C\uDF14', '\uD83C\uDF15', '\uD83C\uDF16', '\uD83C\uDF17', '\uD83C\uDF18'][i];
  };
  const power = new Set([3, 11, 17, 24]);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => (
        <motion.div key={d}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.015 }}
          className={`aspect-square rounded-lg text-[10px] flex flex-col items-center justify-center relative ${
            power.has(d)
              ? 'bg-gradient-to-br from-amber-500/25 to-fuchsia-500/20 border border-amber-300/40 shadow-[0_0_20px_-6px_rgba(245,196,107,0.7)]'
              : 'bg-white/[0.03] border border-white/5'
          }`}>
          <span className="text-sm leading-none">{phase(d)}</span>
          <span className="text-[9px] mt-0.5 text-violet-200/50">{d}</span>
          {power.has(d) && (
            <Sparkles className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-amber-200" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function OracleBubble() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 3500);
    return () => clearInterval(id);
  }, []);
  const msgs = [
    'What does today ask of me?',
    'Your Moon is waxing in Cancer &mdash; tend one small root today.',
    'Tell me about the shadow in Gene Key 22.',
  ];
  return (
    <div className="space-y-2.5">
      {msgs.slice(0, step + 1).map((m, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
            i % 2 === 0
              ? 'ml-auto bg-violet-500/25 border border-violet-400/30 text-white'
              : 'mr-auto bg-white/[0.05] border border-white/10 text-violet-100/85 italic'
          }`}
          style={i % 2 === 1 ? { fontFamily: 'var(--font-mystic)' } : {}}
          dangerouslySetInnerHTML={{ __html: m }} />
      ))}
    </div>
  );
}

function FeatureBento() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.3em] text-violet-200/50 mb-4">The living app</div>
          <h2 className="text-3xl sm:text-5xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Not a horoscope. A companion.</GradientText>
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-6 lg:grid-rows-[auto_auto]">
          {/* Bond Notifications with live donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 lg:row-span-2">
            <GlassCard className="p-6 sm:p-8 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-fuchsia-300" />
                <span className="text-[11px] uppercase tracking-[0.28em] text-fuchsia-200/70">Bond notifications</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white/95 mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>
                See the score <GradientText>before you tap.</GradientText>
              </h3>
              <p className="text-violet-100/70 leading-relaxed mb-6">
                When a friend joins through your invite, Zaura instantly computes your cosmic bond and pings you with a tier-colored radial &mdash; the exact score glowing on the dashboard.
              </p>
              <div className="flex items-center gap-5 mt-auto">
                <BondDonut />
                <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                    <span className="text-xs text-fuchsia-200/80">Nadia joined via your invite</span>
                  </div>
                  <p className="text-sm text-white/90 font-medium">Cosmic bond ready</p>
                  <p className="text-[11px] text-violet-200/50 mt-1">2 minutes ago &middot; Blaze tier</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-200/80">
                    Open reading <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Moon Calendar preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-3">
            <GlassCard className="p-6 sm:p-7 h-full">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-violet-300" />
                <span className="text-[11px] uppercase tracking-[0.28em] text-violet-200/70">Moon calendar</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white/95 mb-3" style={{ fontFamily: 'var(--font-mystic)' }}>
                Your <GradientText>personal power days</GradientText>, lit in gold.
              </h3>
              <MoonCalendarPreview />
              <p className="text-[11px] text-violet-200/50 mt-3">Gold-glow squares are days when the moon and your numerology align &mdash; auto-detected.</p>
            </GlassCard>
          </motion.div>

          {/* Oracle chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-3">
            <GlassCard className="p-6 sm:p-7 h-full">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-amber-200" />
                <span className="text-[11px] uppercase tracking-[0.28em] text-amber-200/70">Ai oracle chat</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white/95 mb-4" style={{ fontFamily: 'var(--font-mystic)' }}>
                Ask any question. <GradientText>Any hour.</GradientText>
              </h3>
              <OracleBubble />
            </GlassCard>
          </motion.div>

          {/* AI Vision Readings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-3">
            <GlassCard className="p-6 sm:p-7 h-full">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-rose-300" />
                <span className="text-[11px] uppercase tracking-[0.28em] text-rose-200/70">AI vision readings</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white/95 mb-4" style={{ fontFamily: 'var(--font-mystic)' }}>
                Palm. Face. Handwriting. <GradientText>Read on the spot.</GradientText>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '\uD83D\uDD90\uFE0F', name: 'Palm',        color: 'from-rose-500/25 to-pink-500/15' },
                  { icon: '\uD83C\uDFAD',       name: 'Face',        color: 'from-fuchsia-500/25 to-rose-500/15' },
                  { icon: '\u270D\uFE0F',       name: 'Handwriting', color: 'from-amber-500/25 to-orange-500/15' },
                ].map((v, i) => (
                  <motion.div key={i}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className={`rounded-xl border border-white/10 bg-gradient-to-br ${v.color} p-4 text-center`}>
                    <div className="text-3xl mb-1">{v.icon}</div>
                    <div className="text-xs text-violet-100/85">{v.name}</div>
                  </motion.div>
                ))}
              </div>
              <p className="text-[11px] text-violet-200/50 mt-4">Photos analyzed once, never stored. Powered by vision-capable AI.</p>
            </GlassCard>
          </motion.div>

          {/* Soul Blueprint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="lg:col-span-3">
            <GlassCard className="p-6 sm:p-7 h-full">
              <div className="flex items-center gap-2 mb-2">
                <ScrollText className="w-4 h-4 text-sky-300" />
                <span className="text-[11px] uppercase tracking-[0.28em] text-sky-200/70">AI soul synthesis</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white/95 mb-3" style={{ fontFamily: 'var(--font-mystic)' }}>
                All 23 lenses, woven into <GradientText>one poetic story</GradientText>.
              </h3>
              <p className="text-violet-100/70 leading-relaxed">
                Zaura reads every modality at once and writes you a 180-word blueprint of your essence, cosmos, numbers, shadow, and gift &mdash; then generates a PDF keepsake you can save forever.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {['Essence', 'Cosmos', 'Numbers', 'Shadow', 'Gift'].map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-violet-100/80">{t}</span>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------- HOW IT WORKS ----------------
function HowItWorks() {
  const steps = [
    { n: '01', icon: <Feather className="w-5 h-5" />, title: 'Enter your birth moment', body: 'Name, date, time and place. That\u2019s all Zaura needs to compute every one of the 23 modalities.' },
    { n: '02', icon: <Layers className="w-5 h-5" />, title: 'We compute the sacred stack', body: 'Real astronomical math. Ancient timing systems. Numerology. Human Design. Vision AI. All at once. Under three seconds.' },
    { n: '03', icon: <Sparkles className="w-5 h-5" />, title: 'Zaura reveals daily', body: 'Your soul blueprint, today\u2019s reading, moon calendar, bond notifications and oracle chat &mdash; a rhythm, not a report.' },
  ];
  return (
    <section id="how" className="relative py-24 sm:py-32 border-y border-white/5 bg-white/[0.015]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="text-[11px] uppercase tracking-[0.3em] text-violet-200/50 mb-4">How it works</div>
          <h2 className="text-3xl sm:text-5xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Three breaths to your blueprint.</GradientText>
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.15 }}>
              <GlassCard className="p-7 h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-semibold text-violet-300/40" style={{ fontFamily: 'var(--font-mystic)' }}>{s.n}</span>
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 flex items-center justify-center text-white">
                    {s.icon}
                  </span>
                </div>
                <h3 className="text-xl font-medium text-white/95 mb-2" style={{ fontFamily: 'var(--font-mystic)' }}>{s.title}</h3>
                <p className="text-sm text-violet-100/70 leading-relaxed">{s.body}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- PRICING ----------------
function PricingTier({ name, price, priceSub, tagline, features, cta, popular, foundingLeft }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7 }}
      className={`relative ${popular ? 'lg:-translate-y-4' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-400 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1a0a2b] px-3 py-1 shadow-[0_0_20px_rgba(245,196,107,0.5)]">
            <Star className="w-3 h-3" /> Most chosen
          </span>
        </div>
      )}
      <div className={`relative h-full rounded-2xl border p-7 backdrop-blur-xl transition-all ${
        popular
          ? 'border-fuchsia-400/40 bg-gradient-to-b from-fuchsia-500/[0.08] via-violet-500/[0.05] to-white/[0.02] shadow-[0_0_60px_-10px_rgba(217,70,239,0.55)]'
          : 'border-white/10 bg-white/[0.03]'
      }`}>
        <h3 className="text-sm uppercase tracking-[0.28em] text-violet-200/70 mb-1">{name}</h3>
        <div className="flex items-baseline gap-1.5 mt-4">
          <span className="text-5xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>{price}</GradientText>
          </span>
          {priceSub && <span className="text-sm text-violet-200/50">{priceSub}</span>}
        </div>
        <p className="mt-3 text-sm text-violet-100/70 italic min-h-[42px]" style={{ fontFamily: 'var(--font-mystic)' }}>{tagline}</p>
        {foundingLeft && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-amber-200/90">
            <Flame className="w-3 h-3" /> {foundingLeft}
          </div>
        )}
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <ul className="space-y-2.5">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-violet-100/85">
              <Check className="w-4 h-4 mt-0.5 text-violet-300 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link href="/"
          className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all ${
            popular
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-[0_0_30px_-8px_rgba(139,92,246,0.7)]'
              : 'border border-white/15 bg-white/[0.03] hover:bg-white/[0.06] text-violet-100/90'
          }`}>
          {cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="text-[11px] uppercase tracking-[0.3em] text-violet-200/50 mb-4">Choose your rhythm</div>
          <h2 className="text-3xl sm:text-5xl font-semibold" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>A price for every kind of seeker.</GradientText>
          </h2>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs transition-colors ${!annual ? 'bg-violet-500/25 text-white' : 'text-violet-200/60'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs transition-colors ${annual ? 'bg-violet-500/25 text-white' : 'text-violet-200/60'}`}>
              Annual <span className="ml-1 text-[10px] text-amber-200">save 41%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          <PricingTier
            name="Wanderer"
            price="$0"
            priceSub="forever"
            tagline="Get a taste of the cosmos."
            features={[
              'Soul Blueprint (essence & cosmos tabs)',
              '5 modality previews',
              '3 daily readings / month',
              '1 cosmic bond',
              'Community access',
            ]}
            cta="Start free" />
          <PricingTier
            name="Mystic"
            popular
            price={annual ? '$99' : '$14'}
            priceSub={annual ? '/ year' : '/ month'}
            tagline="The full cosmic operating system."
            features={[
              'All 23 modalities unlocked',
              'AI Soul Synthesis (all 5 tabs)',
              'Unlimited daily readings & oracle chat',
              'Palm, Face & Handwriting AI readings',
              'Full Moon Calendar + power days',
              'Unlimited bonds & AI bond stories',
              'PDF keepsakes & share cards',
            ]}
            cta="Become a Mystic" />
          <PricingTier
            name="Founding Star"
            price="$199"
            priceSub="one-time"
            tagline="Lifetime access, forever."
            foundingLeft="Limited to the first 500 souls"
            features={[
              'Everything in Mystic \u2014 forever',
              'Early access to every new modality',
              'Named in the in-app Founding Circle',
              'Priority AI model access',
              'Direct line to the maker',
            ]}
            cta="Claim a seat" />
        </div>

        <p className="text-center text-[11px] uppercase tracking-[0.28em] text-violet-200/40 mt-10">
          7-day money-back &middot; cancel any time &middot; taxes calculated at checkout
        </p>
      </div>
    </section>
  );
}

// ---------------- FINAL CTA ----------------
function FinalCTA() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-3 mb-6">
            <Moon className="w-5 h-5 text-violet-300" />
            <Logo size="dashboard" />
            <Star className="w-5 h-5 text-amber-200" />
          </div>
          <h2 className="text-4xl sm:text-6xl font-semibold leading-tight" style={{ fontFamily: 'var(--font-mystic)' }}>
            <GradientText>Your birth moment</GradientText>
            <br />
            <span className="text-white/95">is already waiting.</span>
          </h2>
          <p className="mt-6 text-violet-100/70 max-w-xl mx-auto">
            Zaura takes ninety seconds to set up and a lifetime to unfold. Come see what the stars have been holding for you.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-7 py-4 text-sm font-medium text-white shadow-[0_0_50px_-10px_rgba(139,92,246,0.9)] transition-all">
              <Sparkles className="w-4 h-4" /> Enter the Cosmos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-7 py-4 text-sm text-violet-100/90 transition-colors">
              See pricing
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------- FOOTER ----------------
function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size="header" />
          <span className="text-[11px] uppercase tracking-[0.28em] text-violet-200/40 ml-2">Your cosmic self, revealed</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-violet-200/50">
          <a href="#modalities" className="hover:text-white transition-colors">Modalities</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/" className="hover:text-white transition-colors">Sign in</Link>
        </div>
        <div className="text-[11px] text-violet-200/40">
          &copy; {new Date().getFullYear()} Zaura &middot; For reflection, not prediction.
        </div>
      </div>
    </footer>
  );
}

// ---------------- PAGE ----------------
export default function WelcomePage() {
  return (
    <div className="relative min-h-screen bg-[#070616] text-violet-100/90 overflow-x-hidden">
      <Aurora />
      <StarField />
      <Nav />
      <main className="relative">
        <Hero />
        <TrustStrip />
        <NeverBuilt />
        <ModalityGrid />
        <FeatureBento />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
