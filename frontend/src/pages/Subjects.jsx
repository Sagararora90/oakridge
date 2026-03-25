import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Calendar as CalendarIcon,
  Sparkles, Loader2, GraduationCap, ChevronRight,
  Check, PenLine, History, TrendingUp, AlertTriangle, BookOpen
} from 'lucide-react';
import useStore from '../store/useStore';
import AttendanceRegister from '../components/AttendanceRegister';
import toast from 'react-hot-toast';

/* ─── Font injection ─────────────────────────────────────────── */
function injectFonts() {
  if (typeof document === 'undefined' || document.getElementById('att-fonts')) return;
  const l = document.createElement('link');
  l.id = 'att-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap';
  document.head.appendChild(l);
}

const FONT = "'Sora', -apple-system, sans-serif";
const MONO = "'DM Mono', monospace";
const SP   = { type: 'spring', stiffness: 420, damping: 40 };

const PALETTE = [
  '#475569','#1E3A8A','#065F46','#92400E',
  '#991B1B','#3730A3','#5B21B6','#334155',
];

/* ─── Global CSS ─────────────────────────────────────────────── */
const STYLES = `
  .att-root * { box-sizing: border-box; }

  .att-card {
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    cursor: default;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.25s ease;
  }
  .att-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl) !important;
  }

  .att-icon-btn {
    width: 30px; height: 30px; border-radius: 9px;
    border: 0.5px solid var(--color-border); background: var(--color-surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--color-text); transition: all 0.2s;
    transition: all 0.2s ease;
  }
  .att-icon-btn:hover {
    background: var(--color-bg); color: var(--color-text);
    transform: scale(1.05);
  }
  .att-icon-btn:active { transform: scale(0.95); }

  .att-backdrop {
    position: fixed; inset: 0; z-index: 100;
    display: flex; align-items: flex-end; justify-content: center;
  }

  .att-sheet {
    position: relative; z-index: 1;
    width: 100%; max-width: 500px;
    border-radius: 28px 28px 0 0;
    font-family: inherit;
    display: flex; flex-direction: column;
    max-height: 94svh;
  }
  .att-scroll {
    overflow-y: auto; overscroll-behavior: contain;
    padding: 0 20px 44px; flex: 1;
  }
  .att-scroll::-webkit-scrollbar { display: none; }

  .att-field { display: flex; flex-direction: column; gap: 6px; }
  .att-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--color-subtext);
  }
  .att-input {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px; padding: 14px;
    font-size: 15px; font-weight: 600;
    color: var(--color-text); font-family: inherit; outline: none;
    transition: all 0.2s ease;
  }
  .att-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px var(--color-primary-lo);
  }
  .att-input-num {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 14px; padding: 14px;
    font-size: 28px; font-weight: 800; letter-spacing: -0.04em;
    color: var(--color-text); font-family: inherit; outline: none; width: 100%;
    transition: all 0.2s ease;
  }
  .att-input-num:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px var(--color-primary-lo);
  }

  .att-swatch {
    width: 34px; height: 34px; border-radius: 50%;
    border: none; cursor: pointer;
    transition: transform 0.15s, opacity 0.15s;
    flex-shrink: 0;
  }

  .att-handle {
    width: 40px; height: 4px; border-radius: 99px;
    background: rgba(255,255,255,0.18); margin: 12px auto 0;
  }

  @keyframes att-spin { to { transform: rotate(360deg); } }
  .att-spin { animation: att-spin 0.7s linear infinite; }

  .att-hpill {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 980px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    font-size: 12px; font-weight: 700;
    color: var(--color-subtext);
    cursor: pointer; white-space: nowrap; font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
  }
  .att-hpill:hover {
    background: var(--color-surface);
    border-color: var(--color-primary); color: var(--color-text);
  }

  /* progress bar */
  .att-bar-track {
    height: 4px; border-radius: 99px;
    background: rgba(255,255,255,0.08);
    position: relative; overflow: hidden;
  }
`;

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('att-styles')) return;
  const t = document.createElement('style');
  t.id = 'att-styles'; t.textContent = STYLES;
  document.head.appendChild(t);
}

/* ─── Utils ──────────────────────────────────────────────────── */
function useIsMobile(bp = 900) {
  const [m, setM] = useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : false);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}

function defaultForm() {
  return { name: '', professor: '', requiredAttendance: 75, color: '#0A84FF', initialAttended: 0, initialTotal: 0, initialDate: '' };
}

function pct(attended, total) {
  if (!total) return 0;
  const v = (attended / total) * 100;
  return Number.isInteger(v) ? v : Number(v.toFixed(1));
}

function statusOf(attended, total, req) {
  const p = pct(attended, total);
  if (!total) return { state: 'empty', label: 'No data', color: 'rgba(255,255,255,0.25)' };
  if (p >= req) return { state: 'safe', label: 'On track', color: '#30D158' };
  const gap = Math.ceil((req / 100 * total - attended) / (1 - req / 100));
  if (p >= req - 12) return { state: 'warn', label: `${gap} more needed`, color: '#FF9F0A' };
  return { state: 'bad', label: `${gap} to recover`, color: '#FF453A' };
}

function mix(hex, alpha) {
  if (!hex || hex.startsWith('var')) return `rgba(10,132,255,${alpha})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── Circular Progress Ring ─────────────────────────────────── */
function Ring({ value, color, size = 68, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - Math.min(1, value / 100)) }}
          transition={{ duration: 1.1, ease: [0.16,1,0.3,1] }}
          style={{ filter: `drop-shadow(0 0 2px ${mix(color, 0.3)})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
          letterSpacing: '-0.04em', lineHeight: 1, fontFamily: FONT,
        }}>{value}</span>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: 'var(--color-subtext)',
          letterSpacing: '0.02em', marginTop: 1,
        }}>%</span>
      </div>
    </div>
  );
}

/* ─── Course Card ─────────────────────────────────────────────── */
function CourseCard({ subject, onEdit, onOpenRegister, index }) {
  const {
    name, color = '#0A84FF',
    attended = 0, total = 0,
    requiredAttendance = 75,
    professor = '',
    odCount = 0, medicalCount = 0,
  } = subject;

  const p   = pct(attended, total);
  const st  = statusOf(attended, total, requiredAttendance);
  const canSkip  = (total > 0 && st.state === 'safe')
    ? Math.max(0, Math.floor(attended - requiredAttendance / 100 * total))
    : null;
  const needMore = (total > 0 && (st.state === 'warn' || st.state === 'bad'))
    ? Math.ceil((requiredAttendance / 100 * total - attended) / (1 - requiredAttendance / 100))
    : null;

  return (
    <motion.div
      className="att-card"
      variants={{
        hidden: { opacity: 0, y: 22, scale: 0.94 },
        show:   { opacity: 1, y: 0, scale: 1,
                  transition: { duration: 0.5, ease: [0.16,1,0.3,1], delay: index * 0.05 } },
      }}
      style={{
        background: 'var(--color-card-bg)',
        border: '0.5px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        paddingLeft: 4,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: 3, background: color,
        boxShadow: `1px 0 8px ${mix(color, 0.15)}`,
      }} />
      {/* ── Top: name + actions ── */}
      <div style={{ padding: '15px 15px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2,
              background: color, flexShrink: 0,
            }} />
            <span style={{
              fontSize: 16, fontWeight: 800, color: 'var(--color-text)',
              letterSpacing: '-0.04em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{name}</span>
          </div>
          {professor && (
            <div style={{ 
              fontSize: 11, color: 'var(--color-subtext)', paddingLeft: 14,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '0.01em', fontWeight: 500
            }}>
              {professor}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="att-icon-btn" onClick={() => onOpenRegister(subject)}>
            <History size={14} strokeWidth={2.5} />
          </button>
          <button className="att-icon-btn" onClick={() => onEdit(subject)}>
            <PenLine size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Middle: ring + big stats ── */}
      <div style={{ padding: '12px 15px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Ring value={p} color={color} size={68} stroke={5} />

        <div style={{ flex: 1 }}>
          {/* Attended / Total */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 22, fontWeight: 800, color: 'var(--color-text)',
              letterSpacing: '-0.04em', lineHeight: 1,
            }}>
              {attended}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: 0 }}> / {total}</span>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3,
            }}>
              Classes attended
            </div>
          </div>

          {/* Progress bar */}
          <div className="att-bar-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, p)}%` }}
              transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: index * 0.05 + 0.1 }}
              style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(90deg, ${color}, ${mix(color, 0.6)})`,
                borderRadius: 99,
                boxShadow: `0 0 6px ${mix(color, 0.5)}`,
              }}
            />
            {/* goal line */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              width: 1.5, left: `${requiredAttendance}%`,
              background: 'var(--color-primary)',
              opacity: 0.4,
              zIndex: 1
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            marginTop: 5, fontSize: 9, fontWeight: 700,
            color: 'var(--color-subtext)', fontFamily: MONO,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            goal {requiredAttendance}%
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ margin: '10px 15px 0', height: 0.5, background: 'var(--color-border)' }} />

      {/* ── Bottom: status + action chip ── */}
      <div style={{ padding: '10px 15px 15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        {/* Status chip */}
        <div style={{
          borderRadius: 14, padding: '10px 14px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)',
              letterSpacing: '0.06em', textTransform: 'uppercase'
            }}>Status</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            {st.label}
          </span>
        </div>

        {/* Skip / Need chip */}
        <div style={{
          borderRadius: 14, padding: '10px 14px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: 'var(--color-subtext)',
            letterSpacing: '0.06em', textTransform: 'uppercase'
          }}>
            {canSkip !== null ? 'Can skip' : 'Need more'}
          </span>
          <span style={{
            fontSize: 20, fontWeight: 800, color: 'var(--color-text)',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {canSkip !== null ? canSkip : (needMore ?? '—')}
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: 0 }}>
              {' '}classes
            </span>
          </span>
        </div>

        {/* OD / Med tags */}
        {(odCount > 0 || medicalCount > 0) && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6 }}>
            {odCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#FF9F0A',
                background: 'rgba(255,159,10,0.12)',
                padding: '2px 8px', borderRadius: 6,
              }}>OD · {odCount}</span>
            )}
            {medicalCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#64D2FF',
                background: 'rgba(100,210,255,0.12)',
                padding: '2px 8px', borderRadius: 6,
              }}>MED · {medicalCount}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Sheet Modal ────────────────────────────────────────────── */
function SubjectSheet({ editingId, subForm, setField, setSubForm, submitting, onSubmit, onClose }) {
  return (
    <div className="att-backdrop">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        }}
      />

      <motion.div
        className="att-sheet"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={SP}
        style={{
          background: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          boxShadow: 'var(--shadow-2xl)',
        }}
      >
        <div className="att-handle" />

        {/* Header */}
        <div style={{
          padding: '14px 22px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>
              {editingId ? 'Edit Course' : 'New Course'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {editingId ? 'Update course info' : 'Track a new subject'}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.93 }}
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: 'none', background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            }}
          >
            <X size={14} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Form */}
        <div className="att-scroll">
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20 }}>

            <div className="att-field">
              <span className="att-label">Subject Name</span>
              <input type="text" required autoFocus
                value={subForm.name} onChange={setField('name')}
                placeholder="e.g. Physics 101" className="att-input" />
            </div>

            <div className="att-field">
              <span className="att-label">Professor</span>
              <input type="text"
                value={subForm.professor} onChange={setField('professor')}
                placeholder="e.g. Dr. Sharma" className="att-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <div className="att-field">
                <span className="att-label">Attended</span>
                <input type="number" min="0"
                  value={subForm.initialAttended} onChange={setField('initialAttended')}
                  className="att-input-num" />
              </div>
              <div className="att-field">
                <span className="att-label">Total</span>
                <input type="number" min="0"
                  value={subForm.initialTotal} onChange={setField('initialTotal')}
                  className="att-input-num" />
              </div>
              <div className="att-field">
                <span className="att-label">Required %</span>
                <input type="number" min="0" max="100" required
                  value={subForm.requiredAttendance} onChange={setField('requiredAttendance')}
                  className="att-input-num" />
              </div>
              <div className="att-field">
                <span className="att-label">Start Date</span>
                <input type="date"
                  value={subForm.initialDate} onChange={setField('initialDate')}
                  className="att-input"
                  style={{ colorScheme: 'dark', fontSize: 13 }} />
              </div>
            </div>

            {/* Preview */}
            {subForm.name && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                style={{
                  borderRadius: 16, overflow: 'hidden',
                  background: `linear-gradient(135deg, ${mix(subForm.color, 0.18)}, ${mix(subForm.color, 0.06)})`,
                  border: `1px solid ${mix(subForm.color, 0.3)}`,
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: mix(subForm.color, 0.18),
                    border: `1px solid ${mix(subForm.color, 0.28)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={16} color={subForm.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                      {subForm.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Preview</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: subForm.color, fontFamily: MONO }}>
                  {subForm.requiredAttendance}%
                </div>
              </motion.div>
            )}

            {/* Colour picker */}
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10,
              }}>Colour</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {PALETTE.map(c => {
                  const sel = subForm.color === c;
                  return (
                    <motion.button
                      key={c} type="button"
                      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
                      onClick={() => setSubForm(f => ({ ...f, color: c }))}
                      className="att-swatch"
                      style={{
                        background: c,
                        opacity: sel ? 1 : 0.35,
                        outline: sel ? `2.5px solid ${c}` : '2.5px solid transparent',
                        outlineOffset: sel ? 3 : 0,
                        boxShadow: sel ? `0 4px 14px ${mix(c, 0.5)}` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={onClose}
                style={{
                  flex: 1, padding: '15px 0', borderRadius: 14,
                  border: 'none', background: 'rgba(255,255,255,0.07)',
                  color: '#fff', cursor: 'pointer', fontFamily: FONT,
                  fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                  transition: 'background 0.15s',
                }}>
                Cancel
              </button>
              <motion.button type="submit" disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.97 }}
                style={{
                  flex: 2, padding: '15px 0', borderRadius: 14,
                  border: 'none', background: subForm.color,
                  color: '#fff', cursor: 'pointer', fontFamily: FONT,
                  fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  opacity: submitting ? 0.7 : 1,
                  boxShadow: `0 4px 18px ${mix(subForm.color, 0.4)}`,
                  transition: 'box-shadow 0.2s',
                }}>
                {submitting
                  ? <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} className="att-spin" />
                  : <Check size={15} strokeWidth={2.5} />}
                {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Add Course'}
              </motion.button>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Subjects() {
  injectFonts();
  injectStyles();

  const {
    subjects: rawSubjects, semesterEndDate,
    fetchProjections, addSubject, updateSubject,
    markAttendance, undoAttendance,
    syncPortalAttendance, updateSemesterEndDate,
    loading: storeLoading,
  } = useStore();

  const subjects = [...rawSubjects].sort((a, b) => a.name.localeCompare(b.name));
  const isMobile = useIsMobile();

  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [editingId,       setEditingId]       = useState(null);
  const [subForm,         setSubForm]         = useState(defaultForm());
  const [submitting,      setSubmitting]      = useState(false);
  const [viewRegisterFor, setViewRegisterFor] = useState(null);
  const [markingDate,     setMarkingDate]     = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!storeLoading && subjects.length > 0) {
      const id = new URLSearchParams(window.location.search).get('view');
      if (id) {
        const t = subjects.find(s => s._id === id);
        if (t) { setViewRegisterFor(t); window.history.replaceState({}, '', window.location.pathname); }
      }
    }
  }, [storeLoading, subjects]);

  const displayDate = semesterEndDate
    ? new Date(semesterEndDate).toISOString().split('T')[0] : '';

  useEffect(() => { if (displayDate) fetchProjections(displayDate); }, [displayDate, fetchProjections]);

  const handlePortalSync = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('portal', file);
    const id = toast.loading('Syncing portal…');
    try { await syncPortalAttendance(fd); toast.success('Portal synced', { id }); }
    catch { toast.error('Sync failed', { id }); }
  };

  const openAdd = () => { setEditingId(null); setSubForm(defaultForm()); setIsModalOpen(true); };
  const openEdit = (sub) => {
    setEditingId(sub._id);
    setSubForm({
      name: sub.name, professor: sub.professor || '',
      requiredAttendance: sub.requiredAttendance, color: sub.color,
      initialAttended: sub.initialAttended || 0,
      initialTotal:    sub.initialTotal    || 0,
      initialDate: sub.initialDate ? new Date(sub.initialDate).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editingId) await updateSubject(editingId, subForm);
      else           await addSubject(subForm);
      setIsModalOpen(false);
      toast.success(editingId ? 'Course updated' : 'Course added');
    } catch { toast.error('Failed to save'); }
    finally { setSubmitting(false); }
  };

  const setField = field => e =>
    setSubForm(f => ({
      ...f,
      [field]: e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value,
    }));

  const safeCount = subjects.filter(s => pct(s.attended||0, s.total||0) >= (s.requiredAttendance||75)).length;
  const atRisk    = subjects.length - safeCount;
  const avgPct    = subjects.length
    ? Math.round(subjects.reduce((a, s) => a + pct(s.attended||0, s.total||0), 0) / subjects.length) : 0;

  /* ════ RENDER ════ */
  return (
    <div className="att-root" style={{
      background: 'var(--color-bg)',
      minHeight: '100svh',
      paddingBottom: isMobile ? 100 : 60,
      fontFamily: FONT,
    }}>

      {/* ══ HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(var(--bg-rgb), 0.82)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderBottom: '1px solid var(--color-border)',
        height: 58, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.05em', margin: 0 }}>
            Subjects
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <label className="att-hpill">
            <CalendarIcon size={13} style={{ color: 'var(--color-primary)' }} />
            <input
              type="date" value={markingDate}
              onChange={e => setMarkingDate(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, fontWeight: 700,
                color: 'var(--color-text)',
                fontFamily: FONT, cursor: 'pointer', padding: 0,
                width: isMobile ? '26px' : 'auto', colorScheme: 'dark',
              }}
            />
          </label>
          <label className="att-hpill">
            <CalendarIcon size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            {!isMobile && <span style={{ color: 'var(--color-subtext)', fontSize: 11, fontWeight: 500 }}>Sem End</span>}
            <input
              type="date" value={displayDate}
              onChange={e => updateSemesterEndDate(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, fontWeight: 600,
                color: displayDate ? 'var(--color-text)' : 'var(--color-subtext)',
                fontFamily: FONT, cursor: 'pointer', padding: 0,
                width: isMobile ? '26px' : 'auto', colorScheme: 'dark',
              }}
            />
          </label>

          <label className="att-hpill">
            {storeLoading
              ? <Loader2 size={13} className="att-spin" style={{ color: 'var(--color-primary)' }} />
              : <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />}
            {!isMobile && 'Sync Portal'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortalSync} disabled={storeLoading} />
          </label>

          <motion.button
            whileHover={{ scale: 1.04, translateY: -1 }} whileTap={{ scale: 0.96 }}
            onClick={openAdd}
            style={{
              background: 'var(--color-primary)', color: '#fff',
              borderRadius: 980, padding: isMobile ? '8px 14px' : '8px 18px',
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 2px 16px var(--color-primary-lo)',
              letterSpacing: '-0.02em', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            {isMobile ? 'Add' : 'Add Course'}
          </motion.button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={{ padding: isMobile ? '20px 14px' : '28px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}
            style={{
              paddingTop: 80, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 18, textAlign: 'center',
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: 'rgba(10,132,255,0.08)',
              border: '1px solid rgba(10,132,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={32} strokeWidth={1.4} style={{ color: '#0A84FF' }} />
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.05em' }}>
                No courses yet
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-subtext)', margin: '8px 0 0', lineHeight: 1.6, maxWidth: 240 }}>
                Add your first course to start tracking attendance.
              </p>
            </div>
            <motion.button
              onClick={openAdd} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '12px 26px', borderRadius: 14,
                fontSize: 14, fontWeight: 700,
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', cursor: 'pointer', marginTop: 12,
                letterSpacing: '-0.02em',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add First Course
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ── Summary row ── */}
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}
            >
              {[
                {
                  val: subjects.length, lbl: 'Total Courses',
                  accent: 'var(--color-primary)',
                  icon: <BookOpen size={15} color="var(--color-primary)" />,
                },
                {
                  val: `${avgPct}%`, lbl: 'Avg Attendance',
                  accent: avgPct >= 75 ? 'var(--color-success)' : 'var(--color-warning)',
                  icon: <TrendingUp size={15} color={avgPct >= 75 ? 'var(--color-success)' : 'var(--color-warning)'} />,
                },
                {
                  val: atRisk, lbl: 'At Risk',
                  accent: atRisk > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                  icon: atRisk > 0
                    ? <AlertTriangle size={15} color="var(--color-danger)" />
                    : <Check size={15} color="var(--color-success)" />,
                },
              ].map(({ val, lbl, accent, icon }) => (
                <div key={lbl} style={{
                  borderRadius: 18, padding: isMobile ? '10px 12px' : '14px 16px',
                  background: 'var(--color-card-bg)',
                  border: '0.5px solid var(--color-border)',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? 20 : 26, fontWeight: 800,
                      color: 'var(--color-text)', letterSpacing: '-0.05em', lineHeight: 1,
                    }}>{val}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: 'var(--color-subtext)',
                      letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 4,
                    }}>{lbl}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* ── Card grid ── */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              initial="hidden" animate="show"
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 14,
              }}
            >
              {subjects.map((subject, i) => (
                <CourseCard
                  key={subject._id}
                  subject={subject}
                  index={i}
                  onEdit={openEdit}
                  onOpenRegister={setViewRegisterFor}
                />
              ))}
            </motion.div>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewRegisterFor && (
          <AttendanceRegister 
            subject={viewRegisterFor} 
            targetDate={markingDate}
            onClose={() => setViewRegisterFor(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <SubjectSheet
            editingId={editingId} subForm={subForm}
            setField={setField} setSubForm={setSubForm}
            submitting={submitting} onSubmit={handleSubmit}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}