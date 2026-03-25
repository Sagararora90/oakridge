import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, RotateCcw, ChevronDown, Plus, X, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import { StatSkeleton, SlotSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

/* ─── Tokens (hardcoded Apple system — matches Subjects/Analytics) ── */
const FONT  = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif";
const SPRING = { type: 'spring', stiffness: 380, damping: 32 };

const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] } },
};
const STAGGER = { show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } } };

const STATUS_MAP = {
  Present:   { color: 'var(--color-success)', bg: 'var(--color-success-lo)' },
  Absent:    { color: 'var(--color-danger)', bg: 'var(--color-danger-lo)' },
  Medical:   { color: 'var(--color-accent)', bg: 'var(--color-accent-lo)' },
  OD:        { color: 'var(--color-primary)', bg: 'var(--color-primary-lo)' },
  Cancelled: { color: 'var(--color-subtext)', bg: 'var(--color-border)' },
};

/* ─── Helpers ────────────────────────────────────────────────── */
function computeMeta(sub) {
  const req    = (sub.requiredAttendance || 75) / 100;
  const margin = sub.attended - req * sub.total;
  if (margin > 0) return { safe: Math.floor(margin / req), need: 0 };
  if (margin < 0) return { safe: 0, need: Math.ceil(Math.abs(margin) / (1 - req)) };
  return { safe: 0, need: 0 };
}

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

/* ─── Shared style atoms ─────────────────────────────────────── */
const card = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 18,
};

const labelSt = {
  fontSize: 11, fontWeight: 700,
  color: 'var(--color-subtext)',
  letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
  fontFamily: FONT,
};

const iconBtnSt = {
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0, fontFamily: FONT,
  color: 'var(--color-subtext)', transition: 'background .12s, color .12s',
};

const inputSt = {
  width: '100%', padding: '10px 13px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10, fontSize: 13, fontWeight: 500,
  color: 'var(--color-text)', fontFamily: FONT,
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
  boxSizing: 'border-box',
};

/* ─── Custom bar tooltip ─────────────────────────────────────── */
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '8px 12px', fontFamily: FONT,
      fontSize: 12, boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>{d.payload.full}</p>
      <p style={{ color: d.payload.pct >= 75 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, margin: 0 }}>
        {d.payload.pct}%
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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
  } = useStore();

  useEffect(() => {
    fetchUser(); fetchSubjects(); fetchTimetable();
    fetchExtraClasses(); fetchGamification();
    fetchAIBrief(); fetchNotifications();
  }, []); // eslint-disable-line

  const [extraOpen,  setExtraOpen]  = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState('');
  const [slotMenu,   setSlotMenu]   = useState(null);
  const [savingAll,  setSavingAll]  = useState(false);
  const [extraForm,  setExtraForm]  = useState({
    subjectId: '', status: 'Present', credit: 1,
    date: new Date().toISOString().split('T')[0],
  });

  const unread = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  /* ── derived stats ── */
  const stats = useMemo(() => {
    let att = 0, tot = 0, bunks = 0, need = 0;
    const map = {};
    subjects.forEach(s => {
      att += s.attended; tot += s.total;
      const m = computeMeta(s); map[s._id] = m;
      bunks += m.safe; need += m.need;
    });
    return { att, tot, pct: tot > 0 ? (att / tot * 100).toFixed(1) : '0.0', bunks, need, map };
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
      name:  s.name.substring(0, 3).toUpperCase(),
      pct:   s.total > 0 ? parseFloat((s.attended / s.total * 100).toFixed(1)) : 0,
      color: s.color || '#007AFF',
    })), [subjects]);

  const dayProgress = useMemo(() => {
    if (!todaySlots.length) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let marked = 0;
    todaySlots.forEach((slot, i) => {
      const subId = slot.subject?._id || slot.subject?.toString() || slot.subject;
      const sub   = subjects.find(s => s._id === subId);
      const ordinal = todaySlots.slice(0, i + 1)
        .filter(s => (s.subject?._id || s.subject) === subId).length;
      const logs = sub?.attendanceRecords?.filter(l =>
        l.date && new Date(l.date).toISOString().split('T')[0] === todayStr
      ) || [];
      if (logs[ordinal - 1]) marked++;
    });
    return (marked / todaySlots.length) * 100;
  }, [todaySlots, subjects]);

  const handleExtra = useCallback(async () => {
    if (!extraForm.subjectId) return toast.error('Select a subject');
    try {
      await addExtraAttendance(extraForm);
      setExtraOpen(false);
      setExtraForm({ subjectId: '', status: 'Present', credit: 1, date: new Date().toISOString().split('T')[0] });
      toast.success('Session logged');
    } catch { toast.error('Failed to log'); }
  }, [extraForm, addExtraAttendance]);

  const handleMarkAll = useCallback(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const unmarked = todaySlots.filter(slot => {
      const subId = slot.subject?._id || slot.subject?.toString() || slot.subject;
      const sub   = subjects.find(s => s._id === subId);
      const logs  = sub?.attendanceRecords?.filter(l =>
        l.date && new Date(l.date).toISOString().split('T')[0] === todayStr
      ) || [];
      return logs.length < todaySlots.filter(s => (s.subject?._id || s.subject) === subId).length;
    });
    if (unmarked.length === 0) return toast.error('All classes already marked');
    setSavingAll(true);
    const tid = toast.loading('Marking all as present…');
    try {
      for (const slot of unmarked) {
        const subId = slot.subject?._id || slot.subject?.toString() || slot.subject;
        await markAttendance(subId, 'Present', slot.credit || 1);
      }
      toast.success('Day marked!', { id: tid });
    } catch {
      toast.error('Failed to mark all', { id: tid });
    } finally {
      setSavingAll(false);
    }
  }, [todaySlots, subjects, markAttendance]);

  const pctNum = parseFloat(stats.pct);
  const ring   = 2 * Math.PI * 42;
  const isHealthy = pctNum >= 75;

  const glassStyle = {
    background: 'rgba(var(--bg-rgb), 0.98)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--color-border)',
  };

  /* ════ RENDER ════ */
  return (
    <div style={{
      background: 'var(--color-bg)',
      minHeight: '100svh',
      paddingBottom: isMobile ? 104 : 40,
      fontFamily: FONT,
    }}>

      {/* ── CATCH-UP RIBBON ── */}
      <AnimatePresence>
        {catchUp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'var(--color-warning-lo)',
              borderBottom: '1px solid var(--color-border)',
              padding: '10px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)', margin: 0 }}>
                  {catchUp.days} day{catchUp.days > 1 ? 's' : ''} unlogged
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '2px 0 0', fontWeight: 400 }}>
                  Auto-fill marks missed slots as Present
                </p>
              </div>
              <button
                onClick={() => {
                  const s = new Date(catchUp.last);
                  s.setDate(s.getDate() + 1);
                  autoFillMissed(s.toISOString(), catchUp.yest.toISOString(), 'Present');
                }}
                style={{
                  background: 'var(--color-warning)', color: '#FFFFFF', border: 'none',
                  borderRadius: 9, padding: '7px 14px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                Auto-fill
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        ...glassStyle,
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        height: 52, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>

        {/* left: title + day */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', flexShrink: 0 }}>
            Dashboard
          </span>
          <AnimatePresence>
            {!searchOpen && (
              <motion.span
                key="day"
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-subtext)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {today}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* search */}
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div key="sinput"
                initial={{ width: 32, opacity: 0 }}
                animate={{ width: isMobile ? 150 : 200, opacity: 1 }}
                exit={{ width: 32, opacity: 0 }} transition={SPRING}
              >
                <input
                  autoFocus value={query}
                  onChange={e => setQuery(e.target.value)}
                  onBlur={() => { if (!query) setSearchOpen(false); }}
                  placeholder="Search subjects…"
                  style={{
                    width: '100%', height: 32, padding: '0 11px',
                    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
                    borderRadius: 9, fontSize: 13, color: 'var(--color-text)',
                    fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </motion.div>
            ) : (
              <motion.button key="sicon"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                style={{ ...iconBtnSt, width: 32, height: 32, borderRadius: 9 }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.3" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="9.2" y1="9.2" x2="12.2" y2="12.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(v => !v)}
              style={{
                ...iconBtnSt, width: 32, height: 32, borderRadius: 9, position: 'relative',
                background: notifOpen ? 'var(--color-primary-lo)' : 'var(--color-surface)',
                border: notifOpen ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                color: notifOpen ? 'var(--color-primary)' : 'var(--color-subtext)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1.5C5.01 1.5 3 3.51 3 6v3.5l-1 1V11h11v-.5l-1-1V6c0-2.49-2.01-4.5-4.5-4.5z"
                  stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M6.2 12a1.3 1.3 0 002.6 0" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--color-danger)', border: '1.5px solid var(--color-bg)',
                }} />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={SPRING}
                    style={{
                      position: isMobile ? 'fixed' : 'absolute',
                      right: isMobile ? 12 : 0, 
                      left: isMobile ? 12 : 'auto',
                      top: isMobile ? 64 : 'calc(100% + 8px)',
                      width: isMobile ? 'auto' : 280,
                      maxHeight: 400, zIndex: 50,
                      ...glassStyle,
                      borderRadius: 16,
                      boxShadow: 'var(--shadow-lg)',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}
                  >
                    <div style={{
                      padding: '11px 14px', borderBottom: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Notifications</span>
                      {unread > 0 && (
                        <button onClick={markNotificationsRead} style={{
                          background: 'none', border: 'none', fontSize: 12,
                          fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', fontFamily: FONT,
                        }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {notifications.length === 0
                        ? <p style={{ fontSize: 13, color: 'var(--color-subtext)', textAlign: 'center', padding: '24px 0', margin: 0 }}>All clear</p>
                        : notifications.map(n => (
                          <div key={n._id} style={{
                            padding: '9px 11px', borderRadius: 10,
                            background: n.read ? 'transparent' : 'var(--color-primary-lo)',
                            border: `1px solid ${n.read ? 'transparent' : 'var(--color-primary-lo)'}`,
                            opacity: n.read ? 0.55 : 1,
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

          {/* avatar */}
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'U'}&backgroundColor=007AFF`}
            alt={user?.name || 'User'}
            style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--color-border)', flexShrink: 0, cursor: 'pointer' }}
          />
        </div>
      </header>

      {/* ══ PAGE BODY ══ */}
      <motion.div
        variants={STAGGER} initial="hidden" animate="show"
        style={{
          padding: isMobile ? '16px 14px' : '24px 24px',
          maxWidth: 960, margin: '0 auto',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >

        {/* ── STAT CARDS ── */}
        {subjects.length === 0 ? (
          <motion.div variants={FADE_UP}
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10 }}>
            {Array(isMobile ? 2 : 4).fill(0).map((_, i) => <StatSkeleton key={i} />)}
          </motion.div>

        ) : isMobile ? (
          /* ── MOBILE stats ── */
          <motion.div variants={FADE_UP} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* ring card */}
            <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="9"/>
                  <motion.circle cx="50" cy="50" r="42" fill="none"
                    stroke={isHealthy ? 'var(--success)' : 'var(--danger)'} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={ring}
                    initial={{ strokeDashoffset: ring }}
                    animate={{ strokeDashoffset: ring * (1 - Math.min(pctNum, 100) / 100) }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.pct}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-subtext)' }}>%</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={labelSt}>Overall attendance</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: isHealthy ? 'var(--color-success)' : 'var(--color-danger)', margin: '5px 0 3px' }}>
                  {isHealthy ? '↑ On track' : '↓ Below target'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: 0, fontWeight: 400 }}>
                  {stats.att} of {stats.tot} sessions
                </p>
              </div>
            </div>
            {/* 2-col */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ ...card, padding: 16 }}>
                <p style={labelSt}>Safe skips</p>
                <p style={{ fontSize: 34, fontWeight: 700, color: 'var(--color-success)', letterSpacing: '-0.04em', margin: '10px 0 2px', lineHeight: 1 }}>{stats.bunks}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: 0 }}>can miss</p>
              </div>
              <div style={{ ...card, padding: 16 }}>
                <p style={labelSt}>Need to attend</p>
                <p style={{ fontSize: 34, fontWeight: 700, color: stats.need > 0 ? 'var(--color-danger)' : 'var(--color-text)', letterSpacing: '-0.04em', margin: '10px 0 2px', lineHeight: 1 }}>{stats.need}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: 0 }}>to hit 75%</p>
              </div>
            </div>
          </motion.div>

        ) : (
          /* ── DESKTOP stats bento ── */
          <motion.div variants={FADE_UP} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'auto auto',
            gap: 10,
          }}>
            {/* ring — spans 2 rows */}
            <div style={{ ...card, gridRow: '1 / 3', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', background: `linear-gradient(135deg, transparent 50%, ${isHealthy ? 'var(--color-success-lo)' : 'var(--color-danger-lo)'} 100%)`, pointerEvents: 'none' }} />
              <div>
                <p style={labelSt}>Overall</p>
                <div style={{ marginTop: 16, position: 'relative', display: 'inline-block' }}>
                  <svg width="96" height="96" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="7"/>
                    <motion.circle cx="50" cy="50" r="42" fill="none"
                      stroke={isHealthy ? 'var(--success)' : 'var(--danger)'} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={ring}
                      initial={{ strokeDashoffset: ring }}
                      animate={{ strokeDashoffset: ring * (1 - Math.min(pctNum, 100) / 100) }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{stats.pct}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-subtext)', fontWeight: 600 }}>%</span>
                  </div>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-subtext)', margin: '0 0 3px', fontWeight: 400 }}>{stats.att} of {stats.tot} sessions</p>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: isHealthy ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {isHealthy ? '↑ On track' : '↓ Below target'}
                </p>
              </div>
            </div>

            {/* safe skips */}
            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={labelSt}>Safe skips</p>
              <div>
                <p style={{ fontSize: 38, fontWeight: 700, color: 'var(--color-success)', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>{stats.bunks}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '5px 0 0' }}>can miss</p>
              </div>
            </div>

            {/* need */}
            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={labelSt}>Need to attend</p>
              <div>
                <p style={{ fontSize: 38, fontWeight: 700, color: stats.need > 0 ? 'var(--color-danger)' : 'var(--color-text)', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>{stats.need}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '5px 0 0' }}>to hit 75%</p>
              </div>
            </div>

            {/* sessions */}
            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={labelSt}>Sessions</p>
              <div>
                <p style={{ fontSize: 38, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>{stats.tot}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtext)', margin: '5px 0 0' }}>{stats.att} attended</p>
              </div>
            </div>

            {/* AI CTA — spans cols 2-4 row 2 */}
            <div style={{
              ...card, gridColumn: '2 / 5', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'var(--color-primary-lo)', border: '1px solid var(--color-primary-lo)',
            }}>
              <div>
                <p style={{ ...labelSt, color: 'var(--color-primary)' }}>AI Planner</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '3px 0 0', letterSpacing: '-0.01em' }}>
                  Get a personalised attendance plan
                </p>
              </div>
              <Link to="/ai-planner" style={{
                flexShrink: 0, background: 'var(--primary)', color: '#FFFFFF',
                borderRadius: 980, padding: '8px 16px',
                fontSize: 12.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                Open <ChevronRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}

        {/* mobile AI CTA */}
        {isMobile && (
          <motion.div variants={FADE_UP} style={{
            ...card, padding: '14px 16px', background: 'var(--color-primary-lo)',
            border: '1px solid var(--color-primary-lo)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <p style={{ ...labelSt, color: 'var(--color-primary)' }}>AI Planner</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '3px 0 0' }}>Personalised plan</p>
            </div>
            <Link to="/ai-planner" style={{
              flexShrink: 0, background: 'var(--color-primary)', color: 'white',
              borderRadius: 980, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}>
              Open →
            </Link>
          </motion.div>
        )}

        {/* ── SCHEDULE + CHART ── */}
        <motion.div variants={FADE_UP} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 10 }}>

          {/* SCHEDULE */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '13px 16px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={labelSt}>Today</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>{today}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {todaySlots.length > 0 && dayProgress < 100 && (
                  <button onClick={handleMarkAll} disabled={savingAll} style={{
                    background: 'var(--color-success-lo)', border: '1px solid var(--color-success-lo)',
                    borderRadius: 9, padding: '6px 11px',
                    fontSize: 12, fontWeight: 600, color: 'var(--color-success)',
                    cursor: 'pointer', fontFamily: FONT,
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'background .12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-success)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-success-lo)'}
                  >
                    <Check size={12} strokeWidth={2.5} /> Mark all
                  </button>
                )}
                <button onClick={() => setExtraOpen(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
                  borderRadius: 9, padding: '6px 11px',
                  fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                  cursor: 'pointer', fontFamily: FONT, transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-card-bg)'}
                >
                  <Plus size={12} strokeWidth={2.5} /> Add
                </button>
              </div>
            </div>

            {/* day progress bar */}
            {todaySlots.length > 0 && (
              <div style={{ height: 3, background: 'var(--color-border)', position: 'relative' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${dayProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ position: 'absolute', height: '100%', background: 'var(--color-primary)' }}
                />
              </div>
            )}

            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {subjects.length === 0
                ? Array(3).fill(0).map((_, i) => <SlotSkeleton key={i} />)
                : todaySlots.length === 0
                ? (
                  <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
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
                  const accent = sub?.color || '#007AFF';
                  const busy   = updatingAttendance?.[subId];
                  const todayStr = new Date().toISOString().split('T')[0];
                  const ordinal  = todaySlots.slice(0, i + 1)
                    .filter(s => (s.subject?._id || s.subject?.toString() || s.subject) === subId).length;
                  const logs = sub?.attendanceRecords?.filter(l =>
                    l.date && new Date(l.date).toISOString().split('T')[0] === todayStr
                  ) || [];
                  const log  = logs[ordinal - 1] || null;
                  const sm   = log ? (STATUS_MAP[log.status] || STATUS_MAP.Cancelled) : null;
                  const btnH = isMobile ? 36 : 30;

                  return (
                    <motion.div key={i} layout style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: isMobile ? '11px 12px' : '9px 12px',
                      borderRadius: 10, background: 'var(--color-surface)',
                      opacity: busy ? 0.4 : 1,
                      borderLeft: `3px solid ${accent}`,
                      transition: 'opacity .2s',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-subtext)', width: 44, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {slot.time || `S${i + 1}`}
                      </span>
                      <span style={{ 
                        flex: 1, 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: 'var(--color-text)', 
                        letterSpacing: '-0.01em', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        minWidth: 0 // Crucial for ellipsis inside flex
                      }}>
                        {sub?.name || 'Unmapped'}
                      </span>

                      {sub && log ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: sm.bg, fontSize: 10, fontWeight: 700, color: sm.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: sm.color }} />
                            {log.status}
                          </span>
                          <button onClick={() => undoAttendance(sub._id)} disabled={busy} style={{ ...iconBtnSt, width: btnH, height: btnH }}>
                            <RotateCcw size={11} />
                          </button>
                        </div>
                      ) : sub ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => markAttendance(sub._id, 'Present', slot.credit || 1)}
                            disabled={busy}
                            style={{ ...iconBtnSt, width: btnH, height: btnH, background: 'var(--color-success-lo)', color: 'var(--color-success)', border: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-success-lo)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-success-lo)'}
                          >
                            <Check size={isMobile ? 15 : 13} strokeWidth={2.5} />
                          </button>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={e => { e.stopPropagation(); setSlotMenu(slotMenu === i ? null : i); }}
                              style={{
                                ...iconBtnSt, width: btnH, height: btnH,
                                background: slotMenu === i ? 'var(--color-primary-lo)' : 'var(--color-surface)',
                                border: slotMenu === i ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                color: slotMenu === i ? 'var(--color-primary)' : 'var(--color-subtext)',
                              }}
                            >
                              <ChevronDown size={12} style={{ transform: slotMenu === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                            </button>
                            <AnimatePresence>
                              {slotMenu === i && (
                                <>
                                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setSlotMenu(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 5, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.97 }} transition={SPRING}
                                    style={{
                                      position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                                      background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
                                      borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                                      padding: 4, minWidth: 118, zIndex: 50,
                                    }}
                                  >
                                    {['Absent', 'Medical', 'OD', 'Cancelled'].map(st => {
                                      const s = STATUS_MAP[st];
                                      return (
                                        <button key={st}
                                          onClick={() => { markAttendance(sub._id, st, slot.credit || 1); setSlotMenu(null); }}
                                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: s.color, fontFamily: FONT, textAlign: 'left' }}
                                          onMouseEnter={e => e.currentTarget.style.background = s.bg}
                                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
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
                })
              }
            </div>
          </div>

          {/* CHART */}
          <div style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column' }}>
            <p style={labelSt}>By subject</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 14px', letterSpacing: '-0.02em' }}>
              Attendance %
            </p>
            <ResponsiveContainer width="100%" height={isMobile ? 100 : 120}>
              <BarChart data={chartData} barSize={isMobile ? 14 : 18} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <Tooltip cursor={false} content={<BarTooltip />} />
                <Bar dataKey="pct" radius={[5, 5, 2, 2]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── HEATMAP ── */}
        <motion.div variants={FADE_UP} style={{ ...card, padding: 18, overflow: 'hidden' }}>
          <p style={labelSt}>Activity</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '2px 0 16px', letterSpacing: '-0.02em' }}>
            Attendance flow
          </p>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <AttendanceHeatmap subjects={subjects} />
          </div>
        </motion.div>

        {/* ── SUBJECTS ROW LIST ── */}
        <motion.div variants={FADE_UP} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <p style={labelSt}>Your Subjects</p>
            <Link to="/subjects" style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Manage →
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
          }}>
            {subjects.map(s => {
              const p = s.total > 0 ? (s.attended / s.total * 100).toFixed(0) : 0;
              const bc = p >= (s.requiredAttendance || 75) ? 'var(--success)' : (p >= (s.requiredAttendance || 75) - 15 ? 'var(--warning)' : 'var(--danger)');
              return (
                <div key={s._id} 
                  onClick={() => navigate(`/subjects?view=${s._id}`)}
                  style={{ 
                    ...card, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    transition: 'transform 0.2s ease, background 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lo)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card-bg)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color || '#007AFF', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {s.name}
                    </p>
                    <div style={{ height: 3, background: 'var(--color-border)', borderRadius: 99, marginTop: 6, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${p}%`, background: bc, borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: bc, flexShrink: 0 }}>{p}%</span>
                  <ChevronRight size={14} style={{ color: 'var(--color-subtext)', opacity: 0.6 }} />
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>

      {/* ── EXTRA SESSION MODAL ── */}
      <AnimatePresence>
        {extraOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: isMobile ? 0 : '0 16px 32px',
          }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setExtraOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: isMobile ? '100%' : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isMobile ? '100%' : 20 }}
              transition={SPRING}
              style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: isMobile ? '100%' : 390,
                background: 'var(--color-bg)',
                borderRadius: isMobile ? '22px 22px 0 0' : 20,
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
                overflow: 'hidden',
              }}
            >
              {isMobile && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                  <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--color-border)' }} />
                </div>
              )}

              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#86868B', marginBottom: 2 }}>
                    Manual Entry
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                    Log extra session
                  </div>
                </div>
                <button onClick={() => setExtraOpen(false)} style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'var(--color-surface)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: 'var(--color-subtext)',
                  transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* subject */}
                <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', flex: '0 0 80px' }}>Subject</span>
                    <select
                      value={extraForm.subjectId}
                      onChange={e => setExtraForm(f => ({ ...f, subjectId: e.target.value }))}
                      style={{ ...inputSt, padding: '0', background: 'transparent', border: 'none', textAlign: 'right', fontSize: 13 }}
                    >
                      <option value="">Select…</option>
                      {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-subtext)', marginBottom: 6 }}>Status</div>
                    <select
                      value={extraForm.status}
                      onChange={e => setExtraForm(f => ({ ...f, status: e.target.value }))}
                      style={{ ...inputSt, padding: 0, background: 'transparent', border: 'none', fontSize: 16, fontWeight: 700 }}
                    >
                      {['Present', 'Absent', 'OD', 'Medical'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-subtext)', marginBottom: 6 }}>Credit</div>
                    <input
                      type="number" min="1"
                      value={extraForm.credit}
                      onChange={e => setExtraForm(f => ({ ...f, credit: parseInt(e.target.value) || 1 }))}
                      style={{ ...inputSt, padding: 0, background: 'transparent', border: 'none', fontSize: 16, fontWeight: 700, textAlign: 'left' }}
                    />
                  </div>
                </div>

                {/* date */}
                <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, padding: '12px 16px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-subtext)', marginBottom: 6 }}>Date</div>
                  <input
                    type="date" value={extraForm.date}
                    onChange={e => setExtraForm(f => ({ ...f, date: e.target.value }))}
                    style={{ ...inputSt, padding: 0, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => setExtraOpen(false)} style={{
                    flex: 1, padding: '13px 0', borderRadius: 14,
                    border: '1.5px solid var(--color-border)', background: 'var(--color-card-bg)',
                    color: 'var(--color-text)', cursor: 'pointer', fontFamily: FONT,
                    fontSize: 15, fontWeight: 600, transition: 'background .12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-card-bg)'}
                  >
                    Cancel
                  </button>
                  <button onClick={handleExtra} style={{
                    flex: 2, padding: '13px 0', borderRadius: 14,
                    border: 'none', background: 'var(--color-primary)', color: '#FFFFFF',
                    cursor: 'pointer', fontFamily: FONT,
                    fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'background .12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                  >
                    <Check size={15} strokeWidth={2.5} /> Log Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}