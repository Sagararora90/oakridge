import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar as CalendarIcon,
  Sparkles, Loader2, GraduationCap, ChevronRight, Check,
} from 'lucide-react';
import useStore from '../store/useStore';
import SubjectCard from '../components/SubjectCard';
import AttendanceRegister from '../components/AttendanceRegister';
import toast from 'react-hot-toast';

const FONT = "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif";
const MONO = "'SF Mono','Fira Code','Fira Mono',monospace";
const SP   = { type: 'spring', stiffness: 340, damping: 28 };

const PALETTE = [
  '#2997FF','#30D158','#FF9F0A','#BF5AF2',
  '#FF453A','#64D2FF','#FFD60A','#FF6B35',
];

const lbl = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
  textTransform: 'uppercase', color: 'var(--color-subtext)',
  margin: 0, fontFamily: FONT,
};

const fieldSt = {
  width: '100%', padding: '10px 12px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 9, fontSize: 13, fontWeight: 500,
  color: 'var(--color-text)', fontFamily: FONT,
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
};

function defaultForm() {
  return {
    name: '', requiredAttendance: 75, color: '#2997FF',
    initialAttended: 0, initialTotal: 0, initialDate: '',
  };
}

function useIsMobile(bp = 1024) {
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

/* ════════════════════════════════════════════════════════════ */
export default function Subjects() {
  const {
    subjects, projections, semesterEndDate,
    fetchProjections, addSubject, updateSubject,
    markAttendance, undoAttendance,
    syncPortalAttendance, updateSemesterEndDate,
    loading: storeLoading,
  } = useStore();

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

  return (
    <div style={{
      background: 'var(--color-bg)',
      minHeight: '100svh',
      paddingBottom: isMobile ? 96 : 48,
      fontFamily: FONT,
    }}>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--color-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
      }}>
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-subtext)' }}>Attend</span>
          <ChevronRight size={12} style={{ color: 'var(--color-subtext)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            Subjects
          </span>
        </div>

        {/* right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* semester end date pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 9,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}>
            <CalendarIcon size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!isMobile && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--color-subtext)', lineHeight: 1,
                }}>
                  Semester End
                </span>
              )}
              <input
                type="date"
                value={displayDate}
                onChange={e => updateSemesterEndDate(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                  fontFamily: FONT, cursor: 'pointer', padding: 0, marginTop: 2,
                }}
              />
            </div>
          </div>

          {/* portal sync */}
          <label
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 9,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: 'var(--color-text)', whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
            {storeLoading
              ? <Loader2 size={13} style={{ animation: 'subsspin .7s linear infinite', color: 'var(--color-primary)' }} />
              : <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />}
            {!isMobile && 'Sync Portal'}
            <input
              type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePortalSync}
              disabled={storeLoading}
            />
          </label>

          {/* add course */}
          <button
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9,
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', cursor: 'pointer', fontFamily: FONT,
              fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
            <Plus size={14} strokeWidth={2.5} />
            {!isMobile ? 'Add Course' : 'Add'}
          </button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={{
        padding: isMobile ? '20px 14px' : '32px 24px',
        maxWidth: 1100, margin: '0 auto',
      }}>

        {subjects.length === 0 ? (
          /* ── empty state ── */
          <div style={{
            paddingTop: 80,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-subtext)',
            }}>
              <GraduationCap size={24} strokeWidth={1.4} />
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
                No subjects yet
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-subtext)', margin: '6px 0 0', fontWeight: 500, maxWidth: 300 }}>
                Add your courses to start tracking attendance and setting targets.
              </p>
            </div>
            <button
              onClick={openAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer', fontFamily: FONT,
                fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                transition: 'background 0.15s', marginTop: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
              <Plus size={15} strokeWidth={2.5} style={{ color: 'var(--color-primary)' }} />
              Add first course
            </button>
          </div>

        ) : (
          /* ── grid ── */
          <div>
            {/* section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <p style={lbl}>{subjects.length} course{subjects.length !== 1 ? 's' : ''}</p>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden" animate="show"
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: isMobile ? 10 : 14,
              }}>
              {subjects.map(subject => (
                <motion.div
                  key={subject._id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                  }}>
                  <SubjectCard
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

      {/* ══ ADD / EDIT MODAL ══ */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 20,
          }}>
            {/* scrim */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              }}
            />

            {/* sheet */}
            <motion.div
              initial={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.97 }}
              transition={SP}
              style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: isMobile ? '100%' : 480,
                background: 'var(--color-card-bg)',
                borderRadius: isMobile ? '20px 20px 0 0' : 16,
                border: '1px solid var(--color-border)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
                overflow: 'hidden', fontFamily: FONT,
              }}>

              {/* mobile drag pill */}
              {isMobile && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 4, background: 'var(--color-border)' }} />
                </div>
              )}

              {/* modal header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={lbl}>{editingId ? 'Edit Course' : 'New Course'}</p>
                  <p style={{
                    fontSize: 17, fontWeight: 800, color: 'var(--color-text)',
                    margin: '4px 0 0', letterSpacing: '-0.03em', lineHeight: 1,
                  }}>
                    {editingId ? 'Update details' : 'Add a subject'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-subtext)', flexShrink: 0,
                  }}>
                  <X size={14} />
                </button>
              </div>

              {/* form */}
              <form
                onSubmit={handleSubmit}
                style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* name */}
                <div>
                  <p style={{ ...lbl, marginBottom: 7 }}>Subject Name</p>
                  <input
                    type="text" required
                    value={subForm.name} onChange={setField('name')}
                    placeholder="e.g. Physics 101"
                    style={fieldSt}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                {/* attended + total */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ ...lbl, marginBottom: 7 }}>Attended</p>
                    <input type="number" min="0" value={subForm.initialAttended}
                      onChange={setField('initialAttended')} style={fieldSt}
                      onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  </div>
                  <div>
                    <p style={{ ...lbl, marginBottom: 7 }}>Total Classes</p>
                    <input type="number" min="0" value={subForm.initialTotal}
                      onChange={setField('initialTotal')} style={fieldSt}
                      onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  </div>
                </div>

                {/* requirement + start date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ ...lbl, marginBottom: 7 }}>Requirement %</p>
                    <input type="number" min="0" max="100" required
                      value={subForm.requiredAttendance} onChange={setField('requiredAttendance')}
                      style={fieldSt}
                      onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  </div>
                  <div>
                    <p style={{ ...lbl, marginBottom: 7 }}>Start Date</p>
                    <input type="date" value={subForm.initialDate}
                      onChange={setField('initialDate')} style={fieldSt}
                      onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  </div>
                </div>

                {/* colour picker */}
                <div>
                  <p style={{ ...lbl, marginBottom: 10 }}>Colour Marker</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
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
                            opacity: sel ? 1 : 0.45,
                            transform: sel ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s',
                            boxShadow: sel ? '0 0 0 1px var(--color-card-bg)' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* colour preview row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 9,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: subForm.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-subtext)', fontFamily: MONO }}>
                    {subForm.color}
                  </span>
                  {subForm.name && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                      {subForm.name}
                    </span>
                  )}
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)', cursor: 'pointer',
                      fontFamily: FONT, fontSize: 13, fontWeight: 600,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2, padding: '11px 0', borderRadius: 10,
                      border: 'none', background: 'var(--color-primary)',
                      color: '#fff', cursor: 'pointer', fontFamily: FONT,
                      fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                      opacity: submitting ? 0.65 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'opacity 0.2s',
                    }}>
                    {submitting
                      ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'subsspin .7s linear infinite' }} />
                      : <Check size={14} strokeWidth={2.5} />}
                    {submitting ? 'Saving…' : editingId ? 'Update Course' : 'Add Course'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes subsspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}