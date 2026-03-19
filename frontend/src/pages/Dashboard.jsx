import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, RotateCcw, ChevronDown, Plus, X } from 'lucide-react';
import useStore from '../store/useStore';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import { StatSkeleton, SlotSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────
   PALETTE  — 100% CSS variables so light/dark theme from
              Sidebar's toggleTheme() applies automatically.
   The ONE exception: semantic red/green/amber are fixed iOS
   system colours that read well in both themes.
───────────────────────────────────────────────────────────── */
const C = {
  /* layout tokens — inherit from global theme */
  bg:       'var(--color-bg)',
  surface:  'var(--color-surface)',
  card:     'var(--color-card-bg)',
  border:   'var(--color-border)',
  text:     'var(--color-text)',
  sub:      'var(--color-subtext)',
  hover:    'var(--hover)',
  /* brand accent — use the CSS var so it inherits the app primary */
  accent:   'var(--color-primary)',
  accentLo: 'var(--color-primary-lo, rgba(0,122,255,0.08))',
  /* semantic fixed */
  green:    '#34C759',
  greenLo:  'rgba(52,199,89,0.10)',
  red:      '#FF3B30',
  redLo:    'rgba(255,59,48,0.10)',
  amber:    '#FF9500',
  amberLo:  'rgba(255,149,0,0.08)',
};

/* ── animation presets ── */
const SPRING  = { type: 'spring', stiffness: 420, damping: 34 };
const FADE_UP = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};
const STAGGER = { show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } } };

/* ── status chips ── */
const STATUS_MAP = {
  Present:   { color: '#34C759', bg: 'rgba(52,199,89,0.10)'   },
  Absent:    { color: '#FF3B30', bg: 'rgba(255,59,48,0.10)'   },
  Medical:   { color: '#5AC8FA', bg: 'rgba(90,200,250,0.10)'  },
  OD:        { color: '#BF5AF2', bg: 'rgba(191,90,242,0.10)'  },
  Cancelled: { color: '#8E8E93', bg: 'rgba(142,142,147,0.10)' },
};

/* ── pure math ── */
function computeMeta(sub) {
  const req    = (sub.requiredAttendance || 75) / 100;
  const margin = sub.attended - req * sub.total;
  if (margin > 0) return { safe: Math.floor(margin / req), need: 0 };
  if (margin < 0) return { safe: 0, need: Math.ceil(Math.abs(margin) / (1 - req)) };
  return { safe: 0, need: 0 };
}

/* ── breakpoint hook — matches Sidebar's `lg` (1024 px) ── */
function useIsMobile(bp = 1024) {
  const [mob, setMob] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < bp : false
  );
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return mob;
}

/* ── shared style atoms ── */
const cardSt = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 16,
};
const labelSt = {
  fontSize: 10, fontWeight: 700,
  color: 'var(--color-subtext)',
  letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
};
const bigNumSt = {
  fontWeight: 800, letterSpacing: '-0.045em', margin: 0, lineHeight: 1,
};
const iconBtnSt = {
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
};
const selectSt = {
  width: '100%', padding: '11px 13px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10, fontSize: 13, fontWeight: 500,
  color: 'var(--color-text)', fontFamily: 'inherit',
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile(); /* true when < 1024 px, same as Sidebar's lg */

  const {
    user, fetchUser,
    subjects, fetchSubjects,
    fetchGamification,
    timetable, fetchTimetable,
    extraClasses, fetchExtraClasses,
    markAttendance, undoAttendance,
    fetchAIBrief, autoFillMissed,
    notifications, fetchNotifications, markNotificationsRead,
    updatingAttendance,
    addExtraAttendance,
    /* theme is owned by Sidebar — we don't touch it here */
  } = useStore();

  /* one-time data fetch */
  useEffect(() => {
    fetchUser(); fetchSubjects(); fetchTimetable();
    fetchExtraClasses(); fetchGamification();
    fetchAIBrief(); fetchNotifications();
  }, []); // eslint-disable-line

  /* local ui state */
  const [extraOpen,  setExtraOpen]  = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState('');
  const [slotMenu,   setSlotMenu]   = useState(null);
  const [extraForm,  setExtraForm]  = useState({
    subjectId: '', status: 'Present', credit: 1,
    date: new Date().toISOString().split('T')[0],
  });

  const unread = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  /* ── derived stats (pure, no store mutation) ── */
  const stats = useMemo(() => {
    let att = 0, tot = 0, bunks = 0, need = 0;
    const map = {};
    subjects.forEach(s => {
      att += s.attended; tot += s.total;
      const m = computeMeta(s); map[s._id] = m;
      bunks += m.safe; need += m.need;
    });
    return {
      att, tot,
      pct:   tot > 0 ? (att / tot * 100).toFixed(1) : '0.0',
      bunks, need, map,
    };
  }, [subjects]);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);

  const todaySlots = useMemo(() => {
    const ds  = new Date().toDateString();
    const ov  = (extraClasses || []).find(ec => new Date(ec.date).toDateString() === ds);
    const day = ov ? ov.followsDay : today;
    return timetable?.find(t => t.day.toLowerCase() === day.toLowerCase())?.slots || [];
  }, [timetable, extraClasses, today]);

  const catchUp = useMemo(() => {
    const last = user?.lastAttendanceDate ? new Date(user.lastAttendanceDate) : null;
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    if (!last || last >= midnight || !subjects.length) return null;
    const yest = new Date(midnight); yest.setDate(yest.getDate() - 1);
    const days = Math.floor((midnight - last) / 86_400_000);
    return days > 0 ? { days, last, yest } : null;
  }, [user?.lastAttendanceDate, subjects.length]);

  const chartData = useMemo(() =>
    subjects.slice(0, 6).map(s => ({
      full:  s.name,
      pct:   s.total > 0 ? parseFloat((s.attended / s.total * 100).toFixed(1)) : 0,
      color: s.color || '#007AFF',
    })), [subjects]);

  const filtered = useMemo(() =>
    subjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase())),
    [subjects, query]);

  const handleExtra = useCallback(async () => {
    if (!extraForm.subjectId) return toast.error('Select a subject');
    try {
      await addExtraAttendance(extraForm);
      setExtraOpen(false);
      setExtraForm({ subjectId: '', status: 'Present', credit: 1, date: new Date().toISOString().split('T')[0] });
      toast.success('Session logged');
    } catch { toast.error('Failed to log'); }
  }, [extraForm, addExtraAttendance]);

  const pctNum = parseFloat(stats.pct);
  const ring   = 2 * Math.PI * 42;

  /* ── RENDER ───────────────────────────────────────────────── */
  return (
    <div style={{
      background: C.bg,
      minHeight: '100svh',
      /* bottom padding: mobile = space above bottom tab bar (≈80px tall + 24px gap) */
      paddingBottom: isMobile ? 104 : 32,
      fontFamily: "-apple-system,'SF Pro Display',sans-serif",
    }}>

      {/* ── CATCH-UP RIBBON ── */}
      <AnimatePresence>
        {catchUp && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{
              background: C.amberLo,
              borderBottom: `1px solid rgba(255,149,0,0.2)`,
              padding: '10px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.amber, margin: 0, letterSpacing: '-0.01em' }}>
                  {catchUp.days} day{catchUp.days > 1 ? 's' : ''} unlogged
                </p>
                <p style={{ fontSize: 11, color: C.sub, margin: '2px 0 0' }}>
                  Auto-fill marks missed slots as Present
                </p>
              </div>
              <button
                onClick={() => {
                  const s = new Date(catchUp.last);
                  s.setDate(s.getDate() + 1);
                  autoFillMissed(s.toISOString(), catchUp.yest.toISOString(), 'Present');
                }}
                style={{ background: C.amber, color: '#fff', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Auto-fill
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY HEADER ──
           Desktop: just a title bar — sidebar handles all nav.
           Mobile:  title + search + bell + avatar.
                    NO hamburger — drawer is opened from Sidebar's own mobile top bar
                    or from within the app (you removed that per your request).
      ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--color-bg)',
        /* frosted glass layered on top of the bg */
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>

        {/* left: wordmark + day */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', flexShrink: 0 }}>
            Dashboard
          </span>
          <AnimatePresence>
            {!searchOpen && (
              <motion.span key="day"
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', letterSpacing: '0.04em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {today}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* inline expanding search */}
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div key="sinput"
                initial={{ width: 32, opacity: 0 }} animate={{ width: isMobile ? 156 : 200, opacity: 1 }}
                exit={{ width: 32, opacity: 0 }} transition={SPRING}>
                <input
                  autoFocus value={query}
                  onChange={e => setQuery(e.target.value)}
                  onBlur={() => { if (!query) setSearchOpen(false); }}
                  placeholder="Search subjects…"
                  style={{ width: '100%', height: 32, padding: '0 11px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13, color: 'var(--color-text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </motion.div>
            ) : (
              <motion.button key="sicon"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-subtext)', flexShrink: 0 }}>
                {/* search icon — inline SVG, thinner than lucide defaults */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.3" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="9.2" y1="9.2" x2="12.2" y2="12.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* notifications bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(v => !v)}
              style={{
                width: 32, height: 32, borderRadius: 9,
                border: `1px solid ${notifOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: notifOpen ? 'var(--color-primary-lo, rgba(0,122,255,0.08))' : 'var(--color-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: notifOpen ? 'var(--color-primary)' : 'var(--color-subtext)',
                position: 'relative', flexShrink: 0,
              }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1.5C5.01 1.5 3 3.51 3 6v3.5l-1 1V11h11v-.5l-1-1V6c0-2.49-2.01-4.5-4.5-4.5z"
                  stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M6.2 12a1.3 1.3 0 002.6 0" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              {unread > 0 && (
                <span style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: '50%', background: '#FF3B30', border: '1.5px solid var(--color-bg)' }} />
              )}
            </button>

            {/* notification dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 7, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 7, scale: 0.97 }} transition={SPRING}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: isMobile ? 'calc(100vw - 40px)' : 288,
                      maxHeight: 360, zIndex: 50,
                      background: 'var(--color-card-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 16,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                    <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Notifications</span>
                      {unread > 0 && (
                        <button onClick={markNotificationsRead}
                          style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {notifications.length === 0
                        ? <p style={{ fontSize: 12, color: 'var(--color-subtext)', textAlign: 'center', padding: '24px 0', margin: 0 }}>All clear</p>
                        : notifications.map(n => (
                          <div key={n._id} style={{
                            padding: '9px 11px', borderRadius: 10,
                            background: n.read ? 'transparent' : 'var(--color-primary-lo, rgba(0,122,255,0.06))',
                            border: `1px solid ${n.read ? 'transparent' : 'var(--color-primary-lo, rgba(0,122,255,0.14))'}`,
                            opacity: n.read ? 0.5 : 1,
                          }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px' }}>{n.title}</p>
                            <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* avatar — matches UserCard initial in Sidebar */}
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'U'}&backgroundColor=007AFF`}
            alt={user?.name || 'User'}
            style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--color-border)', flexShrink: 0, cursor: 'pointer' }}
          />
        </div>
      </header>

      {/* ══ PAGE BODY ══════════════════════════════════════════ */}
      <motion.div
        variants={STAGGER} initial="hidden" animate="show"
        style={{
          padding: isMobile ? '14px 12px' : '20px 24px',
          maxWidth: 920, margin: '0 auto',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>

        {/* ── STAT CARDS ── */}
        {subjects.length === 0 ? (
          <motion.div variants={FADE_UP}
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10 }}>
            {Array(isMobile ? 2 : 4).fill(0).map((_, i) => <StatSkeleton key={i} />)}
          </motion.div>

        ) : isMobile ? (
          /* MOBILE — stack: full-width ring card, then 2-col mini cards */
          <motion.div variants={FADE_UP} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* ring card */}
            <div style={{ ...cardSt, padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="9"/>
                  <motion.circle cx="50" cy="50" r="42" fill="none"
                    stroke={pctNum >= 75 ? '#34C759' : '#FF3B30'} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={ring}
                    initial={{ strokeDashoffset: ring }}
                    animate={{ strokeDashoffset: ring * (1 - Math.min(pctNum, 100) / 100) }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.pct}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)' }}>%</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={labelSt}>Overall Attendance</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: pctNum >= 75 ? '#34C759' : '#FF3B30', margin: '5px 0 3px', letterSpacing: '-0.01em' }}>
                  {pctNum >= 75 ? '↑ On track' : '↓ Below target'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: 0, fontWeight: 500 }}>
                  {stats.att} of {stats.tot} sessions
                </p>
              </div>
            </div>

            {/* 2-col skip / need */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ ...cardSt, padding: '14px' }}>
                <p style={labelSt}>Safe Skips</p>
                <p style={{ ...bigNumSt, fontSize: 32, color: '#34C759', marginTop: 10 }}>{stats.bunks}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '3px 0 0', fontWeight: 500 }}>can miss</p>
              </div>
              <div style={{ ...cardSt, padding: '14px' }}>
                <p style={labelSt}>Need to Attend</p>
                <p style={{ ...bigNumSt, fontSize: 32, color: stats.need > 0 ? '#FF3B30' : 'var(--color-text)', marginTop: 10 }}>{stats.need}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '3px 0 0', fontWeight: 500 }}>to hit 75%</p>
              </div>
            </div>
          </motion.div>

        ) : (
          /* DESKTOP — asymmetric 3-col bento */
          <motion.div variants={FADE_UP}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 10 }}>

            {/* ring card — tall, spans 2 rows */}
            <div style={{ ...cardSt, gridRow: '1 / 3', padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              {/* diagonal tint */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', background: 'linear-gradient(135deg, transparent 50%, var(--color-primary-lo, rgba(0,122,255,0.06)) 100%)', pointerEvents: 'none' }} />
              <div>
                <p style={labelSt}>Attendance</p>
                <div style={{ marginTop: 14, position: 'relative', display: 'inline-block' }}>
                  <svg width="96" height="96" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="7"/>
                    <motion.circle cx="50" cy="50" r="42" fill="none"
                      stroke={pctNum >= 75 ? '#34C759' : '#FF3B30'} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={ring}
                      initial={{ strokeDashoffset: ring }}
                      animate={{ strokeDashoffset: ring * (1 - Math.min(pctNum, 100) / 100) }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.pct}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-subtext)', fontWeight: 600 }}>%</span>
                  </div>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-subtext)', margin: '0 0 3px', fontWeight: 500 }}>{stats.att} of {stats.tot} sessions</p>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: pctNum >= 75 ? '#34C759' : '#FF3B30' }}>
                  {pctNum >= 75 ? '↑ On track' : '↓ Below target'}
                </p>
              </div>
            </div>

            {/* skip */}
            <div style={{ ...cardSt, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={labelSt}>Safe Skips</p>
              <div>
                <p style={{ ...bigNumSt, fontSize: 38, color: '#34C759' }}>{stats.bunks}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '5px 0 0', fontWeight: 500 }}>can miss</p>
              </div>
            </div>

            {/* need */}
            <div style={{ ...cardSt, padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={labelSt}>Need to Attend</p>
              <div>
                <p style={{ ...bigNumSt, fontSize: 38, color: stats.need > 0 ? '#FF3B30' : 'var(--color-text)' }}>{stats.need}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '5px 0 0', fontWeight: 500 }}>to hit 75%</p>
              </div>
            </div>

            {/* AI CTA — bottom 2 cols */}
            <div style={{ ...cardSt, gridColumn: '2 / 4', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--color-primary-lo, rgba(0,122,255,0.06))', borderColor: 'var(--color-primary-lo, rgba(0,122,255,0.15))' }}>
              <div>
                <p style={{ ...labelSt, color: 'var(--color-primary)' }}>AI Planner</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '3px 0 0', letterSpacing: '-0.01em' }}>
                  Get a personalised attendance plan
                </p>
              </div>
              <Link to="/ai-planner" style={{ flexShrink: 0, background: 'var(--color-primary)', color: '#fff', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                Open →
              </Link>
            </div>
          </motion.div>
        )}

        {/* mobile AI CTA */}
        {isMobile && (
          <motion.div variants={FADE_UP}
            style={{ ...cardSt, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--color-primary-lo, rgba(0,122,255,0.06))', borderColor: 'var(--color-primary-lo, rgba(0,122,255,0.14))' }}>
            <div>
              <p style={{ ...labelSt, color: 'var(--color-primary)' }}>AI Planner</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '3px 0 0', letterSpacing: '-0.01em' }}>Personalised attendance plan</p>
            </div>
            <Link to="/ai-planner" style={{ flexShrink: 0, background: 'var(--color-primary)', color: '#fff', borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              Open →
            </Link>
          </motion.div>
        )}

        {/* ── SCHEDULE + CHART ── */}
        <motion.div variants={FADE_UP}
          style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 10 }}>

          {/* SCHEDULE */}
          <div style={{ ...cardSt, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={labelSt}>Today</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>{today}</p>
              </div>
              <button onClick={() => setExtraOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '6px 11px', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} strokeWidth={2.5} /> Add
              </button>
            </div>

            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {subjects.length === 0
                ? Array(3).fill(0).map((_, i) => <SlotSkeleton key={i} />)
                : todaySlots.length === 0
                ? (
                  <div style={{ padding: '30px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                        <rect x="1.5" y="2.5" width="12" height="10" rx="2" stroke="var(--color-subtext)" strokeWidth="1.4"/>
                        <path d="M4.5 1v2M10.5 1v2M1.5 6h12" stroke="var(--color-subtext)" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-subtext)', margin: 0, fontWeight: 500 }}>No classes today</p>
                  </div>
                )
                : todaySlots.map((slot, i) => {
                  const subId  = slot.subject?._id || slot.subject?.toString() || slot.subject;
                  const sub    = subjects.find(s => s._id === subId);
                  const accentColor = sub?.color || '#007AFF';
                  const busy   = updatingAttendance?.[subId];
                  const todayStr = new Date().toISOString().split('T')[0];

                  const ordinal = todaySlots.slice(0, i + 1)
                    .filter(s => (s.subject?._id || s.subject?.toString() || s.subject) === subId).length;

                  const logs = sub?.attendanceRecords?.filter(l =>
                    l.date && new Date(l.date).toISOString().split('T')[0] === todayStr
                  ) || [];
                  const log  = logs[ordinal - 1] || null;
                  const sm   = log ? (STATUS_MAP[log.status] || STATUS_MAP.Cancelled) : null;

                  const btnH = isMobile ? 36 : 30;

                  return (
                    <motion.div key={i} layout
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: isMobile ? '11px 12px' : '9px 12px',
                        borderRadius: 10,
                        background: 'var(--color-surface)',
                        opacity: busy ? 0.4 : 1,
                        borderLeft: `3px solid ${accentColor}`,
                        transition: 'opacity 0.2s',
                      }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-subtext)', width: 44, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {slot.time || `S${i + 1}`}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub?.name || 'Unmapped'}
                      </span>

                      {sub && log ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: sm.bg, fontSize: 10, fontWeight: 700, color: sm.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: sm.color }} />
                            {log.status}
                          </span>
                          <button onClick={() => undoAttendance(sub._id)} disabled={busy}
                            style={{ ...iconBtnSt, width: btnH, height: btnH, color: 'var(--color-subtext)' }}>
                            <RotateCcw size={11} />
                          </button>
                        </div>
                      ) : sub ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => markAttendance(sub._id, 'Present', slot.credit || 1)} disabled={busy}
                            style={{ ...iconBtnSt, width: btnH, height: btnH, background: 'rgba(52,199,89,0.10)', color: '#34C759', border: 'none' }}>
                            <Check size={isMobile ? 15 : 13} strokeWidth={2.5} />
                          </button>
                          <div style={{ position: 'relative' }}>
                            <button onClick={e => { e.stopPropagation(); setSlotMenu(slotMenu === i ? null : i); }}
                              style={{ ...iconBtnSt, width: btnH, height: btnH, color: slotMenu === i ? 'var(--color-primary)' : 'var(--color-subtext)', background: slotMenu === i ? 'var(--color-primary-lo, rgba(0,122,255,0.08))' : 'var(--color-surface)' }}>
                              <ChevronDown size={12} style={{ transform: slotMenu === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            <AnimatePresence>
                              {slotMenu === i && (
                                <>
                                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setSlotMenu(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={SPRING}
                                    style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.13)', padding: 4, minWidth: 120, zIndex: 50 }}>
                                    {['Absent', 'Medical', 'OD', 'Cancelled'].map(st => {
                                      const s = STATUS_MAP[st] || STATUS_MAP.Cancelled;
                                      return (
                                        <button key={st}
                                          onClick={() => { markAttendance(sub._id, st, slot.credit || 1); setSlotMenu(null); }}
                                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: s.color, fontFamily: 'inherit', textAlign: 'left' }}
                                          onMouseEnter={e => e.currentTarget.style.background = s.bg}
                                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                                          {st}
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* CHART */}
          <div style={{ ...cardSt, padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <p style={labelSt}>By Subject</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 12px', letterSpacing: '-0.02em' }}>Attendance %</p>

            <ResponsiveContainer width="100%" height={isMobile ? 100 : 120}>
              <BarChart data={chartData} barSize={isMobile ? 14 : 18} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <Tooltip cursor={false}
                  contentStyle={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 11, color: 'var(--color-text)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  formatter={v => [`${v}%`, 'Attendance']} />
                <Bar dataKey="pct" radius={[4, 4, 2, 2]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: isMobile ? 9 : 7 }}>
              {chartData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.full}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.pct >= 75 ? '#34C759' : '#FF3B30', fontVariantNumeric: 'tabular-nums' }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── HEATMAP ── */}
        <motion.div variants={FADE_UP} style={{ ...cardSt, padding: '16px', overflow: 'hidden' }}>
          <p style={labelSt}>Activity</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 14px', letterSpacing: '-0.02em' }}>Attendance Flow</p>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <AttendanceHeatmap subjects={subjects} />
          </div>
        </motion.div>

        {/* ── COURSES ── */}
        <motion.div variants={FADE_UP} style={{ ...cardSt, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={labelSt}>Courses</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>Active Subjects</p>
            </div>
            <Link to="/subjects"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: 'var(--color-primary-lo, rgba(0,122,255,0.08))' }}>
              Manage
            </Link>
          </div>

          {isMobile ? (
            /* mobile card rows */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map(sub => {
                const pct   = sub.total > 0 ? parseFloat((sub.attended / sub.total * 100).toFixed(1)) : 0;
                const isLow = pct < (sub.requiredAttendance || 75);
                const m     = stats.map[sub._id] || { safe: 0, need: 0 };
                return (
                  <div key={sub._id}
                    onClick={() => navigate(`/subjects?view=${sub._id}`)}
                    style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                    onTouchStart={e => e.currentTarget.style.background = 'var(--hover)'}
                    onTouchEnd={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: sub.color || '#888', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ width: 56, height: 3, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: isLow ? '#FF3B30' : '#34C759', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--color-subtext)', fontVariantNumeric: 'tabular-nums' }}>{sub.attended}/{sub.total}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isLow ? '#FF3B30' : '#34C759' }}>
                          {m.safe > 0 ? `${m.safe} skips` : m.need > 0 ? `${m.need} needed` : 'Steady'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: isLow ? '#FF3B30' : '#34C759', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* desktop table */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)' }}>
                    {['Subject', 'Progress', 'Score', 'Insight'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => {
                    const pct   = sub.total > 0 ? parseFloat((sub.attended / sub.total * 100).toFixed(1)) : 0;
                    const isLow = pct < (sub.requiredAttendance || 75);
                    const m     = stats.map[sub._id] || { safe: 0, need: 0 };
                    return (
                      <tr key={sub._id}
                        style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => navigate(`/subjects?view=${sub._id}`)}>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sub.color || '#888', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{sub.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 4, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: isLow ? '#FF3B30' : '#34C759', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--color-subtext)', fontVariantNumeric: 'tabular-nums' }}>{sub.attended}/{sub.total}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isLow ? '#FF3B30' : '#34C759', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 500 }}>
                          {m.safe > 0
                            ? <span style={{ color: '#34C759' }}>{m.safe} safe skip{m.safe > 1 ? 's' : ''}</span>
                            : m.need > 0
                            ? <span style={{ color: '#FF3B30' }}>{m.need} more needed</span>
                            : <span style={{ color: 'var(--color-subtext)' }}>Steady</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── EXTRA SESSION MODAL ── */}
      <AnimatePresence>
        {extraOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: isMobile ? 0 : '0 16px 24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setExtraOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
            <motion.div
              initial={{ opacity: 0, y: isMobile ? '100%' : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? '100%' : 24 }}
              transition={SPRING}
              style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: isMobile ? '100%' : 390,
                background: 'var(--color-card-bg)',
                borderRadius: isMobile ? '20px 20px 0 0' : 20,
                border: '1px solid var(--color-border)',
                boxShadow: '0 28px 80px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}>

              {/* drag pill */}
              {isMobile && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 4, background: 'var(--color-border)' }} />
                </div>
              )}

              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={labelSt}>Manual Entry</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>Log Extra Session</p>
                </div>
                <button onClick={() => setExtraOpen(false)} style={{ ...iconBtnSt, color: 'var(--color-subtext)' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 6px' }}>Subject</p>
                  <select value={extraForm.subjectId} onChange={e => setExtraForm(f => ({ ...f, subjectId: e.target.value }))} style={selectSt}>
                    <option value="">Select a subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 6px' }}>Status</p>
                    <select value={extraForm.status} onChange={e => setExtraForm(f => ({ ...f, status: e.target.value }))} style={selectSt}>
                      {['Present', 'Absent', 'OD', 'Medical'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ width: 82 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 6px' }}>Credit</p>
                    <input type="number" min="1" value={extraForm.credit}
                      onChange={e => setExtraForm(f => ({ ...f, credit: parseInt(e.target.value) || 1 }))}
                      style={{ ...selectSt, textAlign: 'center' }} />
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 6px' }}>Date</p>
                  <input type="date" value={extraForm.date} onChange={e => setExtraForm(f => ({ ...f, date: e.target.value }))} style={selectSt} />
                </div>

                <button onClick={handleExtra}
                  style={{ width: '100%', padding: isMobile ? 15 : 13, borderRadius: 12, background: 'var(--color-primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em', marginTop: 2 }}>
                  Log Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}