import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, AlertTriangle, ShieldCheck, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';

const RescuePlanModal = ({ subject, onClose }) => {
  const { getRecoveryPlan } = useStore();
  
  const plan = useMemo(() => {
    if (!subject) return null;
    return getRecoveryPlan(subject._id);
  }, [subject, getRecoveryPlan]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-[rgba(var(--bg-rgb),0.5)] backdrop-blur-md" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="bg-[var(--color-card-bg)] rounded-[32px] w-full max-w-[420px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-[var(--color-border)] mx-auto backdrop-blur-2xl"
      >
        <div className="p-5 lg:p-6 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base lg:text-xl font-extrabold text-[var(--color-text)] tracking-tight">{subject?.name || 'Subject'}</h2>
            <p className="text-[10px] lg:text-xs text-[var(--color-subtext)] font-bold mt-1 uppercase tracking-wider">Smart Recovery Roadmap</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-subtext)] hover:text-[var(--color-text)] transition-all"><X size={16} /></button>
        </div>

        <div className="p-5 lg:p-6 overflow-y-auto flex-1 no-scrollbar">
          {!plan && <p className="text-subtext text-center py-10 font-bold">Recalculating...</p>}

          {plan?.status === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-[var(--color-warning-lo)] rounded-2xl border border-[var(--color-warning)]/20">
               <AlertTriangle size={18} className="text-[var(--color-warning)]" />
               <p className="text-xs font-bold text-[var(--color-warning)] m-0">{plan.message}</p>
            </div>
          )}

          {plan?.status === 'safe' && (
             <div className="p-6 bg-[var(--color-success-lo)] rounded-3xl border border-[var(--color-success)]/20 text-center space-y-2">
               <ShieldCheck size={32} className="text-[var(--color-success)] mx-auto" />
               <p className="text-lg font-black text-[var(--color-success)] m-0">You are Safe!</p>
               <p className="text-xs font-bold text-[var(--color-success)]/80 leading-relaxed">You are already above your target attendance for this subject. Keep it up!</p>
             </div>
          )}

          {plan?.status === 'impossible' && (
             <div className="p-6 bg-[var(--color-danger-lo)] rounded-3xl border border-[var(--color-danger)]/20 text-center space-y-2">
               <XCircle size={32} className="text-[var(--color-danger)] mx-auto" />
               <p className="text-lg font-black text-[var(--color-danger)] m-0">Mathematically Impossible</p>
               <p className="text-xs font-bold text-[var(--color-danger)]/80 leading-relaxed">Even if you attend every single class from today until the end of the semester, you cannot reach the target attendance.</p>
             </div>
          )}

          {plan?.status === 'plan' && (
             <div className="space-y-6">
                <div className="bg-[var(--color-bg)] p-5 rounded-2xl border border-[var(--color-border)] flex flex-col gap-4 shadow-sm">
                   <div className="flex-1">
                     <h3 className="text-xs font-black text-[var(--color-subtext)] uppercase tracking-widest mb-3">Goal Progress</h3>
                     <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-[var(--color-surface)] rounded-full overflow-hidden border border-[var(--color-border)]/50">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(plan.currentPct / plan.targetPct) * 100}%` }}
                             className="h-full bg-[var(--color-warning)] rounded-full shadow-sm"
                           />
                        </div>
                        <span className="text-xs font-black text-[var(--color-warning)]">{plan.currentPct}%</span>
                     </div>
                     <p className="text-xs font-bold text-[var(--color-text)] mt-4">
                       Target <b>{plan.targetPct}%</b> by <b>{new Date(plan.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</b>
                     </p>
                   </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[var(--color-subtext)] uppercase tracking-widest mb-4 px-1">
                    Recovery Roadmap
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    {plan.dates.map((d, i) => (
                       <div key={i} className="flex items-center gap-4 p-3 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)]/30 transition-all shadow-sm group">
                         <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--color-bg)] rounded-xl gap-0.5 border border-[var(--color-border)] group-hover:bg-[var(--color-primary)]/5 transition-colors">
                           <span className="text-[8px] font-black uppercase text-[var(--color-subtext)]">
                             {new Date(d.date).toLocaleDateString('en-GB', { month: 'short' })}
                           </span>
                           <span className="text-base font-black text-[var(--color-text)] leading-none">
                             {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric' })}
                           </span>
                         </div>
                         
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between">
                             <p className="text-sm font-bold text-[var(--color-text)] truncate">Mandatory Session</p>
                             <div className="flex items-center gap-1.5 bg-[var(--color-success-lo)] px-2 py-1 rounded-lg border border-[var(--color-success)]/10">
                               <CheckCircle2 size={12} className="text-[var(--color-success)]" />
                               <span className="text-[10px] font-black text-[var(--color-success)]">MUST ATTEND</span>
                             </div>
                           </div>
                           <p className="text-[10px] font-bold text-[var(--color-subtext)] uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                             <Calendar size={10} /> {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                           </p>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-primary-lo)] border border-[var(--color-primary)]/10 rounded-2xl flex items-start gap-3">
                   <ArrowRight size={18} className="text-[var(--color-primary)] mt-0.5" />
                   <div className="flex-1">
                      <p className="text-xs font-bold text-[var(--color-text)] leading-relaxed">
                        Following this roadmap will bring your attendance to exactly <span className="text-[var(--color-primary)] font-black">{plan.targetPct}%</span> by semester end.
                      </p>
                   </div>
                </div>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RescuePlanModal;
