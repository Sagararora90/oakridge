import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Moon, Sun, Download, Calendar,
  Trash2, Plus, Sparkles, Zap, ShieldCheck,
  FileText, ChevronRight, LogOut, GraduationCap,
  Bell, Palette
} from 'lucide-react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ─── Design tokens ───────────────────────────────────────────── */
const FONT = "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/* ─── Inject Styles ───────────────────────────────────────────── */
const STYLES = `
  .st-page {
    background: var(--color-bg);
    min-height: 100svh;
    font-family: ${FONT};
    padding-bottom: 40px;
  }

  /* ── Section card ── */
  .st-section {
    background: var(--color-card-bg);
    border-radius: 16px;
    border: 1px solid var(--color-border);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  /* ── Section header (sticky within card) ── */
  .st-section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px 10px;
  }
  .st-section-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--color-subtext);
    padding: 0 4px;
  }

  /* ── Row (inset grouped style) ── */
  .st-row {
    display: flex; align-items: center;
    padding: 0 16px;
    min-height: 52px;
    border-top: 1px solid var(--color-border);
    gap: 12px;
    transition: background 0.12s;
  }
  .st-row:first-of-type { border-top: none; }
  .st-row:hover { background: var(--color-surface); }
  .st-row-label {
    flex: 1;
    font-size: 14px; font-weight: 500;
    color: var(--color-text);
  }
  .st-row-value {
    font-size: 14px; font-weight: 500;
    color: var(--color-subtext);
    text-align: right; max-width: 180px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ── Toggle ── */
  .st-toggle {
    position: relative;
    width: 51px; height: 31px; border-radius: 99px;
    border: none; cursor: pointer;
    transition: background 0.25s;
    flex-shrink: 0;
    padding: 0;
  }
  .st-toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 27px; height: 27px;
    border-radius: 50%; background: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  /* ── Input ── */
  .st-input {
    width: 100%; padding: 11px 14px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    font-size: 14px; font-weight: 500;
    color: var(--color-text); font-family: inherit;
    outline: none; box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .st-input:focus { border-color: var(--color-primary); }
  .st-input::placeholder { color: var(--color-subtext); opacity: 0.5; }

  /* ── Button primary ── */
  .st-btn-primary {
    width: 100%; padding: 12px 0;
    background: var(--color-primary); color: white;
    border: none; border-radius: 12px;
    font-size: 14px; font-weight: 700;
    font-family: inherit; cursor: pointer;
    transition: filter 0.15s, transform 0.1s;
    box-shadow: var(--shadow-sm);
  }
  .st-btn-primary:hover { filter: brightness(1.06); }
  .st-btn-primary:active { transform: scale(0.98); }
  .st-btn-primary:disabled { opacity: 0.5; cursor: default; filter: none; }

  /* ── Button tinted ── */
  .st-btn-tinted {
    width: 100%; padding: 12px 0;
    background: var(--color-primary-lo); color: var(--color-primary);
    border: none; border-radius: 12px;
    font-size: 14px; font-weight: 700;
    font-family: inherit; cursor: pointer;
    transition: all 0.15s;
  }
  .st-btn-tinted:hover { background: var(--color-primary); color: white; }

  /* ── Button destructive ── */
  .st-btn-destructive {
    width: 100%; padding: 13px 0;
    background: transparent;
    border: 1px solid var(--color-danger);
    border-radius: 16px;
    color: var(--color-danger); font-size: 14px; font-weight: 700;
    font-family: inherit; cursor: pointer;
    transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .st-btn-destructive:hover { background: var(--color-danger-lo); }

  /* ── Calendar list item ── */
  .st-cal-item {
    display: flex; align-items: center;
    padding: 12px 16px; gap: 14px;
    border-top: 1px solid var(--color-border);
    transition: background 0.12s;
  }
  .st-cal-item:first-child { border-top: none; }
  .st-cal-item:hover { background: var(--color-surface); }

  /* ── Select ── */
  .st-select {
    width: 100%; padding: 11px 14px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    font-size: 14px; font-weight: 500;
    color: var(--color-text); font-family: inherit;
    outline: none; appearance: none;
    box-sizing: border-box;
  }

  /* ── Export card ── */
  .st-export-card {
    border-radius: 20px;
    border: 1px solid var(--color-border);
    padding: 22px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: var(--color-card-bg);
    box-shadow: var(--shadow-sm);
  }

  /* ── Profile avatar ── */
  .st-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), var(--color-success));
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 20px; font-weight: 700; color: white;
    letter-spacing: -0.02em;
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
  }

  /* ── Page header ── */
  .st-header {
    position: sticky; top: 0; z-index: 30;
    background: rgba(var(--bg-rgb), 0.7);
    backdrop-filter: saturate(180%) blur(24px);
    -webkit-backdrop-filter: saturate(180%) blur(24px);
    border-bottom: 1px solid var(--color-border);
    height: 56px; padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between;
  }

  .st-nav-title {
    font-size: 13px; font-weight: 600; color: var(--color-text);
  }
  .st-nav-sub {
    font-size: 13px; color: var(--color-subtext); font-weight: 400;
  }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('st-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'st-styles';
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

/* ─── Toggle component ─────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <button
      className="st-toggle"
      onClick={onChange}
      style={{ background: on ? 'var(--color-success)' : 'rgba(var(--bg-rgb), 0.2)' }}
    >
      <motion.div
        className="st-toggle-thumb"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
      />
    </button>
  );
}

/* ─── Section wrapper ───────────────────────────────────────────── */
function Section({ label, children }) {
  return (
    <div>
      {label && <div className="st-section-label" style={{ marginBottom: 6 }}>{label}</div>}
      <div className="st-section">{children}</div>
    </div>
  );
}

/* ─── Row ──────────────────────────────────────────────────────── */
function Row({ label, children, onClick, disclosure }) {
  return (
    <div
      className="st-row"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <span className="st-row-label">{label}</span>
      {children}
      {disclosure && <ChevronRight size={14} style={{ color: 'var(--color-subtext)', opacity: 0.4, flexShrink: 0 }} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Settings() {
  injectStyles();

  const navigate = useNavigate();
  const {
    user, subjects, theme, toggleTheme,
    holidays, fetchHolidays, addHoliday, deleteHoliday,
    extraClasses, fetchExtraClasses, addExtraClass, deleteExtraClass,
    logout, updateUserSettings,
  } = useStore();

  const [holidayDate, setHolidayDate] = useState('');
  const [holidayLabel, setHolidayLabel] = useState('');
  const [extraDate, setExtraDate] = useState('');
  const [followsDay, setFollowsDay] = useState('Monday');
  const [emailEnabled, setEmailEnabled] = useState(user?.notificationSettings?.emailEnabled || false);
  const [notifEmail, setNotifEmail] = useState(user?.notificationSettings?.notificationEmail || user?.email || '');
  const [savingNotif, setSavingNotif] = useState(false);
  const [showCalendarForm, setShowCalendarForm] = useState(false);

  useEffect(() => {
    fetchHolidays();
    fetchExtraClasses();
  }, [fetchHolidays, fetchExtraClasses]);

  const handleAddHoliday = async () => {
    if (!holidayDate) return;
    await addHoliday(holidayDate, holidayLabel || 'Holiday');
    setHolidayDate(''); setHolidayLabel('');
    toast.success('Holiday added');
  };

  const handleAddExtra = async () => {
    if (!extraDate) return;
    await addExtraClass(extraDate, followsDay);
    setExtraDate('');
    toast.success('Override added');
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(0, 113, 227);
    doc.text('Attendance Report', 14, 22);
    doc.setFontSize(10); doc.setTextColor(130, 130, 135);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 14, 30);
    doc.text(`Student: ${user?.name || 'Scholar'}`, 14, 36);
    doc.setDrawColor(220, 220, 225); doc.line(14, 42, 196, 42);
    let y = 52;
    doc.setFontSize(11); doc.setTextColor(20, 20, 22); doc.setFont(undefined, 'bold');
    const headers = ['Subject', 'Attended', 'Total', '%', 'Target'];
    const colW = [72, 28, 28, 26, 28];
    let x = 14;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colW[i]; });
    y += 10; doc.setFont(undefined, 'normal');
    subjects.forEach(s => {
      const p = s.total > 0 ? (s.attended / s.total) * 100 : 0;
      x = 14;
      [s.name, String(s.attended), String(s.total), `${p.toFixed(0)}%`, `${s.requiredAttendance}%`]
        .forEach((cell, i) => { doc.text(String(cell), x, y); x += colW[i]; });
      y += 8;
    });
    doc.save(`Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const calendarCount = (holidays?.length || 0) + (extraClasses?.length || 0);

  return (
    <div className="st-page">

      {/* ══ HEADER ══ */}
      <header className="st-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="st-nav-sub">Attend</span>
          <ChevronRight size={11} style={{ color: 'var(--color-subtext)', opacity: 0.4 }} />
          <span className="st-nav-title">Settings</span>
        </div>
      </header>

      {/* ══ CONTENT ══ */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── PROFILE ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 20px',
            background: 'var(--color-surface)',
            borderRadius: 16, border: '0.5px solid var(--color-border)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}
        >
          <div className="st-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
              {user?.name || 'Guest Student'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-subtext)', marginTop: 2, fontWeight: 400 }}>
              {user?.email || 'Not connected'}
            </div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 99,
            background: 'var(--color-success-lo)', color: 'var(--color-success)',
            fontSize: 11, fontWeight: 700,
          }}>
            Active
          </div>
        </motion.div>

        {/* ── APPEARANCE ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.04 }}>
          <Section label="Appearance">
            <Row
              label="Appearance"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="st-row-value">{theme === 'light' ? 'Light' : 'Dark'}</span>
                <Toggle on={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </Row>
          </Section>
        </motion.div>

        {/* ── NOTIFICATIONS ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <Section label="Notifications">
            <Row label="Email Alerts">
              <Toggle on={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
            </Row>
            <AnimatePresence>
              {emailEnabled && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 16px', borderTop: '0.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      type="email"
                      value={notifEmail}
                      onChange={e => setNotifEmail(e.target.value)}
                      placeholder="Notification email"
                      className="st-input"
                    />
                    <button
                      className="st-btn-primary"
                      disabled={savingNotif}
                      onClick={async () => {
                        setSavingNotif(true);
                        await updateUserSettings({ notificationSettings: { emailEnabled: true, notificationEmail: notifEmail } });
                        setSavingNotif(false);
                        toast.success('Saved');
                      }}
                    >
                      {savingNotif ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>
        </motion.div>

        {/* ── SCHEDULE ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}>
          <Section label="Schedule">
            <Row label="Timetable" onClick={() => navigate('/timetable')} disclosure>
              <span className="st-row-value">Edit slots</span>
            </Row>
          </Section>
        </motion.div>

        {/* ── ACADEMIC CALENDAR ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
          <div className="st-section-label" style={{ marginBottom: 6 }}>Academic Calendar</div>
          <div className="st-section">
            {/* Saved items */}
            {calendarCount === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Calendar size={20} style={{ color: 'var(--color-subtext)', opacity: 0.4, margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: 'var(--color-subtext)', fontWeight: 400 }}>No calendar items</div>
              </div>
            ) : (
              <>
                {holidays.map(h => (
                  <div key={h._id} className="st-cal-item">
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: 'var(--color-warning, #FF9F0A)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{h.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-subtext)', marginTop: 1 }}>
                        {new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => { deleteHoliday(h._id); toast.success('Removed'); }}
                      style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-subtext)', transition: 'color 0.15s, background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-subtext)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {extraClasses.map(ec => (
                  <div key={ec._id} className="st-cal-item">
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: 'var(--color-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>Follows {ec.followsDay}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-subtext)', marginTop: 1 }}>
                        {new Date(ec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => { deleteExtraClass(ec._id); toast.success('Removed'); }}
                      style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-subtext)', transition: 'color 0.15s, background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.background = 'var(--color-danger-lo)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-subtext)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Add button */}
            <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--color-border)' }}>
              <button
                className="st-btn-tinted"
                onClick={() => setShowCalendarForm(!showCalendarForm)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Plus size={14} /> Add Entry
              </button>
            </div>

            {/* Expandable forms */}
            <AnimatePresence>
              {showCalendarForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '0.5px solid var(--color-border)' }}>

                    {/* Holiday */}
                    <div style={{ paddingTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Holiday
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="st-input" />
                        <input type="text" value={holidayLabel} onChange={e => setHolidayLabel(e.target.value)} placeholder="e.g. Diwali" className="st-input" />
                      </div>
                      <button
                        className="st-btn-tinted"
                        onClick={handleAddHoliday}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Plus size={13} /> Add Holiday
                      </button>
                    </div>

                    {/* Schedule override */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Schedule Override
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <input type="date" value={extraDate} onChange={e => setExtraDate(e.target.value)} className="st-input" />
                        <select value={followsDay} onChange={e => setFollowsDay(e.target.value)} className="st-select">
                          {DAYS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <button
                        className="st-btn-tinted"
                        onClick={handleAddExtra}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Plus size={13} /> Add Override
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── EXPORT ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.20 }}>
          <div className="st-export-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--color-primary-lo)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Export Report</div>
                <div style={{ fontSize: 12, color: 'var(--color-subtext)', marginTop: 2 }}>Download as PDF</div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={exportToPDF}
               style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 10,
                background: 'var(--color-primary)', color: 'white',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                boxShadow: 'var(--shadow-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              <Download size={14} strokeWidth={2.5} />
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* ── LOGOUT ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }}>
          <button
            className="st-btn-destructive"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={15} strokeWidth={2} />
            Sign Out
          </button>
        </motion.div>

        {/* App version */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-subtext)', opacity: 0.4, fontWeight: 400 }}>
          Attend · Version 1.0
        </div>
      </div>
    </div>
  );
}