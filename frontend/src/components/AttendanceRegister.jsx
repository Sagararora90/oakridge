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
  const [newLogCredit, setNewLogCredit] = useState(1);

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

  const handleSaveLog = async (date, status, credit) => {
    try {
      await editDailyLog(subject._id, { date, status, credit: Number(credit || 1) });
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
        className="bg-card-bg rounded-[32px] w-full max-w-[480px] max-h-[85vh] shadow-[0_32px_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col relative z-10 border border-[var(--color-border)] mx-auto"
      >
        <div className="p-5 md:p-6 border-b border-[var(--color-border)]/50 bg-[var(--color-bg)] flex items-center justify-between shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="text-base md:text-xl font-extrabold text-[var(--color-text)] tracking-tight leading-tight">{subject.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
               <span className="text-[10px] md:text-xs text-[var(--color-subtext)] font-bold uppercase tracking-wider">{subject.attended}/{subject.total} Sessions</span>
               <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
               <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-wider">{subject.total > 0 ? ((subject.attended / subject.total) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 rounded-xl hover:bg-white border border-transparent hover:border-[var(--color-border)] flex items-center justify-center text-[var(--color-subtext)] transition-all shadow-sm"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {snapshotMode ? (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSaveSnapshot} className="bg-[var(--color-bg)] p-4 lg:p-5 rounded-3xl border border-[var(--color-border)] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-[var(--color-subtext)]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text)]">Set Baseline Snapshot</span>
              </div>
              <p className="text-[10px] lg:text-[11px] text-[var(--color-subtext)] font-medium leading-relaxed">Enter the current attendance shown in your university portal.</p>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] lg:text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Snapshot Date</label>
                  <input type="date" value={snapDate} onChange={e => setSnapDate(e.target.value)} required className="w-full bg-card-bg border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm font-bold text-[var(--color-text)] focus:border-primary/50 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] lg:text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Attended</label>
                    <input type="number" min="0" value={snapAttended} onChange={e => setSnapAttended(e.target.value)} required className="w-full bg-card-bg border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm font-bold text-[var(--color-text)] focus:border-primary/50 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] lg:text-[10px] font-black text-[var(--color-subtext)] uppercase ml-1">Total</label>
                    <input type="number" min="0" value={snapTotal} onChange={e => setSnapTotal(e.target.value)} required className="w-full bg-card-bg border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm font-bold text-[var(--color-text)] focus:border-primary/50 outline-none" />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                 {subject.initialDate && <button type="button" onClick={() => setSnapshotMode(false)} className="w-full sm:flex-1 py-2.5 text-[11px] font-bold text-[var(--color-subtext)] border border-[var(--color-border)] rounded-xl hover:bg-white transition-all">Cancel</button>}
                 <button type="submit" className="w-full sm:flex-1 py-2.5 px-4 bg-primary text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2">
                    <Save size={14} /> Save Baseline
                 </button>
              </div>
            </motion.form>
          ) : (
            <div className="space-y-6">
              {/* Snapshot Header */}
              {subject.initialDate && (
                <div className="flex items-center gap-4 p-4 bg-[var(--color-bg)] rounded-[20px] border border-[var(--color-border)] border-dashed">
                  <div className="w-12 h-12 rounded-2xl bg-card-bg border border-[var(--color-border)] flex flex-col items-center justify-center gap-0.5 shadow-sm">
                    <Lock size={12} className="text-[var(--color-subtext)]" />
                    <span className="text-[9px] font-black text-[var(--color-text)] transform -translate-y-0.5">{new Date(subject.initialDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[var(--color-text)]">Baseline Snapshot</p>
                    <p className="text-[10px] font-bold text-[var(--color-subtext)] uppercase tracking-wide">Sync point: {subject.initialAttended}/{subject.initialTotal}</p>
                  </div>
                  <button onClick={() => setSnapshotMode(true)} className="p-2 rounded-lg text-[var(--color-subtext)] hover:bg-white hover:text-primary transition-all"><Edit3 size={15} /></button>
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
                  <button onClick={() => setIsAddingLog(true)} className="w-full py-3.5 border border-dashed border-[var(--color-border)] rounded-2xl text-[11px] font-black uppercase tracking-widest text-[var(--color-subtext)] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 bg-[var(--color-bg)]/50">
                    <Plus size={16} /> Add Daily Entry
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-card-bg border border-primary/30 shadow-xl shadow-primary/5 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <input type="date" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs font-bold text-[var(--color-text)] outline-none" min={subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : undefined} />
                      <select value={newLogStatus} onChange={e => setNewLogStatus(e.target.value)} className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs font-bold text-[var(--color-text)] outline-none">
                        {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="w-16 flex flex-col gap-0.5">
                        <label className="text-[8px] font-black text-[var(--color-subtext)] uppercase ml-1">Credit</label>
                        <input type="number" min="1" value={newLogCredit} onChange={e => setNewLogCredit(e.target.value)} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-xs font-bold text-[var(--color-text)] outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                       <button onClick={() => setIsAddingLog(false)} className="px-4 py-2 text-[var(--color-subtext)] rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white transition-all">Cancel</button>
                       <button onClick={() => handleSaveLog(newLogDate, newLogStatus, newLogCredit)} className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"><Plus size={14} strokeWidth={3} /> Add Entry</button>
                    </div>
                  </motion.div>
                )}

                <div className="divide-y divide-[var(--color-border)]/50 border-t border-[var(--color-border)]/50">
                  {sortedLogs.map((log) => {
                    const dateStr = new Date(log.date).toISOString().split('T')[0];
                    const isEditing = editingLogDate === dateStr;
                    const colorConfig = STATUS_COLORS[log.status] || STATUS_COLORS.Present;

                    return (
                      <div key={dateStr} className="py-5 flex items-center justify-between gap-4 group hover:pl-2 transition-all">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: colorConfig.text.replace('text-[', '').replace(']', '') }} />
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-[var(--color-text)] leading-none">{new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                             <span className="text-[9px] font-bold text-[var(--color-subtext)] uppercase tracking-tighter mt-1">{new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                           </div>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 animate-in slide-in-from-right-2">
                             <select value={log.status} onChange={(e) => handleSaveLog(dateStr, e.target.value, log.credit)} className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text)] outline-none" autoFocus>
                                {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                             <div className="w-14">
                               <input type="number" min="1" value={log.credit || 1} onChange={(e) => handleSaveLog(dateStr, log.status, e.target.value)} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-2 text-xs font-bold text-[var(--color-text)] outline-none text-center" />
                             </div>
                             <button onClick={() => setEditingLogDate(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-subtext)] hover:bg-white transition-all"><CheckCircle2 size={16} className="text-green-500" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 shrink-0">
                             {log.credit > 1 && <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{log.credit} Cr</span>}
                             <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm ${colorConfig.bg} ${colorConfig.text}`}>{log.status}</span>
                             <button onClick={() => setEditingLogDate(dateStr)} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-subtext)] hover:bg-white hover:text-primary transition-all border border-transparent hover:border-[var(--color-border)]"><Edit3 size={14} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sortedLogs.length === 0 && !isAddingLog && (
                    <div className="py-12 text-center">
                       <p className="text-xs font-bold text-[var(--color-subtext)]">No recent logs found.</p>
                       <p className="text-[10px] text-[var(--color-subtext)]/60 mt-1 uppercase tracking-widest">Logs before the baseline are hidden</p>
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
