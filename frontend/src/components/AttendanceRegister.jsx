import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Save, Edit3, CheckCircle2, AlertCircle, Plus, ChevronLeft } from 'lucide-react';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  Present: { bg: 'bg-[#E1F5EE]', text: 'text-[#0F6E56]', label: 'P' },
  Absent:  { bg: 'bg-[#FDECEC]', text: 'text-[#A32D2D]', label: 'A' },
  Medical: { bg: 'bg-[#EBF3FE]', text: 'text-[#2166CC]', label: 'ML' },
  OD:      { bg: 'bg-[#F4EBFE]', text: 'text-[#6B21CC]', label: 'OD' },
  Cancelled: { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'C' }
};

const STATUS_CHOICES = ['Present', 'Absent', 'Medical', 'OD', 'Cancelled'];

const AttendanceRegister = ({ subject, onClose }) => {
  const { setBaselineSnapshot, editDailyLog } = useStore();
  const [snapshotMode, setSnapshotMode] = useState(!subject.initialDate);
  const [snapDate, setSnapDate] = useState(subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [snapTotal, setSnapTotal] = useState(subject.initialTotal || 0);
  const [snapAttended, setSnapAttended] = useState(subject.initialAttended || 0);
  const [editingLogDate, setEditingLogDate] = useState(null);
  
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLogStatus, setNewLogStatus] = useState('Present');

  const handleSaveSnapshot = async (e) => {
    e.preventDefault();
    try {
        await setBaselineSnapshot(subject._id, {
        initialDate: snapDate,
        initialTotal: Number(snapTotal),
        initialAttended: Number(snapAttended)
        });
        setSnapshotMode(false);
        toast.success('Baseline saved');
    } catch {
        toast.error('Failed to save baseline');
    }
  };

  const handleSaveLog = async (date, status) => {
    try {
      await editDailyLog(subject._id, { date, status });
      setEditingLogDate(null);
      setIsAddingLog(false);
      toast.success('Log updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save log');
    }
  };

  const sortedLogs = useMemo(() => {
    if (!subject.attendanceRecords) return [];
    const baseDateStr = subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : null;
    return [...subject.attendanceRecords]
      .filter(log => log.date && (!baseDateStr || new Date(log.date).toISOString().split('T')[0] >= baseDateStr))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [subject.attendanceRecords, subject.initialDate]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-[32px] w-full max-w-[480px] max-h-[85vh] shadow-[0_32px_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col relative z-10 border border-[#e3e0da]"
      >
        <div className="p-6 border-b border-[#e3e0da] bg-[#faf9f7] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-[#0f0e0d] tracking-tight">{subject.name}</h2>
            <p className="text-xs text-[#8c8a87] font-bold mt-1">
              {subject.attended} / {subject.total} sessions <span className="text-primary ml-1.5">({subject.total > 0 ? ((subject.attended / subject.total) * 100).toFixed(1) : 0}%)</span>
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white border border-[#e3e0da] flex items-center justify-center text-[#8c8a87] hover:text-[#0f0e0d] transition-all"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {snapshotMode ? (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSaveSnapshot} className="bg-[#faf9f7] p-5 rounded-3xl border border-[#e3e0da] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-[#8c8a87]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#0f0e0d]">Set Baseline Snapshot</span>
              </div>
              <p className="text-[11px] text-[#8c8a87] font-medium leading-relaxed">Enter the current attendance shown in your university portal. This freezes prior logs to ensure data integrity.</p>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#8c8a87] uppercase ml-1">Snapshot Date</label>
                  <input type="date" value={snapDate} onChange={e => setSnapDate(e.target.value)} required className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-4 text-sm font-bold text-[#0f0e0d] focus:border-primary/50 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#8c8a87] uppercase ml-1">Attended</label>
                    <input type="number" min="0" value={snapAttended} onChange={e => setSnapAttended(e.target.value)} required className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-4 text-sm font-bold text-[#0f0e0d] focus:border-primary/50 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#8c8a87] uppercase ml-1">Total</label>
                    <input type="number" min="0" value={snapTotal} onChange={e => setSnapTotal(e.target.value)} required className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-4 text-sm font-bold text-[#0f0e0d] focus:border-primary/50 outline-none" />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                 {subject.initialDate && <button type="button" onClick={() => setSnapshotMode(false)} className="flex-1 py-3 text-xs font-bold text-[#8c8a87] border border-[#e3e0da] rounded-xl hover:bg-white transition-all">Cancel</button>}
                 <button type="submit" className="flex-1 py-3 px-4 bg-primary text-white text-[12px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2">
                    <Save size={14} /> Save Baseline
                 </button>
              </div>
            </motion.form>
          ) : (
            <div className="space-y-6">
              {/* Snapshot Header */}
              {subject.initialDate && (
                <div className="flex items-center gap-4 p-4 bg-[#faf9f7] rounded-[20px] border border-[#e3e0da] border-dashed">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#e3e0da] flex flex-col items-center justify-center gap-0.5 shadow-sm">
                    <Lock size={12} className="text-[#8c8a87]" />
                    <span className="text-[9px] font-black text-[#0f0e0d] transform -translate-y-0.5">{new Date(subject.initialDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#0f0e0d]">Baseline Snapshot</p>
                    <p className="text-[10px] font-bold text-[#8c8a87] uppercase tracking-wide">Sync point: {subject.initialAttended}/{subject.initialTotal}</p>
                  </div>
                  <button onClick={() => setSnapshotMode(true)} className="p-2 rounded-lg text-[#8c8a87] hover:bg-white hover:text-primary transition-all"><Edit3 size={15} /></button>
                </div>
              )}

              {/* Explainer */}
              <div className="bg-primary/5 p-4 rounded-2xl border-l-[4px] border-primary flex items-start gap-3">
                 <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                 <p className="text-[11px] font-bold text-primary/80 leading-relaxed">
                   Logs before <b>{subject.initialDate ? new Date(subject.initialDate).toLocaleDateString() : 'the baseline'}</b> are managed by the university portal sync.
                 </p>
              </div>

              {/* Add Log Section */}
              <div className="space-y-3">
                {!isAddingLog ? (
                  <button onClick={() => setIsAddingLog(true)} className="w-full py-3.5 border border-dashed border-[#e3e0da] rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#8c8a87] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 bg-[#faf9f7]/50">
                    <Plus size={16} /> Add Daily Entry
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white border border-primary/30 shadow-xl shadow-primary/5 rounded-2xl flex items-center gap-3">
                    <input type="date" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} className="bg-[#faf9f7] border border-[#e3e0da] rounded-lg px-2 py-1.5 text-xs font-bold text-[#0f0e0d] outline-none" min={subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : undefined} />
                    <select value={newLogStatus} onChange={e => setNewLogStatus(e.target.value)} className="flex-1 bg-[#faf9f7] border border-[#e3e0da] rounded-lg px-2 py-1.5 text-xs font-bold text-[#0f0e0d] outline-none">
                      {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-2">
                       <button onClick={() => handleSaveLog(newLogDate, newLogStatus)} className="p-1.5 text-green-600 hover:scale-110 transition-transform"><CheckCircle2 size={20} /></button>
                       <button onClick={() => setIsAddingLog(false)} className="p-1.5 text-[#8c8a87] hover:scale-110 transition-transform"><X size={20} /></button>
                    </div>
                  </motion.div>
                )}

                <div className="divide-y divide-[#e3e0da]/50 border-t border-[#e3e0da]/50">
                  {sortedLogs.map((log) => {
                    const dateStr = new Date(log.date).toISOString().split('T')[0];
                    const isEditing = editingLogDate === dateStr;
                    const colorConfig = STATUS_COLORS[log.status] || STATUS_COLORS.Present;

                    return (
                      <div key={dateStr} className="py-4 flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorConfig.text.replace('text-[', '').replace(']', '') }} />
                           <span className="text-xs font-bold text-[#0f0e0d] w-16">{new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 animate-in slide-in-from-right-2">
                             <select value={log.status} onChange={(e) => handleSaveLog(dateStr, e.target.value)} className="flex-1 bg-[#faf9f7] border border-[#e3e0da] rounded-lg px-3 py-1.5 text-xs font-bold text-[#0f0e0d] outline-none" autoFocus>
                                {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                             <button onClick={() => setEditingLogDate(null)} className="p-1.5 text-[#8c8a87]"><X size={16} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colorConfig.bg} ${colorConfig.text}`}>{log.status}</span>
                             <button onClick={() => setEditingLogDate(dateStr)} className="p-1 px-3 text-[#8c8a87] hover:text-[#0f0e0d] transition-colors"><Edit3 size={14} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sortedLogs.length === 0 && !isAddingLog && (
                    <div className="py-12 text-center">
                       <p className="text-xs font-bold text-[#8c8a87]">No recent logs found.</p>
                       <p className="text-[10px] text-[#8c8a87]/60 mt-1 uppercase tracking-widest">Logs before the baseline are hidden</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceRegister;
