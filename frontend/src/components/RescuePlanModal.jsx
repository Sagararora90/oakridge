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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="bg-card-bg rounded-[32px] w-full max-w-[420px] max-h-[85vh] shadow-[0_32px_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col relative z-10 border border-border mx-auto"
      >
        <div className="p-5 lg:p-6 border-b border-border bg-bg flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base lg:text-xl font-extrabold text-text tracking-tight">{subject?.name || 'Subject'}</h2>
            <p className="text-[10px] lg:text-xs text-subtext font-bold mt-1 uppercase tracking-wider">Smart Recovery Roadmap</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card-bg border border-border flex items-center justify-center text-subtext hover:text-text transition-all"><X size={16} /></button>
        </div>

        <div className="p-5 lg:p-6 overflow-y-auto flex-1 no-scrollbar">
          {!plan && <p className="text-subtext text-center py-10 font-bold">Recalculating...</p>}

          {plan?.status === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
               <AlertTriangle size={18} className="text-orange-600" />
               <p className="text-xs font-bold text-orange-700 dark:text-orange-400 m-0">{plan.message}</p>
            </div>
          )}

          {plan?.status === 'safe' && (
             <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-3xl border border-green-100 dark:border-green-900/30 text-center space-y-2">
               <ShieldCheck size={32} className="text-green-600 mx-auto" />
               <p className="text-lg font-black text-green-800 dark:text-green-400 m-0">You are Safe!</p>
               <p className="text-xs font-bold text-green-700 dark:text-green-500/80 leading-relaxed">You are already above your target attendance for this subject. Keep it up!</p>
             </div>
          )}

          {plan?.status === 'impossible' && (
             <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30 text-center space-y-2">
               <XCircle size={32} className="text-red-600 mx-auto" />
               <p className="text-lg font-black text-red-800 dark:text-red-400 m-0">Mathematically Impossible</p>
               <p className="text-xs font-bold text-red-700 dark:text-red-500/80 leading-relaxed">Even if you attend every single class from today until the end of the semester, you cannot reach the target attendance.</p>
             </div>
          )}

          {plan?.status === 'plan' && (
             <div className="space-y-6">
                <div className="bg-bg p-5 rounded-2xl border border-border flex flex-col gap-4 shadow-sm">
                   <div className="flex-1">
                     <h3 className="text-xs font-black text-subtext uppercase tracking-widest mb-3">Goal Progress</h3>
                     <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-white dark:bg-card-bg rounded-full overflow-hidden border border-border/50">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(plan.currentPct / plan.targetPct) * 100}%` }}
                             className="h-full bg-orange-500 rounded-full shadow-sm"
                           />
                        </div>
                        <span className="text-xs font-black text-orange-600 dark:text-orange-400">{plan.currentPct}%</span>
                     </div>
                     <p className="text-xs font-bold text-text mt-4">
                       Target <b>{plan.targetPct}%</b> by <b>{new Date(plan.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</b>
                     </p>
                   </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-4 px-1">
                    Recovery Roadmap
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    {plan.dates.map((d, i) => (
                       <div key={i} className="flex items-center gap-4 p-3 bg-card-bg border border-border rounded-2xl hover:border-primary/30 transition-all shadow-sm group">
                         <div className="flex flex-col items-center justify-center w-12 h-12 bg-bg rounded-xl gap-0.5 border border-border group-hover:bg-primary/5 transition-colors">
                           <span className="text-[8px] font-black uppercase text-subtext">
                             {new Date(d.date).toLocaleDateString('en-GB', { month: 'short' })}
                           </span>
                           <span className="text-base font-black text-text leading-none">
                             {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric' })}
                           </span>
                         </div>
                         
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between">
                             <p className="text-sm font-bold text-text truncate">Mandatory Session</p>
                             <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-lg border border-green-100 dark:border-green-900/30">
                               <CheckCircle2 size={12} className="text-green-600" />
                               <span className="text-[10px] font-black text-green-700 dark:text-green-400">MUST ATTEND</span>
                             </div>
                           </div>
                           <p className="text-[10px] font-bold text-subtext uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                             <Calendar size={10} /> {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                           </p>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                   <ArrowRight size={18} className="text-primary mt-0.5" />
                   <div className="flex-1">
                      <p className="text-xs font-bold text-text leading-relaxed">
                        Following this roadmap will bring your attendance to exactly <span className="text-primary font-black">{plan.targetPct}%</span> by semester end.
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
