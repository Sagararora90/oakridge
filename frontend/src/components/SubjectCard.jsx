import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Edit3, RotateCcw, Zap, CalendarDays, ChevronDown, Check, X
} from 'lucide-react';
import useStore from '../store/useStore';

const SubjectCard = ({ subject, onMark, onEdit, onUndo, onOpenRegister, projection }) => {
  const getRecoveryDate = useStore(state => state.getRecoveryDate);
  const calculateBunkability = useStore(state => state.calculateBunkability);
  
  const recoveryDate    = getRecoveryDate(subject._id);
  const bunkability     = calculateBunkability(subject);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const required   = subject.requiredAttendance || 75;
  const percentage = subject.total > 0
    ? (subject.attended / subject.total) * 100
    : 0;
  const pct = percentage.toFixed(1);

  // Bunk allowance & Recovery calc
  const bunkAllowance = Math.floor(
    (subject.attended - (required / 100) * subject.total) / (required / 100)
  );

  const nextClassesToSafe = Math.max(
    0,
    Math.ceil(
      ((required / 100) * subject.total - subject.attended) /
      (1 - required / 100)
    )
  );

  const isSafe    = percentage >= required;
  const isWarning = !isSafe && percentage >= required - 5;

  const statusMsg = isSafe
    ? bunkAllowance > 0
      ? `Safe to skip ${bunkAllowance} more class${bunkAllowance > 1 ? 'es' : ''}`
      : 'At the limit — attend every class'
    : recoveryDate === 'Impossible'
      ? 'Goal unreachable this semester'
      : recoveryDate === 'Set semester end to see date' || recoveryDate === 'Add schedule to see date'
        ? recoveryDate
        : `Attend ${nextClassesToSafe} more to recover (by ${recoveryDate})`;

  const isUpdating = useStore(state => state.updatingAttendance[subject._id]);
  const brandColor = subject.color || '#185FA5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`apple-card p-7 lg:p-8 flex flex-col gap-6 group relative overflow-hidden ${isUpdating ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors duration-1000" />
      {/* ── TOP SECTION �      <div className="flex justify-between items-start gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.1)]" style={{ background: brandColor }} />
             <h3 className="text-lg lg:text-xl font-black text-[var(--color-text)] truncate tracking-tighter leading-none">{subject.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-[var(--color-subtext)] uppercase tracking-[0.15em] opacity-60">Module Core</span>
            <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Target {required}%</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 text-right">
          <div className="flex flex-col">
            <span className="text-[32px] lg:text-[40px] font-black tracking-tighter leading-none gradient-text" 
                  style={{ backgroundImage: `linear-gradient(135deg, ${isSafe ? 'var(--secondary)' : isWarning ? 'var(--warning)' : 'var(--danger)'} 0%, var(--text) 200%)` }}>
              {pct}%
            </span>
          </div>
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border border-[var(--color-border)] nebula-glass"
            style={{ color: bunkability.color }}
          >
            <Zap size={10} fill={bunkability.color} className="animate-pulse" />
            {bunkability.label}
          </div>
        </div>
      </div>
   </div>

      {/* ── PROGRESS ── */}
      <div className="space-y-2.5 relative z-10">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-medium text-[var(--color-subtext)] uppercase tracking-wider">Classes Attended</span>
          <span className="text-xs font-semibold text-[var(--color-text)]">{subject.attended} <span className="text-[11px] font-medium text-[var(--color-subtext)]">/</span> {subject.total}</span>
        </div>
        <div className="relative h-2 bg-[var(--color-border)]/50 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }} 
             animate={{ width: `${Math.min(100, percentage)}%` }} 
             transition={{ duration: 1.2, ease: "circOut" }}
             className="h-full rounded-full" 
             style={{ backgroundColor: isSafe ? 'var(--secondary)' : isWarning ? 'var(--warning)' : 'var(--danger)' }} 
           />
           {/* Marker for Target */}
           <div className="absolute top-0 h-full w-[2px] bg-white/60 shadow-sm z-10" style={{ left: `${required}%` }} />
        </div>
      </div>

      {/* ── INSIGHT CHIP ── */}
      <div className={`p-3 rounded-xl flex items-start gap-2.5 transition-colors ${isSafe ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
         <div className={`mt-0.5 shrink-0 ${isSafe ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {isSafe ? <CheckCircle2 size={16} /> : <Zap size={16} />}
         </div>
         <p className={`text-[11px] lg:text-xs font-medium leading-relaxed ${isSafe ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{statusMsg}</p>
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex flex-col gap-3 mt-auto relative z-10">
        <div className="flex gap-2">
           <button 
             onClick={() => onMark(subject._id, 'Present')} 
             disabled={isUpdating}
             className="btn-primary flex-1 py-2.5 px-3 text-xs"
           >
              <Check size={14} strokeWidth={3} /> Present
           </button>
           <button 
             onClick={() => onMark(subject._id, 'Absent')} 
             disabled={isUpdating}
             className="btn-secondary flex-1 py-2.5 px-3 text-xs bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50 border border-[var(--color-border)]"
           >
              <X size={14} strokeWidth={3} /> Absent
           </button>
           
           <div className="relative">
              <button 
                disabled={isUpdating} 
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`w-10 h-full rounded-xl border flex items-center justify-center transition-colors ${isMoreOpen ? 'bg-primary/10 border-primary/30 text-primary' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-subtext)] hover:bg-[var(--color-bg)]'}`}
              >
                 <ChevronDown size={14} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isMoreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 bottom-full mb-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-xl shadow-lg z-50 w-44 overflow-hidden origin-bottom-right"
                    >
                       <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 flex items-center justify-between px-3">
                          <span className="text-[10px] font-semibold text-[var(--color-subtext)] uppercase tracking-wider">Quick Actions</span>
                          <button onClick={() => setIsMoreOpen(false)} className="text-[var(--color-subtext)] hover:text-[var(--color-text)] transition-colors"><X size={12} /></button>
                       </div>
                       <div className="py-1">
                          {['Medical', 'OD', 'Cancelled'].map(st => (
                            <button 
                              key={st} 
                              onClick={() => {
                                onMark(subject._id, st);
                                setIsMoreOpen(false);
                              }} 
                              className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] flex items-center justify-between group/row"
                            >
                              {st}
                              <ChevronDown size={10} className="-rotate-90 opacity-0 group-hover/row:opacity-40 transition-opacity" />
                            </button>
                          ))}
                          {onUndo && (
                            <button 
                              onClick={() => {
                                onUndo(subject._id);
                                setIsMoreOpen(false);
                              }} 
                              className="w-full text-left px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 flex items-center gap-2 border-t border-[var(--color-border)] mt-1"
                            >
                              <RotateCcw size={11} /> Undo Last Action
                            </button>
                          )}
                       </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
           </div>
        </div>

        {onOpenRegister && (
           <button onClick={() => onOpenRegister(subject)} className="w-full py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-medium text-[var(--color-subtext)] flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-colors bg-[var(--color-surface)]">
              <CalendarDays size={14} /> Full Register
           </button>
        )}
      </div>
    </motion.div>
  );
};

export default SubjectCard;