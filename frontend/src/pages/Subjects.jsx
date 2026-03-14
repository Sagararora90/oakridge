import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar as CalendarIcon,
  Sparkles, Loader2, CheckCircle2, AlertCircle, GraduationCap
} from 'lucide-react';
import useStore from '../store/useStore';
import SubjectCard from '../components/SubjectCard';
import AttendanceRegister from '../components/AttendanceRegister';
import toast from 'react-hot-toast';

const COLORS = ['#185FA5', '#0F6E56', '#BA7517', '#A32D2D', '#3C3489', '#A32D2D', '#007aff'];

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
  const [submitting,  setSubmitting]  = useState(false);
  const [viewRegisterFor, setViewRegisterFor] = useState(null);

  useEffect(() => {
    if (!storeLoading && subjects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get('view');
      if (viewId) {
        const target = subjects.find(s => s._id === viewId);
        if (target) {
          setViewRegisterFor(target);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [storeLoading, subjects]);

  const displayDate = semesterEndDate ? new Date(semesterEndDate).toISOString().split('T')[0] : '';

  useEffect(() => {
    if (displayDate) fetchProjections(displayDate);
  }, [displayDate, fetchProjections]);

  function defaultForm() {
    return { name: '', requiredAttendance: 75, color: '#185FA5', initialAttended: 0, initialTotal: 0, initialDate: '' };
  }

  const handlePortalSync = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('portal', file);
    const toastId = toast.loading('Syncing portal attendance...');
    try {
      await syncPortalAttendance(formData);
      toast.success('Portal synced successfully!', { id: toastId });
    } catch {
      toast.error('Portal sync failed.', { id: toastId });
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setSubForm(defaultForm());
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingId(sub._id);
    setSubForm({
      name: sub.name,
      requiredAttendance: sub.requiredAttendance,
      color: sub.color,
      initialAttended: sub.initialAttended || 0,
      initialTotal: sub.initialTotal || 0,
      initialDate: sub.initialDate ? new Date(sub.initialDate).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) await updateSubject(editingId, subForm);
      else await addSubject(subForm);
      setIsModalOpen(false);
      toast.success(editingId ? 'Subject updated' : 'Subject added');
    } catch {
      toast.error('Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) =>
    setSubForm(f => ({ ...f, [field]: e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }));

  return (
    <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-8">
        
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap size={16} color="#fff" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0f0e0d] tracking-tight">Courses</h1>
              <p className="text-xs lg:text-sm text-[#8c8a87] font-medium mt-1">
                {subjects.length > 0 ? `Tracking ${subjects.length} subject${subjects.length > 1 ? 's' : ''}` : 'No subjects tracked yet.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="bg-white border border-[#e3e0da] rounded-xl p-2.5 flex flex-col gap-1 min-w-[160px] shadow-sm">
                <span className="text-[9px] font-extrabold text-[#8c8a87] uppercase tracking-wider px-1">Semester End</span>
                <div className="flex items-center gap-2 px-1">
                  <CalendarIcon size={13} className="text-primary shrink-0" />
                  <input type="date" value={displayDate} onChange={(e) => updateSemesterEndDate(e.target.value)} className="bg-transparent border-none text-xs font-bold text-[#0f0e0d] outline-none cursor-pointer w-full" />
                </div>
             </div>

             <label className="flex items-center gap-2.5 bg-white border border-[#e3e0da] rounded-xl px-4 py-3 text-xs font-bold text-[#0f0e0d] shadow-sm hover:bg-[#faf9f7] transition-all cursor-pointer">
                {storeLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-primary" />}
                <span>Sync Portal</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePortalSync} disabled={storeLoading} />
             </label>

             <button onClick={openAddModal} className="flex items-center gap-2.5 bg-primary text-white border-none rounded-xl px-5 py-3 text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all">
                <Plus size={16} strokeWidth={2.5} />
                Add Course
             </button>
          </div>
        </div>

        {/* ── GRID ── */}
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-6">📚</div>
            <p className="text-base font-bold text-[#0f0e0d]">No courses yet</p>
            <p className="text-xs text-[#8c8a87] font-medium mt-2 max-w-[200px]">Tap "Add Course" above to start tracking your attendance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject._id}
                subject={subject}
                onMark={markAttendance}
                onEdit={openEditModal}
                onUndo={undoAttendance}
                onOpenRegister={setViewRegisterFor}
                projection={displayDate && projections ? projections.find(p => p.subjectId === subject._id) : null}
              />
            ))}
          </div>
        )}

        {/* ── REGISTER MODAL ── */}
        <AnimatePresence>
          {viewRegisterFor && (
            <AttendanceRegister subject={viewRegisterFor} onClose={() => setViewRegisterFor(null)} />
          )}
        </AnimatePresence>

        {/* ── ADD/EDIT MODAL ── */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
               <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-[480px] shadow-2xl overflow-hidden relative z-10">
                  <div className="p-6 border-b border-[#e3e0da] flex items-center justify-between bg-[#faf9f7]">
                    <div><h2 className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">{editingId ? 'Edit Course' : 'Add New Course'}</h2><p className="text-xs text-[#8c8a87] font-medium mt-1">Configure your subject tracking rules.</p></div>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-[#8c8a87] transition-all"><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Subject Name</label>
                        <input type="text" required value={subForm.name} onChange={set('name')} placeholder="e.g. Modern Physics" className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-3 px-4 text-sm font-bold text-[#0f0e0d] outline-none focus:border-primary/50 transition-all" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Attended</label>
                           <input type="number" min="0" value={subForm.initialAttended} onChange={set('initialAttended')} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-3 px-4 text-sm font-bold text-[#0f0e0d] outline-none focus:border-primary/50" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Total Classes</label>
                           <input type="number" min="0" value={subForm.initialTotal} onChange={set('initialTotal')} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-3 px-4 text-sm font-bold text-[#0f0e0d] outline-none focus:border-primary/50" />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Target (%)</label>
                           <input type="number" min="0" max="100" required value={subForm.requiredAttendance} onChange={set('requiredAttendance')} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-3 px-4 text-sm font-bold text-[#0f0e0d] outline-none focus:border-primary/50" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Baseline Date</label>
                           <input type="date" value={subForm.initialDate} onChange={set('initialDate')} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-3 px-4 text-sm font-bold text-[#0f0e0d] outline-none focus:border-primary/50" />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Brand Color</label>
                        <div className="flex flex-wrap gap-2.5 px-1">
                           {COLORS.map(c => (
                              <button key={c} type="button" onClick={() => setSubForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full transition-all ${subForm.color === c ? 'scale-125 ring-2 ring-[#0f0e0d] ring-offset-2' : 'hover:scale-110'}`} style={{ background: c }} />
                           ))}
                        </div>
                     </div>

                     <div className="pt-2">
                        <button type="submit" disabled={submitting} className={`w-full py-4 rounded-2xl text-sm font-extrabold text-white shadow-lg transition-all ${submitting ? 'opacity-70' : 'hover:scale-[1.01] active:scale-98'}`} style={{ backgroundColor: subForm.color }}>
                           {submitting ? 'Saving changes...' : editingId ? 'Update Subject' : 'Add Subject'}
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Subjects;