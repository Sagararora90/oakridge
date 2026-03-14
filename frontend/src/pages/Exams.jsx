import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, BookOpen, Clock, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

const Exams = () => {
  const { subjects, exams, fetchExams, addExam, deleteExam } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'Final',
    subjectId: ''
  });

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addExam(formData);
    setShowAdd(false);
    setFormData({ name: '', date: '', type: 'Final', subjectId: '' });
  };

  const upcomingExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in" style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.title}>Assessments</h1>
          <p style={s.subtitle}>Track your exams, midterms, and assignment deadlines.</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={s.addBtn}>
          <Plus size={18} /> Add Deadline
        </button>
      </header>

      {/* ── ADD MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <div style={s.modalOverlay} onClick={() => setShowAdd(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={s.modal}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={s.modalTitle}>New Deadline</h2>
              <form onSubmit={handleSubmit} style={s.form}>
                <div style={s.inputField}>
                  <label style={s.label}>Assessment Name</label>
                  <input 
                    required style={s.input} value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Midterm 1, Final Project..."
                  />
                </div>
                <div style={s.row}>
                  <div style={{ ...s.inputField, flex: 1 }}>
                    <label style={s.label}>Type</label>
                    <select 
                      style={s.select} value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option>Midterm</option>
                      <option>Final</option>
                      <option>Quiz</option>
                      <option>Assignment</option>
                    </select>
                  </div>
                  <div style={{ ...s.inputField, flex: 1 }}>
                    <label style={s.label}>Date</label>
                    <input 
                      required type="date" style={s.input} value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
                <div style={s.inputField}>
                  <label style={s.label}>Subject</label>
                  <select 
                    required style={s.select} value={formData.subjectId}
                    onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div style={s.modalActions}>
                  <button type="button" onClick={() => setShowAdd(false)} style={s.cancelBtn}>Cancel</button>
                  <button type="submit" style={s.saveBtn}>Save Deadline</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EXAM LIST ── */}
      <div style={s.list}>
        {upcomingExams.length === 0 ? (
          <div style={s.emptyState}>
            <Calendar size={40} style={{ color: '#c8c5bf', marginBottom: 12 }} />
            <p style={{ color: '#8c8a87', fontSize: 13 }}>No upcoming deadlines. You're all clear!</p>
          </div>
        ) : (
          upcomingExams.map(exam => {
            const sub = subjects.find(s => s._id === exam.subject);
            const daysLeft = Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <motion.div 
                key={exam._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={s.card}
              >
                <div style={{ ...s.colorStripe, background: sub?.color || '#eee' }} />
                <div style={s.cardBody}>
                  <div style={{ flex: 1 }}>
                    <div style={s.cardTop}>
                      <span style={s.cardType}>{exam.type}</span>
                      <span style={{ 
                        ...s.dayTag, 
                        color: daysLeft < 3 ? '#A32D2D' : daysLeft < 7 ? '#BA7517' : '#0F6E56',
                        background: daysLeft < 3 ? '#FCEBEB' : daysLeft < 7 ? '#FFF3E0' : '#E1F5EE'
                      }}>
                        {daysLeft === 0 ? 'Today' : daysLeft < 0 ? 'Passed' : `${daysLeft} days left`}
                      </span>
                    </div>
                    <h3 style={s.cardName}>{exam.name}</h3>
                    <div style={s.cardInfo}>
                      <BookOpen size={12} /> {sub?.name || 'Unknown'}
                      <div style={s.dot} />
                      <Clock size={12} /> {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <button onClick={() => deleteExam(exam._id)} style={s.deleteBtn}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── PRIORITY ALERTS ── */}
      {upcomingExams.some(e => Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)) < 3) && (
        <div style={s.alertSection}>
          <div style={s.alertBox}>
            <AlertCircle size={18} color="#A32D2D" />
            <span style={{ fontSize: 13, color: '#A32D2D', fontWeight: 600 }}>
              High Priority: You have assessments due in less than 3 days!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { padding: '24px 16px', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 },
  title: { fontSize: 26, fontWeight: 800, color: '#0f0e0d', margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#8c8a87', marginTop: 4 },
  addBtn: { background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#fff', width: '90%', maxWidth: 450, borderRadius: 20, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#0f0e0d' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputField: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#b0ada8', letterSpacing: '0.08em' },
  input: { background: '#faf9f7', border: '0.5px solid #e3e0da', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' },
  select: { background: '#faf9f7', border: '0.5px solid #e3e0da', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', appearance: 'none' },
  row: { display: 'flex', gap: 12 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { background: 'transparent', border: 'none', color: '#8c8a87', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  saveBtn: { background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', border: '0.5px solid #e3e0da', borderRadius: 12, overflow: 'hidden', display: 'flex' },
  colorStripe: { width: 6, flexShrink: 0 },
  cardBody: { flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardType: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#b0ada8', letterSpacing: '0.06em' },
  dayTag: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 },
  cardName: { fontSize: 16, fontWeight: 700, color: '#4a4845', margin: '0 0 6px' },
  cardInfo: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#b0ada8' },
  dot: { width: 3, height: 3, borderRadius: '50%', background: '#e3e0da' },
  deleteBtn: { color: '#c8c5bf', transition: 'color 0.2s', '&:hover': { color: '#A32D2D' }, background: 'transparent', border: 'none', cursor: 'pointer' },

  emptyState: { padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  alertSection: { marginTop: 8 },
  alertBox: { background: '#FCEBEB', border: '0.5px solid #F2AEAE', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }
};

export default Exams;
