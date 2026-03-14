import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import useStore from '../store/useStore';

const RescuePlanModal = ({ subject, onClose }) => {
  const { getRecoveryPlan } = useStore();
  
  const plan = useMemo(() => {
    if (!subject) return null;
    return getRecoveryPlan(subject._id);
  }, [subject, getRecoveryPlan]);

  return (
    <div style={modal.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        style={modal.wrap}
      >
        <div style={modal.header}>
          <div>
            <h2 style={modal.title}>Rescue Plan</h2>
            <p style={modal.subtitle}>For <b>{subject?.name}</b></p>
          </div>
          <button onClick={onClose} style={modal.closeBtn} className="hover:bg-bg transition-all">
            <X size={15} />
          </button>
        </div>

        <div style={modal.body}>
          {!plan && <p>Loading...</p>}

          {plan?.status === 'error' && (
            <div style={alert.wrapWarning}>
               <AlertTriangle size={18} style={{ color: '#BA7517' }} />
               <p style={alert.textWarning}>{plan.message}</p>
            </div>
          )}

          {plan?.status === 'safe' && (
             <div style={alert.wrapSuccess}>
               <ShieldCheck size={24} style={{ color: '#0F6E56', marginBottom: 8 }} />
               <p style={{ fontSize: 16, fontWeight: 700, color: '#0f0e0d', margin: 0 }}>You are Safe!</p>
               <p style={{ ...alert.textSuccess, marginTop: 4 }}>You are already above your target attendance for this subject. Keep it up!</p>
             </div>
          )}

          {plan?.status === 'impossible' && (
             <div style={alert.wrapDanger}>
               <X size={24} style={{ color: '#A32D2D', marginBottom: 8 }} />
               <p style={{ fontSize: 16, fontWeight: 700, color: '#0f0e0d', margin: 0 }}>Mathematically Impossible</p>
               <p style={{ ...alert.textDanger, marginTop: 4 }}>Even if you attend every single class from today until the end of the semester, you cannot reach the target attendance.</p>
             </div>
          )}

          {plan?.status === 'plan' && (
             <>
               <div style={planSummary.wrap}>
                  <div style={planSummary.icon}>
                    <Calendar size={18} style={{ color: '#185FA5' }} />
                  </div>
                  <div>
                    <h3 style={planSummary.title}>Action Required</h3>
                    <p style={planSummary.text}>
                      You must attend the next <b>{plan.totalRequired}</b> classes to strictly hit your target.
                    </p>
                  </div>
               </div>

               <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b0ada8', marginBottom: 12 }}>
                 Mandatory Schedule
               </p>

               <div style={list.wrap}>
                 {plan.dates.map((d, i) => (
                    <div key={i} style={list.item}>
                      <div style={list.dateBox}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8c8a87' }}>
                          {new Date(d.date).toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f0e0d', lineHeight: 1 }}>
                          {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#4a4845' }}>
                          {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                        </p>
                        <p style={{ fontSize: 11, color: '#8c8a87', marginTop: 2 }}>
                          {d.classes} class{d.classes > 1 ? 'es' : ''} scheduled
                        </p>
                      </div>
                      {i !== plan.dates.length - 1 && (
                         <ArrowRight size={14} style={{ color: '#dcd9d4' }} />
                      )}
                      {i === plan.dates.length - 1 && (
                         <div style={{ padding: '4px 8px', background: '#E1F5EE', color: '#0F6E56', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>
                           TARGET HIT
                         </div>
                      )}
                    </div>
                 ))}
               </div>
             </>
          )}

        </div>
      </motion.div>
    </div>
  );
};

const modal = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  wrap: {
    background: 'var(--card-bg)', borderRadius: 16, border: '0.5px solid var(--border)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.12)', width: '100%', maxWidth: 420,
    maxHeight: '85vh', display: 'flex', flexDirection: 'column'
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
    padding: '20px 20px 16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0
  },
  title: { fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' },
  subtitle: { fontSize: 13, color: 'var(--subtext)', marginTop: 4 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 8, border: '0.5px solid var(--border)',
    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--subtext)', flexShrink: 0,
  },
  body: { padding: '20px', overflowY: 'auto', flex: 1 },
};

const alert = {
  wrapWarning: { display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: '#FDF6E3', borderRadius: 12, border: '1px solid #F5E1A4' },
  textWarning: { fontSize: 13, color: '#BA7517', margin: 0, fontWeight: 500 },
  
  wrapSuccess: { padding: 20, background: '#E1F5EE', borderRadius: 12, border: '1px solid #A2DAC3', textAlign: 'center' },
  textSuccess: { fontSize: 13, color: '#0F6E56', margin: 0 },

  wrapDanger: { padding: 20, background: '#FCEBEB', borderRadius: 12, border: '1px solid #EAC4C4', textAlign: 'center' },
  textDanger: { fontSize: 13, color: '#A32D2D', margin: 0 },
};

const planSummary = {
  wrap: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--bg)', borderRadius: 12, marginBottom: 24 },
  icon: { width: 40, height: 40, borderRadius: 10, background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  title: { fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 },
  text: { fontSize: 12, color: 'var(--text)', opacity: 0.8, margin: '4px 0 0', lineHeight: 1.4 }
};

const list = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12 },
  dateBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, background: 'var(--bg)', borderRadius: 10, gap: 2 }
};

export default RescuePlanModal;
