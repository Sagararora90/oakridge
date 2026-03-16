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
      whileHover={{ y: -4 }}
      className={`bg-card-bg border border-[var(--color-border)] rounded-[24px] p-5 lg:p-6 shadow-sm hover:shadow-xl transition-all flex flex-col gap-5 group relative overflow-hidden ${isUpdating ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      {/* ── TOP SECTION ── */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: brandColor }} />
             <h3 className="text-base lg:text-lg font-extrabold text-[var(--color-text)] truncate leading-tight">{subject.name}</h3>
             {onEdit && (
               <button onClick={() => onEdit(subject)} className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-subtext)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-all">
                  <Edit3 size={12} />
               </button>
             )}
          </div>
          <p className="text-[10px] font-bold text-[var(--color-subtext)] uppercase tracking-wider">Target: {required}%</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div 
            className="text-xl lg:text-2xl font-black italic tracking-tighter px-3 py-1.5 rounded-xl border" 
            style={{ 
              color: isSafe ? '#0F6E56' : isWarning ? '#BA7517' : '#A32D2D',
              borderColor: isSafe ? '#0F6E5630' : isWarning ? '#BA751730' : '#A32D2D30',
              background: isSafe ? '#0F6E5608' : isWarning ? '#BA751708' : '#A32D2D08'
            }}
          >
            {pct}%
          </div>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-dashed"
            style={{ 
              borderColor: bunkability.color + '40',
              color: bunkability.color,
              background: bunkability.color + '05'
            }}
          >
            <Zap size={10} fill={bunkability.color} className="opacity-80" />
            {bunkability.label}
          </div>
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-[var(--color-subtext)] uppercase tracking-wide">Overall Score</span>
          <span className="text-[11px] font-extrabold text-[var(--color-text)]">{subject.attended} / {subject.total}</span>
        </div>
        <div className="relative h-2 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-border)]/50">
           <div className="absolute top-0 left-0 h-full w-[2px] bg-[var(--color-border)] z-10" style={{ left: `${required}%` }} />
           <motion.div 
             initial={{ width: 0 }} animate={{ width: `${Math.min(100, percentage)}%` }} 
             className="h-full rounded-full" 
             style={{ backgroundColor: isSafe ? '#0F6E56' : isWarning ? '#BA7517' : '#A32D2D' }} 
           />
        </div>
      </div>

      {/* ── INSIGHT CHIP ── */}
      <div className={`p-3.5 rounded-2xl flex items-start gap-3 transition-colors ${isSafe ? 'bg-green-50' : 'bg-red-50'}`}>
         <div className={`mt-0.5 shrink-0 ${isSafe ? 'text-green-600' : 'text-red-600'}`}>
            {isSafe ? <CheckCircle2 size={16} /> : <Zap size={16} />}
         </div>
         <p className={`text-[11px] lg:text-[12px] font-bold leading-relaxed ${isSafe ? 'text-green-800' : 'text-red-800'}`}>{statusMsg}</p>
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex gap-2">
           <button 
             onClick={() => onMark(subject._id, 'Present')} 
             disabled={isUpdating}
             className="flex-1 py-3 px-4 bg-primary text-white text-[12px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
           >
              <Check size={14} strokeWidth={3} /> Present
           </button>
           <button 
             onClick={() => onMark(subject._id, 'Absent')} 
             disabled={isUpdating}
             className="flex-1 py-3 px-4 bg-card-bg border border-[var(--color-border)] text-[var(--color-text)] text-[12px] font-black uppercase tracking-wider rounded-xl hover:bg-[var(--color-bg)] active:scale-98 transition-all flex items-center justify-center gap-2"
           >
              <X size={14} strokeWidth={3} /> Absent
           </button>
           
           <div className="relative">
              <button 
                disabled={isUpdating} 
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`w-12 h-full rounded-xl border flex items-center justify-center transition-all ${isMoreOpen ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'border-[var(--color-border)] text-[var(--color-subtext)] hover:bg-[var(--color-bg)]'}`}
              >
                 <ChevronDown size={16} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isMoreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 bottom-full mb-3 bg-card-bg border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 w-44 overflow-hidden origin-bottom-right"
                    >
                       <div className="p-2 border-b border-[var(--color-border)]/50 bg-[var(--color-bg)] flex items-center justify-between px-4">
                          <span className="text-[10px] font-extrabold text-[var(--color-subtext)] uppercase tracking-wider">Quick Actions</span>
                          <button onClick={() => setIsMoreOpen(false)} className="text-[var(--color-subtext)] hover:text-[var(--color-text)] transition-all"><X size={12} /></button>
                       </div>
                       <div className="py-1">
                          {['Medical', 'OD', 'Cancelled'].map(st => (
                            <button 
                              key={st} 
                              onClick={() => {
                                onMark(subject._id, st);
                                setIsMoreOpen(false);
                              }} 
                              className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-[var(--color-text)] hover:bg-[var(--color-bg)] flex items-center justify-between group/row"
                            >
                              {st}
                              <ChevronDown size={10} className="-rotate-90 opacity-0 group-hover/row:opacity-40 transition-all" />
                            </button>
                          ))}
                          {onUndo && (
                            <button 
                              onClick={() => {
                                onUndo(subject._id);
                                setIsMoreOpen(false);
                              }} 
                              className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-primary hover:bg-primary/5 flex items-center gap-2 border-t border-[var(--color-border)]/40 mt-1"
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
          <button onClick={() => onOpenRegister(subject)} className="w-full py-2.5 rounded-xl border border-dashed border-[var(--color-border)] text-[11px] font-bold text-[var(--color-subtext)] flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all bg-[var(--color-bg)]/50">
             <CalendarDays size={13} /> View Full Register
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SubjectCard;