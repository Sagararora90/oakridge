import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, BookOpen, Clock, AlertCircle, GraduationCap, X, ChevronRight, Menu } from 'lucide-react';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const Exams = () => {
  const { subjects, exams, fetchExams, addExam, deleteExam, setSidebarOpen } = useStore();
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
    toast.success('Deadline added!');
  };

  const upcomingExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="flex-1 bg-[var(--color-bg)] min-h-screen pb-24 animate-in">
      <div className="max-w-[800px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-8">
        
        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
             >
               <Menu size={16} color="#fff" />
             </button>
             <div>
               <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] tracking-tight">Assessments</h1>
               <p className="text-xs lg:text-sm text-[var(--color-subtext)] font-medium mt-1">Track your exams, midterms, and project deadlines.</p>
             </div>
          </div>
          <button 
            onClick={() => setShowAdd(true)} 
            className="flex items-center gap-2.5 bg-primary text-white border-none rounded-xl px-5 py-3 text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all w-fit"
          >
            <Plus size={16} /> Add Deadline
          </button>
        </header>

        {/* ── ALERTS ── */}
        {upcomingExams.some(e => {
            const days = Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24));
            return days >= 0 && days < 3;
        }) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
             <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
               <AlertCircle size={20} className="text-red-600" />
             </div>
             <p className="text-xs lg:text-sm font-bold text-red-800">High Priority: Several assessments are due within the next 48-72 hours.</p>
          </motion.div>
        )}

        {/* ── LIST ── */}
        <div className="flex flex-col gap-4">
          {upcomingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Calendar size={40} className="text-[var(--color-subtext)] mb-4" />
              <p className="text-sm font-bold text-[var(--color-text)]">All Clear</p>
              <p className="text-[11px] font-medium text-[var(--color-subtext)] mt-1 max-w-[200px]">No upcoming deadlines recorded for this semester.</p>
            </div>
          ) : (
            upcomingExams.map(exam => {
              const sub = subjects.find(s => s._id === exam.subject);
              const daysLeft = Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft >= 0 && daysLeft < 3;
              const isPassed = daysLeft < 0;

              return (
                <motion.div 
                  key={exam._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="bg-card-bg border border-[var(--color-border)] rounded-2xl flex relative overflow-hidden group shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="w-1.5 shrink-0" style={{ background: sub?.color || 'var(--color-border)' }} />
                  <div className="flex-1 p-5 md:p-6 flex items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-subtext)] bg-[var(--color-bg)] px-2 py-0.5 rounded-md border border-[var(--color-border)]/50">{exam.type}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          isPassed ? 'bg-neutral-100 text-neutral-500' : 
                          isUrgent ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {isPassed ? 'Passed' : daysLeft === 0 ? 'Due Today' : `${daysLeft} days left`}
                        </span>
                      </div>
                      <h3 className="text-base lg:text-lg font-extrabold text-[var(--color-text)] leading-tight mb-2 truncate">{exam.name}</h3>
                      <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--color-subtext)]">
                         <div className="flex items-center gap-1.5"><BookOpen size={12} className="shrink-0" /> {sub?.name || 'Unmapped'}</div>
                         <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                         <div className="flex items-center gap-1.5"><Clock size={12} className="shrink-0" /> {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    </div>
                    <button onClick={() => { deleteExam(exam._id); toast.success('Deadline removed'); }} className="p-2.5 rounded-xl text-[#c8c5bf] hover:text-red-600 hover:bg-red-50 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-card-bg rounded-[32px] w-full max-w-[440px] shadow-2xl overflow-hidden relative z-10 border border-[var(--color-border)]"
            >
               <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--color-text)] tracking-tight">New Deadline</h2>
                    <p className="text-xs text-[var(--color-subtext)] font-bold mt-1">Track an upcoming academic requirement.</p>
                  </div>
                  <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-card-bg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-subtext)] hover:text-[var(--color-text)] transition-all"><X size={18} /></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Assessment Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Midterm 1" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--color-text)] outline-none focus:border-primary/50 transition-all" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Type</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--color-text)] outline-none appearance-none cursor-pointer">
                           {['Midterm', 'Final', 'Quiz', 'Assignment'].map(t => <option key={t}>{t}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Date</label>
                        <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--color-text)] outline-none" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Subject</label>
                    <select required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--color-text)] outline-none appearance-none cursor-pointer">
                       <option value="">Select subject...</option>
                       {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl text-sm font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all mt-4">Save Assessment</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Exams;
