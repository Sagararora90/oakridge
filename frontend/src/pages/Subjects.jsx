import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar as CalendarIcon,
  Sparkles, Loader2, GraduationCap, ChevronRight,
  Check, PenLine,
} from 'lucide-react';
import useStore from '../store/useStore';
import AttendanceRegister from '../components/AttendanceRegister';
import toast from 'react-hot-toast';

/* ─── Tokens ─────────────────────────────────────────────────── */
const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif";
const MONO = "'SF Mono','Fira Code',monospace";
const SP   = { type: 'spring', stiffness: 360, damping: 32 };

const PALETTE = [
  '#007AFF','#34C759','#FF9F0A','#AF52DE',
  '#FF3B30','#32ADE6','#FFD60A','#FF6B35',
];

/* ─── Helpers ────────────────────────────────────────────────── */
function defaultForm() {
  return {
    name: '', requiredAttendance: 75, color: '#007AFF',
    initialAttended: 0, initialTotal: 0, initialDate: '',
  };
}

function useIsMobile(bp = 768) {
  const [m, set] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < bp : false
  );
  useEffect(() => {
    const fn = () => set(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}

function pct(attended, total) {
  return total === 0 ? 0 : Math.round((attended / total) * 100);
}

function statusInfo(attended, total, req) {
  const p = pct(attended, total);
  if (p >= req) return { cls: 'safe', label: 'On track' };
  const gap = Math.ceil((req / 100 * total - attended) / (1 - req / 100));
  if (p >= req - 15) return { cls: 'warn', label: `${gap} more to attend` };
  return { cls: 'bad', label: `${gap} more needed` };
}

function barColor(attended, total, req) {
  const p = pct(attended, total);
  if (p >= req) return 'var(--color-success, #34C759)';
  if (p >= req - 15) return 'var(--color-warning, #FF9F0A)';
  return 'var(--color-error, #FF3B30)';
}

/* ─── Shared style objects ───────────────────────────────────── */
const inputBase = {
  border: 'none', outline: 'none',
  fontSize: 16, fontWeight: 700,
  color: 'var(--color-text)', fontFamily: FONT,
  background: 'transparent', width: '100%',
  letterSpacing: '-0.02em',
};

const rowInputBase = {
  flex: 1, border: 'none', outline: 'none',
  fontSize: 13, fontWeight: 500,
  color: 'var(--color-text)', fontFamily: FONT,
  background: 'transparent', textAlign: 'right', minWidth: 0,
};

/* ─── Sub-components ─────────────────────────────────────────── */
function StatBlock({ value, label }) {
  return (
    <div style={{ flex: 1, background: 'var(--color-surface)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-subtext)', fontWeight: 500, marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
}

function StatusPill({ cls, label }) {
  const map = {
    safe: { bg: 'var(--color-success-lo)', color: 'var(--color-success)', dot: 'var(--color-success)' },
    warn: { bg: 'var(--color-warning-lo)', color: 'var(--color-warning)', dot: 'var(--color-warning)' },
    bad:  { bg: 'var(--color-error-lo)', color: 'var(--color-error)', dot: 'var(--color-error)' },
  };
  const s = map[cls];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      fontSize: 11.5, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {label}
    </div>
  );
}

function CourseCard({ subject, onMark, onEdit, onUndo, onOpenRegister }) {
  const {
    _id, name, color,
    attendedCount = 0, totalCount = 0,
    initialAttended = 0, initialTotal = 0,
    requiredAttendance = 75,
  } = subject;

  const attended = attendedCount + initialAttended;
  const total    = totalCount    + initialTotal;
  const p        = pct(attended, total);
  const st       = statusInfo(attended, total, requiredAttendance);
  const bc       = barColor(attended, total, requiredAttendance);

  return (
    <div
      style={{ background: 'var(--color-card-bg)', padding: 20, transition: 'background .12s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-card-bg)'}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {name}
          </div>
        </div>
        <button
          onClick={() => onEdit(subject)}
          style={{
            width: 26, height: 26, borderRadius: 8,
            border: '1px solid var(--color-border)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-subtext)', flexShrink: 0,
            transition: 'background .12s, color .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-subtext)'; }}
        >
          <PenLine size={12} />
        </button>
      </div>

      {/* stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatBlock value={attended} label="attended" />
        <StatBlock value={total}    label="total"    />
        <StatBlock value={`${p}%`}  label="current"  />
      </div>

      {/* progress bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ height: 5, borderRadius: 99, background: 'var(--color-border)', opacity: 0.25, overflow: 'hidden', marginBottom: 10 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${p}%` }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ height: '100%', borderRadius: 99, background: bc }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill cls={st.cls} label={st.label} />
          <span style={{ fontSize: 11, color: 'var(--color-subtext)', fontWeight: 600 }}>
            Target {requiredAttendance}%
          </span>
        </div>
      </div>

      {/* register link */}
      {onOpenRegister && (
        <button
          onClick={() => onOpenRegister(subject)}
          style={{
            width: '100%', padding: '9px 0', marginBottom: 12,
            borderRadius: 10, border: '1px solid var(--color-border)',
            background: 'transparent', fontSize: 13, fontWeight: 700,
            color: 'var(--color-primary)', cursor: 'pointer', fontFamily: FONT,
            transition: 'all .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lo)'; e.currentTarget.style.borderColor = 'transparent'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          View Register
        </button>
      )}

      {/* mark buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Present', present: true,  bg: 'var(--color-success-lo)', color: 'var(--color-success)', Icon: Check },
          { label: 'Absent',  present: false, bg: 'var(--color-error-lo)',   color: 'var(--color-error)',   Icon: X     },
        ].map(({ label, present, bg, color: c, Icon }) => (
          <button
            key={label}
            onClick={() => onMark(_id, present)}
            style={{
              padding: '11px 0', borderRadius: 12, border: 'none',
              background: bg, color: c,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.04)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Icon size={14} strokeWidth={3} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SheetRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '12px 16px', gap: 12,
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', flex: '0 0 110px' }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function HalfBox({ label, children }) {
  return (
    <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-subtext)' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function Subjects() {
  const {
    subjects: rawSubjects, projections, semesterEndDate,
    fetchProjections, addSubject, updateSubject,
    markAttendance, undoAttendance,
    syncPortalAttendance, updateSemesterEndDate,
    loading: storeLoading,
  } = useStore();

  const subjects = [...rawSubjects].sort((a,b) => a.name.localeCompare(b.name));
  const isMobile = useIsMobile();

  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [editingId,       setEditingId]       = useState(null);
  const [subForm,         setSubForm]         = useState(defaultForm());
  const [submitting,      setSubmitting]      = useState(false);
  const [viewRegisterFor, setViewRegisterFor] = useState(null);

  /* deep-link ?view=id */
  useEffect(() => {
    if (!storeLoading && subjects.length > 0) {
      const id = new URLSearchParams(window.location.search).get('view');
      if (id) {
        const t = subjects.find(s => s._id === id);
        if (t) {
          setViewRegisterFor(t);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [storeLoading, subjects]);

  const displayDate = semesterEndDate
    ? new Date(semesterEndDate).toISOString().split('T')[0]
    : '';

  useEffect(() => {
    if (displayDate) fetchProjections(displayDate);
  }, [displayDate, fetchProjections]);

  const handlePortalSync = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('portal', file);
    const id = toast.loading('Syncing portal…');
    try {
      await syncPortalAttendance(fd);
      toast.success('Portal synced', { id });
    } catch {
      toast.error('Sync failed', { id });
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setSubForm(defaultForm());
    setIsModalOpen(true);
  };

  const openEdit = (sub) => {
    setEditingId(sub._id);
    setSubForm({
      name:               sub.name,
      requiredAttendance: sub.requiredAttendance,
      color:              sub.color,
      initialAttended:    sub.initialAttended || 0,
      initialTotal:       sub.initialTotal    || 0,
      initialDate:        sub.initialDate
        ? new Date(sub.initialDate).toISOString().split('T')[0]
        : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) await updateSubject(editingId, subForm);
      else           await addSubject(subForm);
      setIsModalOpen(false);
      toast.success(editingId ? 'Subject updated' : 'Subject added');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const setField = field => e =>
    setSubForm(f => ({
      ...f,
      [field]: e.target.type === 'number'
        ? parseInt(e.target.value) || 0
        : e.target.value,
    }));

  /* ════ RENDER ════ */
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100svh', paddingBottom: isMobile ? 96 : 48, fontFamily: FONT }}>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(var(--bg-rgb), 0.8)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        height: 52, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--color-subtext)', fontWeight: 400 }}>Attend</span>
          <ChevronRight size={12} style={{ color: 'var(--color-subtext)', opacity: 0.5 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Subjects</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* semester end */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 980,
            background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
          }}>
            <CalendarIcon size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!isMobile && (
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-subtext)', lineHeight: 1 }}>
                  Semester End
                </span>
              )}
              <input
                type="date" value={displayDate}
                onChange={e => updateSemesterEndDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', fontFamily: FONT, cursor: 'pointer', padding: 0, marginTop: 1 }}
              />
            </div>
          </div>

          {/* sync portal */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 980,
            background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--color-text)',
            whiteSpace: 'nowrap', transition: 'background .12s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-card-bg)'}
          >
            {storeLoading
              ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite', color: 'var(--color-primary)' }} />
              : <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />}
            {!isMobile && 'Sync Portal'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortalSync} disabled={storeLoading} />
          </label>

          {/* add course */}
          <button
            onClick={openAdd}
            className="btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 980,
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            {!isMobile ? 'Add Course' : 'Add'}
          </button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={{ padding: isMobile ? '24px 16px' : '40px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {subjects.length === 0 ? (
          <div style={{ paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ 
              width: 60, height: 60, borderRadius: 18, 
              background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <GraduationCap size={26} strokeWidth={1.4} style={{ color: 'var(--color-subtext)' }} />
            </div>
            <div>
              <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>No subjects yet</p>
              <p style={{ fontSize: 14, color: 'var(--color-subtext)', margin: '6px 0 0', lineHeight: 1.5, maxWidth: 260 }}>
                Add your first course to start tracking attendance.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 980,
                fontSize: 13, fontWeight: 600, marginTop: 4,
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> Add first course
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span className="section-label" style={{ marginBottom: 0 }}>
                {subjects.length} course{subjects.length !== 1 ? 's' : ''}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)', opacity: 0.2 }} />
            </div>

            {/* discrete grid */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden" animate="show"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                gap: 16,
              }}
            >
              {subjects.map(subject => (
                <motion.div
                  key={subject._id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  style={{
                    background: 'var(--color-card-bg)',
                    borderRadius: 22,
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <CourseCard
                    subject={subject}
                    onMark={markAttendance}
                    onEdit={openEdit}
                    onUndo={undoAttendance}
                    onOpenRegister={setViewRegisterFor}
                    projection={displayDate && projections
                      ? projections.find(p => p.subjectId === subject._id)
                      : null}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* ══ ATTENDANCE REGISTER ══ */}
      <AnimatePresence mode="wait">
        {viewRegisterFor && (
          <AttendanceRegister
            subject={viewRegisterFor}
            onClose={() => setViewRegisterFor(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ MODAL SHEET ══ */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            {/* scrim */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            {/* sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SP}
              style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: 500,
                background: 'var(--color-bg)',
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden', fontFamily: FONT,
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {/* handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--color-border)' }} />
              </div>

              {/* sheet header */}
              <div style={{ padding: '12px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-subtext)', marginBottom: 2 }}>
                    {editingId ? 'Edit Course' : 'New Course'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.025em' }}>
                    {editingId ? 'Update details' : 'Add a subject'}
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', background: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-subtext)', transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>

              {/* form */}
              <form onSubmit={handleSubmit} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* name */}
                <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <SheetRow label="Subject name">
                    <input
                      type="text" required autoFocus
                      value={subForm.name} onChange={setField('name')}
                      placeholder="e.g. Physics 101"
                      style={rowInputBase}
                    />
                  </SheetRow>
                </div>

                {/* attended + total */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <HalfBox label="Attended">
                    <input type="number" min="0" value={subForm.initialAttended} onChange={setField('initialAttended')} style={inputBase} />
                  </HalfBox>
                  <HalfBox label="Total classes">
                    <input type="number" min="0" value={subForm.initialTotal} onChange={setField('initialTotal')} style={inputBase} />
                  </HalfBox>
                </div>

                {/* req + start date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <HalfBox label="Required %">
                    <input type="number" min="0" max="100" required value={subForm.requiredAttendance} onChange={setField('requiredAttendance')} style={inputBase} />
                  </HalfBox>
                  <HalfBox label="Start date">
                    <input type="date" value={subForm.initialDate} onChange={setField('initialDate')} style={{ ...inputBase, fontSize: 13 }} />
                  </HalfBox>
                </div>

                {/* colour */}
                <div style={{ background: 'var(--color-card-bg)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {PALETTE.map(c => {
                      const sel = subForm.color === c;
                      return (
                        <button
                          key={c} type="button"
                          onClick={() => setSubForm(f => ({ ...f, color: c }))}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: c, border: 'none', cursor: 'pointer',
                            outline: sel ? `2.5px solid ${c}` : '2.5px solid transparent',
                            outlineOffset: sel ? 2 : 0,
                            opacity: sel ? 1 : 0.4,
                            transform: sel ? 'scale(1.2)' : 'scale(1)',
                            boxShadow: sel ? '0 0 0 1.5px var(--color-bg)' : 'none',
                            transition: 'all .15s',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: subForm.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-subtext)', fontFamily: MONO }}>{subForm.color}</span>
                    {subForm.name && (
                      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{subForm.name}</span>
                    )}
                  </div>
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: 8, padding: '4px 0 28px' }}>
                  <button
                    type="button" onClick={() => setIsModalOpen(false)}
                    style={{
                      flex: 1, padding: '13px 0', borderRadius: 14,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-card-bg)', color: 'var(--color-text)',
                      cursor: 'pointer', fontFamily: FONT, fontSize: 15, fontWeight: 600,
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-card-bg)'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="btn-primary"
                    style={{
                      flex: 2, padding: '13px 0', borderRadius: 14,
                      fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: submitting ? 0.65 : 1,
                    }}
                  >
                    {submitting
                      ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                      : <Check size={15} strokeWidth={2.5} />}
                    {submitting ? 'Saving…' : editingId ? 'Update Subject' : 'Add Subject'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}