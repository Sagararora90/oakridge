import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, CalendarDays, ChevronDown, Check, X, AlertCircle, Info
} from 'lucide-react';
import useStore from '../store/useStore';

const SPRING = { type: 'spring', stiffness: 420, damping: 34 };

const SubjectCard = ({ subject, onMark, onEdit, onUndo, onOpenRegister, projection }) => {
  const getRecoveryDate = useStore(state => state.getRecoveryDate);
  const isUpdating = useStore(state => state.updatingAttendance[subject._id]);
  
  const recoveryDate = getRecoveryDate(subject._id);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const required   = subject.requiredAttendance || 75;
  const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
  const pct = parseFloat(percentage.toFixed(1));

  // Bunk allowance & Recovery
  const bunkAllowance = Math.floor((subject.attended - (required / 100) * subject.total) / (required / 100));
  const nextClassesToSafe = Math.max(0, Math.ceil(((required / 100) * subject.total - subject.attended) / (1 - required / 100)));

  const isSafe = percentage >= required;
  const isWarning = !isSafe && percentage >= required - 5;
  const brandColor = subject.color || 'var(--color-primary)';
  
  // Status Logic
  const statusColor = isSafe ? 'var(--color-success)' : isWarning ? 'var(--color-warning)' : 'var(--color-danger)';
  const statusBg    = isSafe ? 'var(--color-success-lo)' : isWarning ? 'var(--color-warning-lo)' : 'var(--color-danger-lo)';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }}
      layout
      style={{
        background: 'var(--color-card-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
        opacity: isUpdating ? 0.6 : 1,
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      
      {/* Decorative accent */}
      <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: brandColor }} />
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 10 }}>
        <div 
          onClick={() => onEdit(subject)} 
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 750, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {subject.name}
          </h3>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {subject.attended} / {subject.total} Sessions
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: statusColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {pct.toFixed(0)}%
          </span>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)', margin: 0 }}>CURRENT</p>
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 2.5, overflow: 'hidden', position: 'relative' }}>
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${Math.min(100, percentage)}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', background: statusColor }} 
          />
          {/* Target marker */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'var(--color-text)', opacity: 0.15, left: `${required}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)' }}>Required {required}%</span>
          {isSafe ? (
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 3 }}>
              +{bunkAllowance} Safe
            </span>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 800, color: isWarning ? 'var(--color-warning)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {nextClassesToSafe} Needed
            </span>
          )}
        </div>
      </div>

      {/* ── STATUS TIP ── */}
      <div style={{ 
        padding: '10px 12px', 
        background: statusBg, 
        borderRadius: 12, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        border: `1px solid ${statusBg}`
      }}>
        {isSafe ? <Check size={12} color="var(--color-success)" strokeWidth={3} /> : <AlertCircle size={12} color={statusColor} />}
        <p style={{ fontSize: 11, fontWeight: 650, margin: 0, color: statusColor, lineHeight: 1.3 }}>
          {isSafe 
            ? bunkAllowance > 0 ? `You can safely miss ${bunkAllowance} more.` : 'At the limit — attend next.'
            : recoveryDate === 'Impossible' ? 'Goal unreachable this semester.' : `Recover in ${nextClassesToSafe} sessions.`
          }
        </p>
      </div>

      {/* ── ACTIONS ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onMark(subject._id, 'Present')} disabled={isUpdating}
          className="btn-primary" style={{ flex: 1.2, height: 38, padding: 0, fontSize: 12, borderRadius: 10 }}>
          <Check size={14} strokeWidth={2.5} /> Present
        </button>
        
        <div style={{ position: 'relative', display: 'flex', gap: 8, flex: 1 }}>
          <button onClick={() => onMark(subject._id, 'Absent')} disabled={isUpdating}
            className="btn-secondary" style={{ flex: 1, height: 38, padding: 0, fontSize: 12, borderRadius: 10, border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
            <X size={14} strokeWidth={2.5} />
          </button>

          <button onClick={() => setIsMoreOpen(!isMoreOpen)} disabled={isUpdating}
            className="btn-secondary" style={{ width: 38, height: 38, padding: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronDown size={14} style={{ transform: isMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {isMoreOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsMoreOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 8, scale: 0.96 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 8, scale: 0.96 }} 
                  transition={SPRING}
                  style={{ 
                    position: 'absolute', right: 0, bottom: 'calc(100% + 8px)', 
                    width: 140, background: 'var(--color-card-bg)', 
                    border: '1px solid var(--color-border)', borderRadius: 12, 
                    boxShadow: 'var(--shadow-lg)', zIndex: 50, padding: 4 
                  }}
                >
                  {['Medical', 'OD', 'Cancelled'].map(st => (
                    <button key={st} onClick={() => { onMark(subject._id, st); setIsMoreOpen(false); }}
                      style={{ 
                        display: 'flex', alignItems: 'center', width: '100%', 
                        padding: '8px 10px', borderRadius: 8, border: 'none', 
                        background: 'none', fontSize: 12, fontWeight: 600, 
                        color: 'var(--color-text)', cursor: 'pointer', textAlign: 'left', 
                        fontFamily: 'inherit' 
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {st}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                  <button onClick={() => { onUndo(subject._id); setIsMoreOpen(false); }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, width: '100%', 
                      padding: '8px 10px', borderRadius: 8, border: 'none', 
                      background: 'none', fontSize: 12, fontWeight: 700, 
                      color: 'var(--color-primary)', cursor: 'pointer', textAlign: 'left', 
                      fontFamily: 'inherit' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <RotateCcw size={12} /> Undo Last
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button onClick={() => onOpenRegister(subject)}
        className="btn-secondary" 
        style={{ 
          width: '100%', height: 36, padding: 0, borderRadius: 10, fontSize: 11, fontWeight: 750, 
          color: 'var(--color-subtext)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', gap: 8, border: '1px solid var(--color-border)' 
        }}
      >
        <CalendarDays size={13} /> View Register
      </button>

    </motion.div>
  );
};

export default SubjectCard;