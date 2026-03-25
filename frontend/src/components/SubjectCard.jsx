import React, { useState, useCallback } from 'react';
import {
  motion, AnimatePresence, useMotionValue, useTransform, animate,
} from 'framer-motion';
import {
  RotateCcw, CalendarDays, ChevronDown, Check, X, AlertCircle,
} from 'lucide-react';
import useStore from '../store/useStore';

const SPRING = { type: 'spring', stiffness: 420, damping: 34 };

/* ─── Inline responsive styles injected once ─── */
const GLOBAL_STYLES = `
  .sc-root {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: clamp(14px, 2vw, 20px);
    padding: clamp(14px, 3vw, 20px) clamp(14px, 3vw, 22px);
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 2vw, 14px);
    position: relative;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.25s ease, transform 0.2s ease;
    will-change: transform;
    overflow: visible;
  }
  .sc-root:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  /* Subject name */
  .sc-name {
    font-size: clamp(13px, 2.5vw, 16px);
    font-weight: 750;
    color: var(--color-text);
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sc-sessions {
    font-size: clamp(9px, 1.8vw, 11px);
    font-weight: 600;
    color: var(--color-subtext);
    margin: 3px 0 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Big percentage */
  .sc-pct {
    font-size: clamp(20px, 5vw, 26px);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    transition: color 0.4s ease;
  }
  .sc-pct-label {
    font-size: clamp(8px, 1.5vw, 9px);
    font-weight: 700;
    color: var(--color-subtext);
    margin: 0;
    text-align: right;
  }

  /* Status tip */
  .sc-tip {
    padding: clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: clamp(10px, 2vw, 11px);
    font-weight: 650;
    margin: 0;
    line-height: 1.35;
    transition: background 0.4s ease;
  }

  /* Action buttons */
  .sc-btn-present {
    flex: 1.2;
    height: clamp(34px, 5vw, 40px);
    padding: 0;
    font-size: clamp(11px, 2vw, 13px);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.15s ease, filter 0.15s ease;
  }
  .sc-btn-present:active { transform: scale(0.96); filter: brightness(0.9); }

  .sc-btn-absent {
    flex: 1;
    height: clamp(34px, 5vw, 40px);
    padding: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, background 0.2s ease;
  }
  .sc-btn-absent:active { transform: scale(0.96); }

  .sc-btn-more {
    width: clamp(34px, 5vw, 40px);
    height: clamp(34px, 5vw, 40px);
    padding: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }
  .sc-btn-more:active { transform: scale(0.96); }

  .sc-btn-register {
    width: 100%;
    height: clamp(32px, 5vw, 36px);
    padding: 0;
    border-radius: 10px;
    font-size: clamp(10px, 1.8vw, 11px);
    font-weight: 750;
    color: var(--color-subtext);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid var(--color-border);
    transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
  }
  .sc-btn-register:hover { color: var(--color-text); }
  .sc-btn-register:active { transform: scale(0.98); }

  /* Dropdown menu items */
  .sc-menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: clamp(7px, 1.5vw, 9px) clamp(8px, 1.5vw, 11px);
    border-radius: 8px;
    border: none;
    background: none;
    font-size: clamp(11px, 2vw, 12px);
    font-weight: 600;
    color: var(--color-text);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.15s ease;
  }
  .sc-menu-item:hover { background: var(--hover); }

  .sc-menu-undo {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: clamp(7px, 1.5vw, 9px) clamp(8px, 1.5vw, 11px);
    border-radius: 8px;
    border: none;
    background: none;
    font-size: clamp(11px, 2vw, 12px);
    font-weight: 700;
    color: var(--color-primary);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.15s ease;
  }
  .sc-menu-undo:hover { background: var(--hover); }

  /* Drag handle pill */
  .sc-drag-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-border);
    margin: 0 auto -4px;
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.2s, width 0.2s;
    cursor: grab;
  }
  .sc-root:hover .sc-drag-handle {
    opacity: 1;
    width: 44px;
  }
  .sc-drag-handle:active { cursor: grabbing; }

  /* Dismiss hint label */
  .sc-dismiss-hint {
    position: absolute;
    bottom: -28px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-danger);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0;
    pointer-events: none;
    white-space: nowrap;
    transition: opacity 0.2s;
  }

  /* Shimmer on updating state */
  @keyframes sc-shimmer {
    0%   { opacity: 0.55; }
    50%  { opacity: 0.35; }
    100% { opacity: 0.55; }
  }
  .sc-updating { animation: sc-shimmer 1.2s ease-in-out infinite; pointer-events: none; }

  /* Ripple keyframe for Present button */
  @keyframes sc-ripple {
    0%   { transform: scale(0); opacity: 0.35; }
    100% { transform: scale(4); opacity: 0; }
  }
  .sc-ripple-wrap { position: relative; overflow: hidden; }
  .sc-ripple-wrap .ripple {
    position: absolute;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    background: rgba(255,255,255,0.45);
    animation: sc-ripple 0.5s linear forwards;
    pointer-events: none;
    transform-origin: center;
  }
`;

function injectStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('sc-styles')) {
    const tag = document.createElement('style');
    tag.id = 'sc-styles';
    tag.textContent = GLOBAL_STYLES;
    document.head.appendChild(tag);
  }
}

/* ─── Ripple helper ─── */
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const trigger = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 15;
    const y = e.clientY - rect.top - 15;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 520);
  };
  return [ripples, trigger];
}

/* ─── Animated ring around percentage ─── */
function PercentRing({ pct, required, statusColor, size = 56 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const safeDash = isNaN(pct) ? 0 : Math.min(100, pct) / 100 * circ;
  const reqDash = Math.min(100, required) / 100 * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--color-border)" strokeWidth={5} />
      {/* Required marker arc (faint) */}
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={statusColor} strokeWidth={5} opacity={0.15}
        strokeDasharray={`${reqDash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      {/* Actual progress */}
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={statusColor} strokeWidth={5}
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - safeDash }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
}

const DISMISS_THRESHOLD = 120; // px down before snap-dismiss

/* ─── Main Component ─── */
const SubjectCard = ({ subject, onMark, onEdit, onUndo, onOpenRegister, onDismiss }) => {
  injectStyles();

  const getRecoveryDate = useStore(state => state.getRecoveryDate);
  const isUpdating = useStore(state => state.updatingAttendance[subject._id]);

  const recoveryDate = getRecoveryDate(subject._id);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [ripples, triggerRipple] = useRipple();

  const required   = subject.requiredAttendance || 75;
  const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
  const pct        = parseFloat(percentage.toFixed(1));

  const bunkAllowance     = Math.floor((subject.attended - (required / 100) * subject.total) / (required / 100));
  const nextClassesToSafe = Math.max(0, Math.ceil(((required / 100) * subject.total - subject.attended) / (1 - required / 100)));

  const isSafe    = percentage >= required;
  const isWarning = !isSafe && percentage >= required - 5;
  const brandColor  = subject.color || 'var(--color-primary)';

  const statusColor = isSafe ? 'var(--color-success)' : isWarning ? 'var(--color-warning)' : 'var(--color-danger)';
  const statusBg    = isSafe ? 'var(--color-success-lo)' : isWarning ? 'var(--color-warning-lo)' : 'var(--color-danger-lo)';

  const tipText = isSafe
    ? bunkAllowance > 0 ? `You can safely miss ${bunkAllowance} more class${bunkAllowance > 1 ? 'es' : ''}.` : 'At the limit — attend next class.'
    : recoveryDate === 'Impossible' ? 'Goal unreachable this semester.'
    : `Attend ${nextClassesToSafe} consecutive session${nextClassesToSafe > 1 ? 's' : ''} to recover.`;

  const y         = useMotionValue(0);
  const opacity   = useTransform(y, [0, DISMISS_THRESHOLD], [1, 0.3]);
  const scale     = useTransform(y, [0, DISMISS_THRESHOLD], [1, 0.94]);
  const hintOpacity = useTransform(y, [40, 90], [0, 1]);
  const [dismissed, setDismissed] = useState(false);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.y > DISMISS_THRESHOLD || info.velocity.y > 600) {
      animate(y, 340, { duration: 0.28, ease: [0.4, 0, 1, 1] });
      setDismissed(true);
      setTimeout(() => onDismiss?.(subject._id), 300);
    } else {
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 36 });
    }
  }, [y, onDismiss, subject._id]);

  if (dismissed) return null;

  return (
    <motion.div
      style={{ y, opacity, scale, position: 'relative', touchAction: 'pan-x' }}
      drag="y"
      dragConstraints={{ top: 0, bottom: DISMISS_THRESHOLD + 60 }}
      dragElastic={{ top: 0, bottom: 0.28 }}
      onDragEnd={handleDragEnd}
      dragMomentum={false}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {/* Dismiss hint that appears as user drags down */}
      <motion.span className="sc-dismiss-hint" style={{ opacity: hintOpacity }}>
        Release to remove
      </motion.span>

    <motion.div
      className={`sc-root${isUpdating ? ' sc-updating' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* ── DRAG HANDLE ── */}
      <div className="sc-drag-handle" />

      {/* Brand dot */}
      <motion.div
        layoutId={`dot-${subject._id}`}
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 9, height: 9, borderRadius: '50%',
          background: brandColor,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${brandColor} 20%, transparent)`,
        }}
      />

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingRight: 4 }}>
        {/* Left: name + sessions */}
        <div onClick={() => onEdit(subject)} style={{ flex: 1, minWidth: 0, cursor: 'pointer', paddingRight: 8 }}>
          <h3 className="sc-name">{subject.name}</h3>
          <p className="sc-sessions">{subject.attended} / {subject.total} Sessions</p>
        </div>

        {/* Right: ring + percentage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <PercentRing pct={pct} required={required} statusColor={statusColor} size={isMobile ? 48 : 52} />
          <div style={{ textAlign: 'right', minWidth: 44 }}>
            <motion.span
              className="sc-pct"
              animate={{ color: statusColor }}
              style={{ fontSize: isMobile ? 'clamp(18px, 4.5vw, 22px)' : 'clamp(20px, 5vw, 26px)' }}
              transition={{ duration: 0.5 }}
            >
              {pct.toFixed(0)}%
            </motion.span>
            <p className="sc-pct-label">CURRENT</p>
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{
          height: 6, background: 'var(--color-border)',
          borderRadius: 3, overflow: 'hidden', position: 'relative',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentage)}%` }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', background: statusColor, borderRadius: 3 }}
          />
          {/* Target tick */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: 2,
            background: 'var(--color-text)', opacity: 0.18,
            left: `${required}%`, borderRadius: 1,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'clamp(9px,1.8vw,10px)', fontWeight: 700, color: 'var(--color-subtext)' }}>
            Required {required}%
          </span>
          <motion.span
            animate={{ color: statusColor }}
            style={{ fontSize: 'clamp(9px,1.8vw,10px)', fontWeight: 800 }}
          >
            {isSafe ? `+${bunkAllowance} can miss` : `${nextClassesToSafe} needed`}
          </motion.span>
        </div>
      </div>

      {/* ── STATUS TIP ── */}
      <motion.div
        animate={{ background: statusBg }}
        transition={{ duration: 0.4 }}
        style={{ borderRadius: 12, border: `1px solid color-mix(in srgb, ${statusColor} 18%, transparent)` }}
      >
        <p className="sc-tip" style={{ color: statusColor }}>
          {isSafe
            ? <Check size={12} color="var(--color-success)" strokeWidth={3} style={{ flexShrink: 0 }} />
            : <AlertCircle size={12} color={statusColor} style={{ flexShrink: 0 }} />
          }
          {tipText}
        </p>
      </motion.div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {/* Present — with ripple */}
        <button
          onClick={(e) => { triggerRipple(e); onMark(subject._id, 'Present'); }}
          disabled={isUpdating}
          className="btn-primary sc-btn-present sc-ripple-wrap"
        >
          {ripples.map(rp => (
            <span key={rp.id} className="ripple" style={{ left: rp.x, top: rp.y }} />
          ))}
          <Check size={14} strokeWidth={2.5} />
          Present
        </button>

        {/* Right cluster */}
        <div style={{ position: 'relative', display: 'flex', gap: 8, flex: 1 }}>
          <button
            onClick={() => onMark(subject._id, 'Absent')}
            disabled={isUpdating}
            className="btn-secondary sc-btn-absent"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
          >
            <X size={14} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            disabled={isUpdating}
            className="btn-secondary sc-btn-more"
          >
            <motion.div animate={{ rotate: isMoreOpen ? 180 : 0 }} transition={SPRING}>
              <ChevronDown size={14} />
            </motion.div>
          </button>

          <AnimatePresence>
            {isMoreOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsMoreOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.94 }}
                  transition={SPRING}
                  style={{
                    position: 'absolute', right: 0, bottom: 'calc(100% + 8px)',
                    width: 'clamp(130px, 30vw, 148px)',
                    background: 'var(--color-card-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50,
                    padding: 4,
                  }}
                >
                  {['Medical', 'OD', 'Cancelled'].map((st, i) => (
                    <motion.button
                      key={st}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { onMark(subject._id, st); setIsMoreOpen(false); }}
                      className="sc-menu-item"
                    >
                      {st}
                    </motion.button>
                  ))}
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                  <button
                    onClick={() => { onUndo(subject._id); setIsMoreOpen(false); }}
                    className="sc-menu-undo"
                  >
                    <RotateCcw size={12} />
                    Undo Last
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── REGISTER ── */}
      <button
        onClick={() => onOpenRegister(subject)}
        className="btn-secondary sc-btn-register"
      >
        <CalendarDays size={13} />
        View Register
      </button>

    </motion.div>
    </motion.div>
  );
};

export default SubjectCard;