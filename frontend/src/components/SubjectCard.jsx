import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Edit3, RotateCcw, Zap, CalendarDays, ChevronDown
} from 'lucide-react';
import useStore from '../store/useStore';

const SubjectCard = ({ subject, onMark, onEdit, onUndo, onOpenRegister, projection }) => {
  const getRecoveryDate = useStore(state => state.getRecoveryDate);
  const recoveryDate    = getRecoveryDate(subject._id);

  const required   = subject.requiredAttendance || 75;
  const percentage = subject.total > 0
    ? (subject.attended / subject.total) * 100
    : 0;
  const pct = percentage.toFixed(1);

  // How many more to skip safely (positive = can skip, negative = need to attend)
  const bunkAllowance = Math.floor(
    (subject.attended - (required / 100) * subject.total) / (required / 100)
  );

  // How many consecutive classes to attend to get back on track
  const nextClassesToSafe = Math.max(
    0,
    Math.ceil(
      ((required / 100) * subject.total - subject.attended) /
      (1 - required / 100)
    )
  );

  const isSafe    = percentage >= required;
  const isWarning = !isSafe && percentage >= required - 5;

  // Color tokens
  const pctColor      = isSafe ? '#0F6E56' : isWarning ? '#BA7517' : '#A32D2D';
  const barColor      = isSafe ? '#0F6E56' : isWarning ? '#BA7517' : '#A32D2D';
  const statusBg      = isSafe ? '#E1F5EE' : '#FCEBEB';
  const statusIconCol = isSafe ? '#0F6E56' : '#A32D2D';

  // Status message
  const statusMsg = isSafe
    ? bunkAllowance > 0
      ? `You can skip ${bunkAllowance} more class${bunkAllowance > 1 ? 'es' : ''}`
      : 'Just at the limit — don\'t miss any'
    : recoveryDate === 'Impossible'
      ? 'Goal unreachable this semester'
      : recoveryDate === 'Set semester end to see date' || recoveryDate === 'Add schedule to see date'
        ? recoveryDate
        : `Attend ${nextClassesToSafe} more to recover (by ${recoveryDate})`;

  const isUpdating = useStore(state => state.updatingAttendance[subject._id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      whileHover={{ y: -2 }}
      style={{ ...card.wrap, opacity: isUpdating ? 0.7 : 1 }}
      className="group"
    >
      {/* ── TOP ROW: name + percentage ── */}
      <div style={card.topRow}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Color dot */}
            <div style={{ ...card.colorDot, background: subject.color || '#888' }} />
            <h3 style={card.name} className="truncate">{subject.name}</h3>
            {onEdit && (
              <button
                onClick={() => onEdit(subject)}
                style={card.editBtn}
                className="opacity-0 group-hover:opacity-100 hover:bg-bg transition-all"
              >
                <Edit3 size={12} />
              </button>
            )}
          </div>
          <p style={card.target}>Target: {required}%</p>
        </div>

        <div style={{ ...card.pctBadge, color: pctColor, borderColor: pctColor + '30', background: pctColor + '0d' }}>
          {pct}%
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={card.progressSection}>
        <div style={card.progressMeta}>
          <span style={card.metaLabel}>Attendance</span>
          <span style={card.metaValue}>{subject.attended} / {subject.total} classes</span>
        </div>
        <div style={card.trackWrap}>
          {/* Required threshold marker */}
          <div style={{ ...card.marker, left: `${required}%` }} />
          <div style={card.track}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percentage)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ ...card.bar, background: barColor }}
            />
          </div>
        </div>
      </div>

      {/* ── STATUS CHIP ── */}
      <div style={{ ...card.statusChip, background: statusBg }}>
        <div style={{ ...card.statusIcon, color: statusIconCol }}>
          {isSafe
            ? <CheckCircle2 size={14} />
            : <Zap size={14} />
          }
        </div>
        <p style={card.statusMsg}>{statusMsg}</p>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={card.actions}>
        <button
          onClick={() => onMark(subject._id, 'Present')}
          disabled={isUpdating}
          style={card.btnPresent}
          className="hover:opacity-90 active:scale-95 transition-all text-[13px]"
        >
          ✓ Present
        </button>
        <button
          onClick={() => onMark(subject._id, 'Absent')}
          disabled={isUpdating}
          style={card.btnAbsent}
          className="hover:bg-bg active:scale-95 transition-all text-[13px]"
        >
          ✗ Absent
        </button>
        
        <div className="relative group/more">
          <button
            disabled={isUpdating}
            style={card.btnChevron}
            className="hover:bg-bg transition-all"
          >
            <ChevronDown size={14} />
          </button>
          
          <div className="absolute right-0 bottom-full mb-1 bg-card-bg border border-border rounded-lg shadow-xl py-1 z-50 opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all w-32 overflow-hidden">
            <button onClick={() => onMark(subject._id, 'Medical')} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-primary/5 text-primary border-b border-border/50">Medical Leave</button>
            <button onClick={() => onMark(subject._id, 'OD')} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-accent/5 text-accent border-b border-border/50">Duty (OD)</button>
            <button onClick={() => onMark(subject._id, 'Cancelled')} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 border-b border-border/50">Cancelled</button>
            {onUndo && (
              <button onClick={() => onUndo(subject._id)} className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 text-subtext">Undo last</button>
            )}
          </div>
        </div>
      </div>

      {onOpenRegister && (
        <button
          onClick={() => onOpenRegister(subject)}
          style={card.btnRegister}
          className="hover:bg-bg active:scale-95 transition-all mt-2"
        >
          <CalendarDays size={14} /> View Register
        </button>
      )}
    </motion.div>
  );
};

const card = {
  wrap: {
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 20,
    padding:      '20px',
    display:      'flex',
    flexDirection:'column',
    gap:          16,
    cursor:       'default',
    boxShadow:    '0 4px 20px rgba(0,0,0,0.02)',
    transition:   'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Top row
  topRow: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        8,
  },
  colorDot: {
    width:       8,
    height:      8,
    borderRadius:'50%',
    flexShrink:  0,
    marginTop:   6,
  },
  name: {
    fontSize:   15,
    fontWeight: 700,
    color:      'var(--text)',
    margin:     0,
    lineHeight: 1.3,
  },
  target: {
    fontSize:    10,
    color:       'var(--subtext)',
    marginTop:   3,
    letterSpacing:'0.04em',
  },
  editBtn: {
    width:          24,
    height:         24,
    borderRadius:   6,
    border:         '0.5px solid var(--border)',
    background:     'transparent',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    color:          'var(--subtext)',
    flexShrink:     0,
  },
  pctBadge: {
    fontSize:     18,
    fontWeight:   700,
    fontFamily:   'var(--font-serif, Georgia, serif)',
    padding:      '4px 10px',
    borderRadius: 8,
    border:       '1px solid',
    flexShrink:   0,
    lineHeight:   1.2,
  },

  // Progress
  progressSection: {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
  },
  progressMeta: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  metaLabel: { fontSize: 10, color: 'var(--subtext)', letterSpacing: '0.06em' },
  metaValue: { fontSize: 10, color: 'var(--text)', fontWeight: 500 },
  trackWrap: { position: 'relative', paddingTop: 4 },
  track: {
    height:       5,
    borderRadius: 99,
    background:   'var(--border)',
    overflow:     'hidden',
  },
  bar: {
    height:       '100%',
    borderRadius: 99,
  },
  // Required threshold tick mark
  marker: {
    position:   'absolute',
    top:        0,
    width:      1.5,
    height:     13,
    background: 'var(--border)',
    borderRadius: 1,
    transform:  'translateX(-50%)',
    zIndex:     1,
  },

  // Status chip
  statusChip: {
    borderRadius: 10,
    padding:      '10px 12px',
    display:      'flex',
    alignItems:   'flex-start',
    gap:          8,
  },
  statusIcon: {
    flexShrink: 0,
    marginTop:  1,
  },
  statusMsg: {
    fontSize:   12,
    color:      'var(--text)',
    margin:     0,
    lineHeight: 1.5,
  },

  // Buttons
  actions: {
    display: 'flex',
    gap:     10,
    marginTop: 4,
  },
  btnPresent: {
    flex:        1.2,
    padding:     '12px 0',
    borderRadius: 12,
    border:      'none',
    background:  'var(--primary)',
    color:       '#fff',
    fontSize:    13,
    fontWeight:  700,
    cursor:      'pointer',
    letterSpacing: '0.02em',
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    gap:         6,
  },
  btnAbsent: {
    flex:         1,
    padding:      '12px 0',
    borderRadius: 12,
    border:       '0.5px solid var(--border)',
    background:   'var(--card-bg)',
    color:        'var(--subtext)',
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
    letterSpacing:'0.02em',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    gap:          6,
  },
  btnChevron: {
    width:          44,
    height:         44,
    flexShrink:     0,
    borderRadius:   12,
    border:         '0.5px solid var(--border)',
    background:     'var(--card-bg)',
    color:          'var(--subtext)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
  },
  btnUndo: {
    width:          40,
    flexShrink:     0,
    borderRadius:   10,
    border:         '0.5px solid var(--border)',
    background:     'var(--card-bg)',
    color:          'var(--subtext)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
  },
  btnRegister: {
    width:          '100%',
    padding:        '10px 0',
    borderRadius:   10,
    border:         '0.5px dashed var(--border)',
    background:     'var(--bg)',
    color:          'var(--text)',
    fontSize:       12,
    fontWeight:     700,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    cursor:         'pointer',
  },
};

export default SubjectCard;