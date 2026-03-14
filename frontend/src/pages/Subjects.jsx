import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar as CalendarIcon,
  Sparkles, Loader2, CheckCircle2, AlertCircle, GraduationCap
} from 'lucide-react';
import useStore from '../store/useStore';
import SubjectCard from '../components/SubjectCard';
import AttendanceRegister from '../components/AttendanceRegister';

const COLORS = ['#007aff', '#34c759', '#ffb300', '#ff5252', '#5856d6', '#ff9f0a', '#30b0c7'];

const Subjects = () => {
  const {
    subjects,
    projections,
    semesterEndDate,
    fetchProjections,
    addSubject,
    updateSubject,
    markAttendance,
    undoAttendance,
    syncPortalAttendance,
    updateSemesterEndDate,
    loading: storeLoading
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [subForm,     setSubForm]     = useState(defaultForm());
  const [syncStatus,  setSyncStatus]  = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [viewRegisterFor, setViewRegisterFor] = useState(null);

  // Auto-open register if navigated from dashboard
  useEffect(() => {
    if (!storeLoading && subjects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get('view');
      if (viewId) {
        const target = subjects.find(s => s._id === viewId);
        if (target) {
          setViewRegisterFor(target);
          // Optional: clear param so it doesn't re-open on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
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

  function defaultForm() {
    return { name: '', requiredAttendance: 75, color: '#007aff', initialAttended: 0, initialTotal: 0, initialDate: '' };
  }

  const handlePortalSync = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('portal', file);
    try {
      const res = await syncPortalAttendance(formData);
      setSyncStatus({ type: 'success', message: res.message });
    } catch {
      setSyncStatus({ type: 'error', message: 'Portal sync failed. Please try again.' });
    }
    setTimeout(() => setSyncStatus(null), 5000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setSubForm(defaultForm());
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingId(sub._id);
    setSubForm({
      name:               sub.name,
      requiredAttendance: sub.requiredAttendance,
      color:              sub.color,
      initialAttended:    sub.initialAttended  || 0,
      initialTotal:       sub.initialTotal     || 0,
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
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) =>
    setSubForm(f => ({ ...f, [field]: e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }));

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">
      <div style={pg.page}>

        {/* ── HEADER ── */}
        <div style={pg.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="lg:hidden" style={{ width: 30, height: 30, background: 'var(--primary, #007aff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={15} color="#fff" />
            </div>
            <div>
              <h1 style={pg.title}>Courses</h1>
              <p style={pg.subtitle}>
                {subjects.length > 0
                  ? `Tracking ${subjects.length} subject${subjects.length > 1 ? 's' : ''}`
                  : 'No subjects yet — add your first course'}
              </p>
            </div>
          </div>

          <div style={pg.actions}>
            {/* Semester end date */}
            <div style={pg.datePill}>
              <span style={pg.pillLabel}>Semester end</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarIcon size={13} style={{ color: 'var(--primary, #007aff)', flexShrink: 0 }} />
                <input
                  type="date"
                  value={displayDate}
                  onChange={(e) => updateSemesterEndDate(e.target.value)}
                  style={pg.dateInput}
                />
              </div>
            </div>

            {/* Portal sync */}
            <label style={pg.syncBtn} className="hover:bg-bg transition-all cursor-pointer">
              {storeLoading
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Sparkles size={14} style={{ color: 'var(--primary, #007aff)' }} />
              }
              <span>Sync Portal</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortalSync} disabled={storeLoading} />
            </label>

            {/* Add course */}
            <button
              onClick={openAddModal}
              style={pg.addBtn}
              className="hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={15} />
              Add Course
            </button>
          </div>
        </div>

        {/* ── SYNC STATUS TOAST ── */}
        <AnimatePresence>
          {syncStatus && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: -6 }}
              style={{
                ...pg.toast,
                background:   syncStatus.type === 'success' ? '#E1F5EE' : '#FCEBEB',
                borderColor:  syncStatus.type === 'success' ? '#9FE1CB' : '#F7C1C1',
                color:        syncStatus.type === 'success' ? '#0F6E56' : '#A32D2D',
              }}
            >
              {syncStatus.type === 'success'
                ? <CheckCircle2 size={16} />
                : <AlertCircle  size={16} />
              }
              {syncStatus.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SUBJECT CARDS GRID ── */}
        {subjects.length === 0 ? (
          <div style={pg.empty}>
            <div style={pg.emptyIcon}>📚</div>
            <p style={pg.emptyTitle}>No courses yet</p>
            <p style={pg.emptySub}>Tap "Add Course" to get started.</p>
          </div>
        ) : (
          <div style={pg.grid}>
            {subjects.map((subject) => {
              const proj = displayDate && projections
                ? projections.find(p => p.subjectId === subject._id)
                : null;
              return (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  onMark={markAttendance}
                  onEdit={openEditModal}
                  onUndo={undoAttendance}
                  onOpenRegister={setViewRegisterFor}
                  projection={proj}
                />
              );
            })}
          </div>
        )}

        {/* ── ATTENDANCE REGISTER MODAL ── */}
        <AnimatePresence>
          {viewRegisterFor && (
            <AttendanceRegister 
              subject={viewRegisterFor} 
              onClose={() => setViewRegisterFor(null)} 
            />
          )}
        </AnimatePresence>

        {/* ── ADD / EDIT MODAL ── */}
        <AnimatePresence>
          {isModalOpen && (
            <div
              style={modal.backdrop}
              onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1,    opacity: 1, y: 0  }}
                exit={{   scale: 0.96, opacity: 0, y: 12  }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                style={modal.wrap}
              >
                {/* Modal header */}
                <div style={modal.header}>
                  <div>
                    <h2 style={modal.title}>{editingId ? 'Edit Course' : 'New Course'}</h2>
                    <p style={modal.subtitle}>
                      {editingId ? 'Update the subject details below.' : 'Fill in the details to add a subject.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={modal.closeBtn}
                    className="hover:bg-bg transition-all"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={modal.body}>

                  <Field label="Subject name">
                    <input
                      type="text"
                      required
                      value={subForm.name}
                      onChange={set('name')}
                      placeholder="e.g. Modern Physics"
                      style={modal.input}
                      className="focus:border-primary/50"
                    />
                  </Field>

                  <div style={modal.row}>
                    <Field label="Classes attended">
                      <input
                        type="number"
                        min="0"
                        value={subForm.initialAttended}
                        onChange={set('initialAttended')}
                        style={modal.input}
                        className="focus:border-primary/50"
                      />
                    </Field>
                    <Field label="Total classes">
                      <input
                        type="number"
                        min="0"
                        value={subForm.initialTotal}
                        onChange={set('initialTotal')}
                        style={modal.input}
                        className="focus:border-primary/50"
                      />
                    </Field>
                  </div>

                  <div style={modal.row}>
                    <Field label="Required attendance (%)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={subForm.requiredAttendance}
                        onChange={set('requiredAttendance')}
                        style={modal.input}
                        className="focus:border-primary/50"
                      />
                    </Field>
                  </div>

                  <div style={modal.row}>
                    <Field label="Snapshot date (Baseline)">
                      <input
                        type="date"
                        value={subForm.initialDate}
                        onChange={set('initialDate')}
                        style={modal.input}
                        className="focus:border-primary/50"
                      />
                    </Field>
                  </div>

                  <div style={modal.row}>
                    <Field label="Classes Attended (at start)">
                      <input
                        type="number"
                        min="0"
                        value={subForm.initialAttended}
                        onChange={set('initialAttended')}
                        style={modal.input}
                        className="focus:border-primary/50"
                      />
                    </Field>
                    <Field label="Total Classes (at start)">
                      <input
                        type="number"
                        min="0"
                        value={subForm.initialTotal}
                        onChange={set('initialTotal')}
                        style={modal.input}
                        className="focus:border-primary/50"
                      />
                    </Field>
                  </div>

                  {/* Color picker */}
                  <Field label="Subject color">
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSubForm(f => ({ ...f, color: c }))}
                          style={{
                            width:        32,
                            height:       32,
                            borderRadius: '50%',
                            background:   c,
                            border:       subForm.color === c
                              ? '2.5px solid #0f0e0d'
                              : '2.5px solid transparent',
                            transform:    subForm.color === c ? 'scale(1.15)' : 'scale(1)',
                            cursor:       'pointer',
                            transition:   'all 0.15s',
                            outline:      'none',
                          }}
                        />
                      ))}
                    </div>
                  </Field>

                  {/* Color preview stripe */}
                  <div style={{ ...modal.colorStripe, background: subForm.color }} />

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...modal.submitBtn,
                      background: subForm.color || 'var(--primary, #007aff)',
                      opacity:    submitting ? 0.7 : 1,
                    }}
                    className="active:scale-98 transition-all"
                  >
                    {submitting
                      ? 'Saving…'
                      : editingId ? 'Save Changes' : 'Add Course'
                    }
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Small helper wrapper for form fields
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
    <label style={modal.label}>{label}</label>
    {children}
  </div>
);

// ── Page styles ──
const pg = {
  page: {
    padding:       '24px 16px',
    maxWidth:      1200,
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column',
    gap:           24,
  },
  header: {
    display:        'flex',
    flexWrap:       'wrap',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    gap:            16,
    paddingTop:     8,
  },
  title:    { fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'var(--subtext)', marginTop: 4 },
  actions:  { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' },

  datePill: {
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 10,
    padding:      '8px 14px',
    display:      'flex',
    flexDirection:'column',
    gap:          4,
    minWidth:     160,
  },
  pillLabel: { fontSize: 9, color: 'var(--subtext)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  dateInput: {
    border:     'none',
    background: 'transparent',
    fontSize:   12,
    fontWeight: 600,
    color:      'var(--text)',
    outline:    'none',
    cursor:     'pointer',
  },
  syncBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          6,
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 10,
    padding:      '10px 14px',
    fontSize:     12,
    fontWeight:   600,
    color:        'var(--text)',
  },
  addBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          6,
    background:   'var(--primary, #007aff)',
    border:       'none',
    borderRadius: 10,
    padding:      '10px 18px',
    fontSize:     13,
    fontWeight:   700,
    color:        '#fff',
    cursor:       'pointer',
  },

  toast: {
    display:      'flex',
    alignItems:   'center',
    gap:          10,
    padding:      '12px 16px',
    borderRadius: 10,
    border:       '0.5px solid',
    fontSize:     13,
    fontWeight:   600,
  },

  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap:                 12,
  },

  empty: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '80px 24px',
    textAlign:      'center',
  },
  emptyIcon:  { fontSize: 40, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: 'var(--subtext)', margin: 0 },
  emptySub:   { fontSize: 13, color: '#c8c5bf', marginTop: 6 },
};

// ── Modal styles ──
const modal = {
  backdrop: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    zIndex:         100,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        16,
    overflowY:      'auto',
  },
  wrap: {
    background:   'var(--card-bg)',
    borderRadius: 16,
    border:       '0.5px solid var(--border)',
    boxShadow:    '0 24px 60px rgba(0,0,0,0.12)',
    width:        '100%',
    maxWidth:     480,
    overflow:     'hidden',
  },
  header: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between', gap: 12,
    padding:        '20px 20px 16px',
    borderBottom:   '0.5px solid var(--border)',
  },
  title:    { fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: 12, color: 'var(--subtext)', marginTop: 3 },
  closeBtn: {
    width:          30,
    height:         30,
    borderRadius:   8,
    border:         '0.5px solid var(--border)',
    background:     'transparent',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    color:          'var(--subtext)',
    flexShrink:     0,
  },
  body: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  row: {
    display: 'flex',
    gap:     12,
    flexWrap:'wrap',
  },
  label: {
    fontSize:      10,
    color:         'var(--subtext)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  input: {
    width:        '100%',
    background:   'var(--bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 8,
    padding:      '9px 12px',
    fontSize:     13,
    fontWeight:   600,
    color:        'var(--text)',
    outline:      'none',
    boxSizing:    'border-box',
    transition:   'border-color 0.15s',
  },
  colorStripe: {
    height:       4,
    borderRadius: 99,
    transition:   'background 0.2s',
  },
  submitBtn: {
    width:        '100%',
    padding:      '13px',
    borderRadius: 10,
    border:       'none',
    color:        '#fff',
    fontSize:     14,
    fontWeight:   700,
    cursor:       'pointer',
    transition:   'opacity 0.15s',
  },
};

export default Subjects;