import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Moon, Sun, Download, Calendar,
  Trash2, Plus, Sparkles, Zap, ShieldCheck, FileText
} from 'lucide-react';
import useStore from '../store/useStore';

import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const Settings = () => {
  const navigate = useNavigate();
  const {
    user, subjects, theme, toggleTheme,
    holidays, fetchHolidays, addHoliday, deleteHoliday,
    extraClasses, fetchExtraClasses, addExtraClass, deleteExtraClass,
    logout
  } = useStore();

  const [holidayDate,  setHolidayDate]  = useState('');
  const [holidayLabel, setHolidayLabel] = useState('');
  const [extraDate,    setExtraDate]    = useState('');
  const [followsDay,   setFollowsDay]   = useState('Monday');

  useEffect(() => {
    fetchHolidays();
    fetchExtraClasses();
  }, [fetchHolidays, fetchExtraClasses]);

  const handleAddHoliday = async () => {
    if (!holidayDate) return;
    await addHoliday(holidayDate, holidayLabel || 'Holiday');
    setHolidayDate('');
    setHolidayLabel('');
  };

  const handleAddExtra = async () => {
    if (!extraDate) return;
    await addExtraClass(extraDate, followsDay);
    setExtraDate('');
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(0, 122, 255);
    doc.text('SmartAttend Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(142, 142, 147);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 14, 28);
    doc.text(`Student: ${user?.name || 'Scholar'}`, 14, 34);
    doc.setDrawColor(242, 242, 247);
    doc.line(14, 40, 196, 40);
    let y = 50;
    doc.setFontSize(11);
    doc.setTextColor(28, 28, 30);
    doc.setFont(undefined, 'bold');
    const headers   = ['Subject', 'Attended', 'Total', 'Pct', 'Target'];
    const colWidths = [60, 30, 30, 30, 30];
    let x = 14;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 10;
    doc.setFont(undefined, 'normal');
    subjects.forEach(s => {
      const pct = s.total > 0 ? (s.attended / s.total) * 100 : 0;
      x = 14;
      [s.name, String(s.attended), String(s.total), `${pct.toFixed(0)}%`, `${s.requiredAttendance}%`]
        .forEach((cell, i) => { doc.text(cell, x, y); x += colWidths[i]; });
      y += 8;
    });
    doc.save(`SmartAttend_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isDark = theme === 'dark';

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">
      <div style={pg.page}>

        {/* ── HEADER ── */}
        <div style={{ paddingTop: 8 }}>
          <h1 style={pg.title}>Settings</h1>
          <p style={pg.subtitle}>Manage your account, theme, and academic calendar.</p>
        </div>

        <div style={pg.grid}>

          {/* ── PROFILE ── */}
          <Section icon={<ShieldCheck size={18} style={{ color: 'var(--primary,#007aff)' }} />} iconBg="rgba(0,122,255,0.08)" title="Profile" subtitle="Your account details">
            <InfoRow label="Name"  value={user?.name  || '—'} />
            <InfoRow label="Email" value={user?.email || '—'} />
          </Section>

          {/* ── THEME ── */}
          <Section icon={<Sparkles size={18} style={{ color: '#0F6E56' }} />} iconBg="rgba(15,110,86,0.08)" title="Appearance" subtitle="Light or dark mode">
            <div style={s.themeRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...s.themeIcon, background: isDark ? '#0f0e0d' : '#fff', border: '0.5px solid #e3e0da' }}>
                  {isDark
                    ? <Moon  size={16} style={{ color: '#fff' }} />
                    : <Sun   size={16} style={{ color: '#BA7517' }} />
                  }
                </div>
                <div>
                  <p style={s.themeLabel}>{isDark ? 'Dark mode' : 'Light mode'}</p>
                  <p style={s.themeSub}>Current interface theme</p>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  ...s.toggle,
                  background: isDark ? 'var(--primary,#007aff)' : '#e3e0da',
                }}
              >
                <div style={{
                  ...s.toggleKnob,
                  transform: isDark ? 'translateX(22px)' : 'translateX(0)',
                }} />
              </button>
            </div>
          </Section>

          {/* ── CALENDAR — full width ── */}
          <div style={{ ...s.card, gridColumn: '1 / -1' }}>
            <div style={s.cardHeader}>
              <div style={{ ...s.iconWrap, background: 'rgba(186,117,23,0.08)' }}>
                <Calendar size={18} style={{ color: '#BA7517' }} />
              </div>
              <div>
                <h2 style={s.cardTitle}>Academic Calendar</h2>
                <p style={s.cardSub}>Holidays and schedule overrides</p>
              </div>
            </div>

            <div style={s.calGrid}>
              {/* Left: forms */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Holiday form */}
                <div style={s.subSection}>
                  <p style={s.subSectionLabel}>Add holiday</p>
                  <div style={s.formRow}>
                    <Field label="Date">
                      <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} style={s.input} className="focus:border-warning/40" />
                    </Field>
                    <Field label="Label">
                      <input type="text" value={holidayLabel} onChange={e => setHolidayLabel(e.target.value)} placeholder="e.g. Diwali" style={s.input} className="focus:border-warning/40" />
                    </Field>
                  </div>
                  <button onClick={handleAddHoliday} style={{ ...s.addBtn, background: 'rgba(186,117,23,0.08)', color: '#BA7517', border: '0.5px solid rgba(186,117,23,0.2)' }} className="hover:opacity-80 active:scale-95 transition-all">
                    <Plus size={13} /> Add holiday
                  </button>
                </div>

                {/* Override form */}
                <div style={s.subSection}>
                  <p style={s.subSectionLabel}>Schedule override</p>
                  <p style={s.subSectionHint}>Make a date follow a different day's timetable.</p>
                  <div style={s.formRow}>
                    <Field label="Date">
                      <input type="date" value={extraDate} onChange={e => setExtraDate(e.target.value)} style={s.input} className="focus:border-primary/40" />
                    </Field>
                    <Field label="Follows day">
                      <select value={followsDay} onChange={e => setFollowsDay(e.target.value)} style={s.input}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>
                  </div>
                  <button onClick={handleAddExtra} style={{ ...s.addBtn, background: 'rgba(0,122,255,0.08)', color: 'var(--primary,#007aff)', border: '0.5px solid rgba(0,122,255,0.2)' }} className="hover:opacity-80 active:scale-95 transition-all">
                    <Plus size={13} /> Add override
                  </button>
                </div>
              </div>

              {/* Right: list */}
              <div style={s.listPanel}>
                {holidays.length === 0 && extraClasses.length === 0 ? (
                  <div style={s.emptyList}>
                    <Calendar size={20} style={{ color: '#c8c5bf', marginBottom: 8 }} />
                    <p style={{ fontSize: 12, color: '#b0ada8' }}>No holidays or overrides yet</p>
                  </div>
                ) : (
                  <>
                    {holidays.length > 0 && (
                      <div>
                        <p style={s.listGroupLabel}>Holidays</p>
                        <AnimatePresence mode="popLayout">
                          {holidays.map(h => (
                            <CalendarItem
                              key={h._id}
                              title={h.label}
                              date={h.date}
                              accentColor="#BA7517"
                              onDelete={() => deleteHoliday(h._id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                    {extraClasses.length > 0 && (
                      <div style={{ marginTop: holidays.length > 0 ? 16 : 0 }}>
                        <p style={s.listGroupLabel}>Overrides</p>
                        <AnimatePresence mode="popLayout">
                          {extraClasses.map(ec => (
                            <CalendarItem
                              key={ec._id}
                              title={`Follows ${ec.followsDay}`}
                              date={ec.date}
                              accentColor="var(--primary,#007aff)"
                              onDelete={() => deleteExtraClass(ec._id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── EXPORT ── */}
          <div style={{ ...s.card, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ ...s.iconWrap, background: 'rgba(0,122,255,0.08)', width: 48, height: 48 }}>
                <FileText size={20} style={{ color: 'var(--primary,#007aff)' }} />
              </div>
              <div>
                <h2 style={s.cardTitle}>Export report</h2>
                <p style={s.cardSub}>Download a PDF of all your attendance data</p>
              </div>
            </div>
            <button
              onClick={exportToPDF}
              style={s.exportBtn}
              className="hover:opacity-90 active:scale-95 transition-all"
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>

          {/* ── LOGOUT (Mobile specific) ── */}
          <div className="lg:hidden mt-4">
             <button
               onClick={() => { logout(); navigate('/login'); }}
               style={{ ...s.card, color: '#A32D2D', fontWeight: 700, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
               className="hover:bg-danger/5 transition-all active:scale-95"
             >
               <Zap size={16} /> Logout Account
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Small shared components ──

const Section = ({ icon, iconBg, title, subtitle, children }) => (
  <div style={s.card}>
    <div style={s.cardHeader}>
      <div style={{ ...s.iconWrap, background: iconBg }}>{icon}</div>
      <div>
        <h2 style={s.cardTitle}>{title}</h2>
        <p style={s.cardSub}>{subtitle}</p>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {children}
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={s.infoRow}>
    <span style={s.infoLabel}>{label}</span>
    <span style={s.infoValue} className="truncate">{value}</span>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
    <label style={s.fieldLabel}>{label}</label>
    {children}
  </div>
);

const CalendarItem = ({ title, date, accentColor, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    style={s.calItem}
  >
    <div style={{ ...s.calStripe, background: accentColor }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={s.calTitle}>{title}</p>
      <p style={s.calDate}>{new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
    </div>
    <button
      onClick={onDelete}
      style={s.deleteBtn}
      className="hover:bg-danger/10 hover:text-danger transition-all"
    >
      <Trash2 size={13} />
    </button>
  </motion.div>
);

// ── Styles ──
const pg = {
  page: {
    padding:       '24px 16px',
    maxWidth:      1100,
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column',
    gap:           24,
  },
  title:    { fontSize: 26, fontWeight: 800, color: '#0f0e0d', margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#8c8a87', marginTop: 4 },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap:                 16,
  },
};

const s = {
  card: {
    background:   '#fff',
    border:       '0.5px solid #e3e0da',
    borderRadius: 14,
    padding:      '20px',
    display:      'flex',
    flexDirection:'column',
    gap:          16,
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width:          38,
    height:         38,
    borderRadius:   9,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#0f0e0d', margin: 0 },
  cardSub:   { fontSize: 11, color: '#b0ada8', marginTop: 2 },

  infoRow: {
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 8,
    padding:      '10px 14px',
    display:      'flex',
    flexDirection:'column',
    gap:          3,
  },
  infoLabel: { fontSize: 9, color: '#b0ada8', letterSpacing: '0.08em', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: 600, color: '#0f0e0d' },

  themeRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    background:     '#faf9f7',
    border:         '0.5px solid #e3e0da',
    borderRadius:   10,
    padding:        '12px 14px',
  },
  themeIcon: {
    width:          34,
    height:         34,
    borderRadius:   8,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  themeLabel: { fontSize: 13, fontWeight: 600, color: '#0f0e0d', margin: 0 },
  themeSub:   { fontSize: 10, color: '#b0ada8', marginTop: 2 },
  toggle: {
    width:        44,
    height:       24,
    borderRadius: 99,
    border:       'none',
    cursor:       'pointer',
    padding:      2,
    flexShrink:   0,
    transition:   'background 0.25s',
    position:     'relative',
    display:      'flex',
    alignItems:   'center',
  },
  toggleKnob: {
    width:         20,
    height:        20,
    background:    '#fff',
    borderRadius:  '50%',
    boxShadow:     '0 1px 3px rgba(0,0,0,0.2)',
    transition:    'transform 0.25s',
    position:      'absolute',
    left:          2,
  },

  calGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap:                 20,
  },
  subSection: {
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 10,
    padding:      '14px',
    display:      'flex',
    flexDirection:'column',
    gap:          10,
  },
  subSectionLabel: { fontSize: 12, fontWeight: 700, color: '#0f0e0d' },
  subSectionHint:  { fontSize: 11, color: '#b0ada8', marginTop: -4 },
  formRow:   { display: 'flex', gap: 10, flexWrap: 'wrap' },
  fieldLabel:{ fontSize: 9, color: '#b0ada8', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    width:        '100%',
    background:   '#fff',
    border:       '0.5px solid #e3e0da',
    borderRadius: 7,
    padding:      '8px 10px',
    fontSize:     12,
    fontWeight:   600,
    color:        '#0f0e0d',
    outline:      'none',
    boxSizing:    'border-box',
    transition:   'border-color 0.15s',
    appearance:   'none',
  },
  addBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          6,
    padding:      '8px 14px',
    borderRadius: 8,
    border:       '0.5px solid',
    fontSize:     12,
    fontWeight:   700,
    cursor:       'pointer',
    width:        'fit-content',
  },

  listPanel: {
    borderLeft:   '0.5px solid #f2f0ec',
    paddingLeft:  20,
    maxHeight:    380,
    overflowY:    'auto',
  },
  listGroupLabel: {
    fontSize:      9,
    color:         '#b0ada8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom:  8,
  },
  emptyList: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    height:         160,
    textAlign:      'center',
  },
  calItem: {
    display:      'flex',
    alignItems:   'center',
    gap:          10,
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 8,
    padding:      '10px 12px',
    marginBottom: 6,
    position:     'relative',
    overflow:     'hidden',
  },
  calStripe:  { width: 3, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: '3px 0 0 3px' },
  calTitle:   { fontSize: 12, fontWeight: 600, color: '#0f0e0d', margin: 0, paddingLeft: 6 },
  calDate:    { fontSize: 10, color: '#b0ada8', marginTop: 2, paddingLeft: 6 },
  deleteBtn: {
    width:          28,
    height:         28,
    borderRadius:   7,
    border:         'none',
    background:     'transparent',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    color:          '#b0ada8',
    flexShrink:     0,
  },

  exportBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    padding:      '11px 20px',
    borderRadius: 10,
    border:       'none',
    background:   'var(--primary,#007aff)',
    color:        '#fff',
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
    whiteSpace:   'nowrap',
  },
};

export default Settings;