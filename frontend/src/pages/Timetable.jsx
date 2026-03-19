import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Save, Plus, Trash2, BookOpen, X, Check, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';
import TimetableUpload from '../components/TimetableUpload';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────
   APPLE DEVELOPER STRUCTURE — CSS vars, theme-agnostic
   Same layout language as Subjects (breadcrumb, rows,
   inline edit, left rail) but uses the app's own tokens.
───────────────────────────────────────────────────────── */

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const FONT = "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif";
const MONO = "'SF Mono','Fira Code','Fira Mono',monospace";
const SP   = { type: 'spring', stiffness: 340, damping: 28 };

/* Apple system colour palette for subject markers */
const PALETTE = [
  '#2997FF','#30D158','#FF9F0A','#BF5AF2',
  '#FF453A','#64D2FF','#FFD60A','#FF6B35',
];
const accent = (sub, i) => sub?.color || PALETTE[i % PALETTE.length];

const lbl = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: 'var(--color-subtext)', margin: 0,
  fontFamily: FONT,
};

const fieldSt = {
  width: '100%', padding: '9px 12px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8, fontSize: 13, fontWeight: 500,
  color: 'var(--color-text)', fontFamily: FONT,
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
};

function useIsMobile(bp = 1024) {
  const [m, set] = useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : false);
  useEffect(() => {
    const fn = () => set(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}

/* ════════════════════════════════════════════════════════════ */
export default function Timetable() {
  const { subjects, timetable, updateTimetable, fetchUser } = useStore();
  const isMobile = useIsMobile();

  const [local,     setLocal]     = useState(timetable || []);
  const [activeDay, setActiveDay] = useState(
    DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  );
  const [saving, setSaving] = useState(false);

  const slotsFor = d => local.find(e => e.day === d)?.slots || [];

  const addSlot = (day) => {
    const next  = local.map(d => ({ ...d, slots: [...d.slots] }));
    let   entry = next.find(d => d.day === day);
    if (!entry) { entry = { day, slots: [] }; next.push(entry); }
    entry.slots.push({ time: '09:00 - 10:00', subject: subjects[0]?._id || '', credit: 1 });
    setLocal(next);
  };

  const removeSlot = (day, idx) =>
    setLocal(local.map(d => d.day === day ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d));

  const updateSlot = (day, idx, field, value) =>
    setLocal(local.map(d => {
      if (d.day !== day) return d;
      return { ...d, slots: d.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s) };
    }));

  const handleSave = async () => {
    setSaving(true);
    const id = toast.loading('Saving schedule…');
    try {
      await updateTimetable(local);
      toast.success('Schedule saved', { id });
    } catch { 
      toast.error('Failed to save', { id }); 
    } finally { 
      setSaving(false); 
    }
  };

  const slots = slotsFor(activeDay);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100svh', paddingBottom: isMobile ? 96 : 48, fontFamily: FONT }}>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--color-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-subtext)', fontFamily: FONT }}>Attend</span>
          <ChevronRight size={12} style={{ color: 'var(--color-subtext)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Timetable</span>
        </div>

        {/* controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TimetableUpload onComplete={async () => {
             await fetchUser();
             const f = useStore.getState().timetable;
             if (f) setLocal(f);
          }} />

          {/* save */}
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', cursor: 'pointer', fontFamily: FONT,
            fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
            opacity: saving ? 0.65 : 1, transition: 'opacity 0.2s', whiteSpace: 'nowrap'
          }}>
            {saving
              ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ttspin .7s linear infinite' }} />
              : <Save size={14} strokeWidth={2.5} />}
            {saving ? 'Saving…' : (isMobile ? 'Save' : 'Save Schedule')}
          </button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      {isMobile
        ? <MobileView days={DAYS} todayIdx={todayIdx} activeDay={activeDay} setActiveDay={setActiveDay} slots={slots} subjects={subjects} addSlot={addSlot} removeSlot={removeSlot} updateSlot={updateSlot} slotsFor={slotsFor} />
        : <DesktopView days={DAYS} todayIdx={todayIdx} activeDay={activeDay} setActiveDay={setActiveDay} slots={slots} subjects={subjects} addSlot={addSlot} removeSlot={removeSlot} updateSlot={updateSlot} slotsFor={slotsFor} />
      }

      <style>{`
        @keyframes ttspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DESKTOP VIEW
══════════════════════════════════════════════════════════ */
function DesktopView({ days, todayIdx, activeDay, setActiveDay, slots, subjects, addSlot, removeSlot, updateSlot, slotsFor }) {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40, alignItems: 'start' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ ...lbl, marginBottom: 8, paddingLeft: 8 }}>Week</p>
        {days.map((day, di) => {
          const count    = slotsFor(day).length;
          const isActive = day === activeDay;
          const isToday  = di === todayIdx;

          return (
            <button key={day} onClick={() => setActiveDay(day)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT,
                background: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-subtext)',
                textAlign: 'left', transition: 'background 0.15s, color 0.15s',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02), 0 0 0 1px var(--color-border)' : 'none',
              }}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'var(--hover)'; }}
              onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, letterSpacing: '-0.01em' }}>
                  {day}
                  {isToday && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-primary)', fontWeight: 700, backgroundColor: 'var(--color-primary-lo, rgba(0,122,255,0.1))', padding: '2px 6px', borderRadius: 4 }}>TODAY</span>}
                </span>
              </div>
              {count > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? 'var(--color-text)' : 'var(--color-subtext)' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeDay}</p>
            <p style={{ ...lbl, marginTop: 6, textTransform: 'none', letterSpacing: '0' }}>{slots.length} class{slots.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={() => addSlot(activeDay)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
            <Plus size={14} strokeWidth={2.5} style={{ color: 'var(--color-primary)' }}/> Add Class
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            {slots.length === 0 ? (
              <EmptyState onAdd={() => addSlot(activeDay)} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AnimatePresence mode="popLayout">
                  {slots.map((slot, idx) => (
                    <SlotCard key={idx} slot={slot} idx={idx} subjects={subjects} day={activeDay} onUpdate={updateSlot} onRemove={removeSlot} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MOBILE VIEW
══════════════════════════════════════════════════════════ */
function MobileView({ days, todayIdx, activeDay, setActiveDay, slots, subjects, addSlot, removeSlot, updateSlot, slotsFor }) {
  return (
    <div style={{ padding: '16px 14px 0' }}>

      {/* Segmented Control / Pill strip */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 8, marginBottom: 16 }}>
        {days.map((day, di) => {
          const count    = slotsFor(day).length;
          const isActive = day === activeDay;
          const isToday  = di === todayIdx;
          
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: FONT,
                background: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-subtext)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02), 0 0 0 1px var(--color-border)' : 'none',
                transition: 'all 0.15s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, letterSpacing: '-0.01em' }}>{day.slice(0, 3)}</span>
                {count > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? 'var(--color-text)' : 'var(--color-primary)' }} />}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>{activeDay}</p>
        </div>
        <button onClick={() => addSlot(activeDay)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
          <Plus size={13} strokeWidth={2.5} style={{ color: 'var(--color-primary)' }}/> Add
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeDay} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
          {slots.length === 0 ? <EmptyState onAdd={() => addSlot(activeDay)} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence mode="popLayout">
                {slots.map((slot, idx) => (
                  <SlotCard key={idx} slot={slot} idx={idx} subjects={subjects} day={activeDay} onUpdate={updateSlot} onRemove={removeSlot} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SLOT CARD — Minimal Pro Developer Style
══════════════════════════════════════════════════════════ */
function SlotCard({ slot, idx, subjects, day, onUpdate, onRemove }) {
  const sub   = subjects.find(s => s._id === slot.subject);
  const color = accent(sub, idx);
  const [editing, setEditing] = useState(false);

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }} transition={SP}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}>
      
      {!editing ? (
        /* ── VIEW MODE ── */
        <div style={{ display: 'flex', cursor: 'pointer' }} onClick={() => setEditing(true)}
          onMouseEnter={e => e.currentTarget.parentNode.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
          onMouseLeave={e => e.currentTarget.parentNode.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'}>
          
          {/* Subtle color indicator left bar */}
          <div style={{ width: 3, background: color, flexShrink: 0 }} />

          <div style={{ padding: '14px 16px', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub?.name || <span style={{ color: 'var(--color-subtext)', fontStyle: 'italic', fontWeight: 500 }}>Unassigned</span>}
                </p>
                {(slot.credit || 0) > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
                    {slot.credit} CR
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} strokeWidth={2} style={{ color: 'var(--color-subtext)' }} />
                <span style={{ fontSize: 12, color: 'var(--color-subtext)', fontWeight: 500, fontFamily: MONO }}>
                  {slot.time || '—'}
                </span>
              </div>
            </div>

            <ChevronRight size={16} style={{ color: 'var(--color-border)' }} />
          </div>
        </div>
      ) : (
        /* ── EDIT MODE ── */
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={lbl}>Edit Class</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onRemove(day, idx)}
                style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
                <Trash2 size={13} />
              </button>
              <button onClick={() => setEditing(false)}
                style={{ padding: '0 12px', height: 28, borderRadius: 8, border: 'none', background: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, gap: 4 }}>
                <Check size={14} strokeWidth={2.5} /> Done
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ ...lbl, marginBottom: 6 }}>Subject</p>
              <div style={{ position: 'relative' }}>
                <BookOpen size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtext)', pointerEvents: 'none' }} />
                <select value={slot.subject} onChange={e => onUpdate(day, idx, 'subject', e.target.value)} style={{ ...fieldSt, paddingLeft: 32 }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}>
                  <option value="">— Unassigned —</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ ...lbl, marginBottom: 6 }}>Time</p>
                <div style={{ position: 'relative' }}>
                  <Clock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtext)', pointerEvents: 'none' }} />
                  <input type="text" value={slot.time} onChange={e => onUpdate(day, idx, 'time', e.target.value)} placeholder="09:00 - 10:00" style={{ ...fieldSt, paddingLeft: 32 }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                </div>
              </div>
              
              <div>
                <p style={{ ...lbl, marginBottom: 6 }}>Credits</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const on = (slot.credit || 1) === n;
                    return (
                      <button key={n} onClick={() => onUpdate(day, idx, 'credit', n)}
                        style={{ flex: 1, height: 35, borderRadius: 6, border: `1px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-primary)' : 'var(--color-bg)', color: on ? '#fff' : 'var(--color-text)', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </motion.div>
  );
}

/* ── empty state ── */
function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtext)' }}>
        <Clock size={20} strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>Free day</p>
        <p style={{ fontSize: 13, color: 'var(--color-subtext)', margin: '4px 0 0', fontWeight: 500 }}>No classes scheduled for this day.</p>
      </div>
      <button onClick={onAdd}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginTop: 8, transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
        <Plus size={14} strokeWidth={2.5} style={{ color: 'var(--color-primary)' }}/> Add first class
      </button>
    </div>
  );
}