import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Save, Plus, Trash2, BookOpen } from 'lucide-react';
import useStore from '../store/useStore';
import TimetableUpload from '../components/TimetableUpload';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { subjects, timetable, updateTimetable } = useStore();
  const [localTimetable, setLocalTimetable] = useState(timetable || []);
  const [activeDay, setActiveDay]           = useState(DAYS[0]);
  const [saving, setSaving]                 = useState(false);
  const [saved, setSaved]                   = useState(false);

  // ── Helpers ──
  const handleAddSlot = (day) => {
    const next = localTimetable.map(d => ({ ...d, slots: [...d.slots] }));
    let dayEntry = next.find(d => d.day === day);
    if (!dayEntry) {
      dayEntry = { day, slots: [] };
      next.push(dayEntry);
    }
    dayEntry.slots.push({ time: '09:00 - 10:00', subject: subjects[0]?._id || '' });
    setLocalTimetable(next);
  };

  const handleRemoveSlot = (day, idx) => {
    const next = localTimetable.map(d =>
      d.day === day ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d
    );
    setLocalTimetable(next);
  };

  const handleSlotUpdate = (day, idx, field, value) => {
    const next = localTimetable.map(d => {
      if (d.day !== day) return d;
      const slots = d.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...d, slots };
    });
    setLocalTimetable(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTimetable(localTimetable);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  const currentSlots = localTimetable.find(d => d.day === activeDay)?.slots || [];

  // Short day labels for mobile tab bar
  const shortDay = (day) => day.substring(0, 3);

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">
      <div style={layout.page}>

        {/* ── HEADER ── */}
        <div style={layout.header}>
          <div>
            <h1 style={layout.title}>Timetable</h1>
            <p style={layout.subtitle}>Build and manage your weekly class schedule.</p>
          </div>
          <div style={layout.headerActions}>
            <TimetableUpload
              onComplete={() => setLocalTimetable(useStore.getState().timetable)}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...layout.saveBtn,
                opacity: saving ? 0.7 : 1,
                background: saved ? '#0F6E56' : 'var(--primary, #007aff)',
              }}
              className="active:scale-95 transition-all"
            >
              <Save size={15} />
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Schedule'}
            </button>
          </div>
        </div>

        {/* ── DAY TABS ── */}
        <div style={layout.dayBar}>
          {DAYS.map(day => {
            const slotCount = localTimetable.find(d => d.day === day)?.slots.length || 0;
            const isActive  = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  ...layout.dayTab,
                  background:  isActive ? 'var(--primary, #007aff)' : 'transparent',
                  color:       isActive ? '#fff' : '#8c8a87',
                  fontWeight:  isActive ? 700 : 500,
                }}
                className="transition-all hover:text-text"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{shortDay(day)}</span>
                {slotCount > 0 && (
                  <span style={{
                    ...layout.slotCount,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#f2f0ec',
                    color:      isActive ? '#fff' : '#8c8a87',
                  }}>
                    {slotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── DAY PANEL ── */}
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          style={layout.panel}
        >
          {/* Panel header */}
          <div style={layout.panelHeader}>
            <div style={layout.panelLeft}>
              <div style={layout.calIcon}>
                <Calendar size={18} style={{ color: 'var(--primary, #007aff)' }} />
              </div>
              <div>
                <h2 style={layout.panelDay}>{activeDay}</h2>
                <p style={layout.panelCount}>
                  {currentSlots.length === 0
                    ? 'No classes — free day'
                    : `${currentSlots.length} class${currentSlots.length > 1 ? 'es' : ''} scheduled`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAddSlot(activeDay)}
              style={layout.addBtn}
              className="hover:bg-bg active:scale-95 transition-all"
            >
              <Plus size={16} />
              Add class
            </button>
          </div>

          {/* Slot grid */}
          <div style={layout.slotGrid}>
            <AnimatePresence mode="popLayout">
              {currentSlots.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={layout.empty}
                >
                  <div style={layout.emptyIcon}>
                    <Clock size={24} style={{ color: '#c8c5bf' }} />
                  </div>
                  <p style={layout.emptyTitle}>No classes on {activeDay}</p>
                  <p style={layout.emptySub}>Tap "Add class" to create a slot, or use Smart Upload.</p>
                </motion.div>
              ) : (
                currentSlots.map((slot, idx) => {
                  const sub = subjects.find(s => s._id === slot.subject);
                  return (
                    <SlotCard
                      key={idx}
                      slot={slot}
                      idx={idx}
                      sub={sub}
                      subjects={subjects}
                      activeDay={activeDay}
                      onUpdate={handleSlotUpdate}
                      onRemove={handleRemoveSlot}
                    />
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

// ── Slot Card ──
const SlotCard = ({ slot, idx, sub, subjects, activeDay, onUpdate, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1  }}
    exit={{    opacity: 0, scale: 0.97 }}
    style={slot_s.wrap}
    className="group"
  >
    {/* Color stripe */}
    <div style={{ ...slot_s.stripe, background: sub?.color || '#e3e0da' }} />

    <div style={slot_s.inner}>
      {/* Row 1: time + delete */}
      <div style={slot_s.row}>
        <label style={slot_s.fieldLabel}>Time</label>
        <button
          onClick={() => onRemove(activeDay, idx)}
          style={slot_s.deleteBtn}
          className="opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger/5 transition-all"
          title="Remove slot"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div style={slot_s.inputWrap} className="focus-within:border-primary/40">
        <Clock size={13} style={{ color: '#b0ada8', flexShrink: 0 }} />
        <input
          type="text"
          value={slot.time}
          onChange={(e) => onUpdate(activeDay, idx, 'time', e.target.value)}
          placeholder="09:00 - 10:00"
          style={slot_s.input}
        />
      </div>

      {/* Row 2: subject */}
      <label style={{ ...slot_s.fieldLabel, marginTop: 10 }}>Subject</label>
      <div style={slot_s.inputWrap} className="focus-within:border-primary/40">
        <BookOpen size={13} style={{ color: '#b0ada8', flexShrink: 0 }} />
        <select
          value={slot.subject}
          onChange={(e) => onUpdate(activeDay, idx, 'subject', e.target.value)}
          style={slot_s.select}
        >
          <option value="">— Not mapped —</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Subject name pill */}
      {sub && (
        <div style={{ ...slot_s.subPill, background: (sub.color || '#888') + '18', color: sub.color || '#888' }}>
          {sub.name}
        </div>
      )}
    </div>
  </motion.div>
);

// ── Styles ──
const layout = {
  page: {
    padding:       '24px 16px',
    maxWidth:      1200,
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column',
    gap:           24,
  },
  header: {
    display:        'flex',
    flexWrap:       'wrap',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    gap:            16,
    paddingTop:     8,
  },
  title:    { fontSize: 26, fontWeight: 800, color: '#0f0e0d', margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#8c8a87', marginTop: 4 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  saveBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          6,
    padding:      '10px 18px',
    borderRadius: 10,
    border:       'none',
    color:        '#fff',
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
  },

  dayBar: {
    background:    '#fff',
    border:        '0.5px solid #e3e0da',
    borderRadius:  12,
    padding:       6,
    display:       'flex',
    gap:           4,
    overflowX:     'auto',
    flexWrap:      'nowrap',
  },
  dayTab: {
    flex:           '0 0 auto',
    padding:        '8px 16px',
    borderRadius:   8,
    border:         'none',
    fontSize:       13,
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    gap:            6,
    whiteSpace:     'nowrap',
  },
  slotCount: {
    fontSize:     10,
    fontWeight:   700,
    padding:      '1px 6px',
    borderRadius: 20,
    minWidth:     18,
    textAlign:    'center',
  },

  panel: {
    background:   '#fff',
    border:       '0.5px solid #e3e0da',
    borderRadius: 14,
    overflow:     'hidden',
    minHeight:    420,
  },
  panelHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '20px 24px',
    borderBottom:   '0.5px solid #f2f0ec',
    flexWrap:       'wrap',
    gap:            12,
  },
  panelLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  calIcon: {
    width:          42,
    height:         42,
    background:     'rgba(0,122,255,0.06)',
    borderRadius:   10,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    border:         '0.5px solid rgba(0,122,255,0.12)',
    flexShrink:     0,
  },
  panelDay:   { fontSize: 18, fontWeight: 700, color: '#0f0e0d', margin: 0 },
  panelCount: { fontSize: 11, color: '#b0ada8', marginTop: 2 },
  addBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          6,
    padding:      '9px 16px',
    borderRadius: 9,
    border:       '0.5px solid #e3e0da',
    background:   '#fff',
    color:        '#4a4845',
    fontSize:     13,
    fontWeight:   600,
    cursor:       'pointer',
  },

  slotGrid: {
    display:               'grid',
    gridTemplateColumns:   'repeat(auto-fill, minmax(240px, 1fr))',
    gap:                   16,
    padding:               24,
  },

  empty: {
    gridColumn:     '1 / -1',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '60px 24px',
    textAlign:      'center',
  },
  emptyIcon: {
    width:           56,
    height:          56,
    borderRadius:    14,
    background:      '#f5f4f1',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    14,
  },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: '#8c8a87', margin: 0 },
  emptySub:   { fontSize: 12, color: '#c8c5bf', marginTop: 6, maxWidth: 280 },
};

const slot_s = {
  wrap: {
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 12,
    overflow:     'hidden',
    position:     'relative',
  },
  stripe: {
    position: 'absolute',
    left:     0,
    top:      0,
    bottom:   0,
    width:    3,
  },
  inner: { padding: '14px 14px 14px 20px' },
  row:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: {
    fontSize:      10,
    color:         '#b0ada8',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display:       'block',
  },
  deleteBtn: {
    width:          26,
    height:         26,
    borderRadius:   6,
    border:         'none',
    background:     'transparent',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    color:          '#b0ada8',
  },
  inputWrap: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    background:   '#fff',
    border:       '0.5px solid #e3e0da',
    borderRadius: 8,
    padding:      '8px 10px',
    transition:   'border-color 0.15s',
    marginBottom: 2,
  },
  input: {
    flex:       1,
    border:     'none',
    background: 'transparent',
    fontSize:   13,
    fontWeight: 600,
    color:      '#0f0e0d',
    outline:    'none',
    minWidth:   0,
  },
  select: {
    flex:       1,
    border:     'none',
    background: 'transparent',
    fontSize:   13,
    fontWeight: 600,
    color:      '#0f0e0d',
    outline:    'none',
    appearance: 'none',
    cursor:     'pointer',
    minWidth:   0,
  },
  subPill: {
    marginTop:    8,
    display:      'inline-block',
    fontSize:     10,
    fontWeight:   600,
    padding:      '3px 8px',
    borderRadius: 20,
    maxWidth:     '100%',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
};

export default Timetable;