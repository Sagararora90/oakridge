import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Save, Edit3, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import useStore from '../store/useStore';

const STATUS_COLORS = {
  Present: { bg: '#E1F5EE', text: '#0F6E56', label: 'P' },
  Absent:  { bg: '#FDECEC', text: '#A32D2D', label: 'A' },
  Medical: { bg: '#EBF3FE', text: '#2166CC', label: 'ML' },
  OD:      { bg: '#F4EBFE', text: '#6B21CC', label: 'OD' }
};

const STATUS_CHOICES = ['Present', 'Absent', 'Medical', 'OD'];

const AttendanceRegister = ({ subject, onClose }) => {
  const { setBaselineSnapshot, editDailyLog } = useStore();
  const [snapshotMode, setSnapshotMode] = useState(!subject.initialDate);
  const [snapDate, setSnapDate] = useState(subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [snapTotal, setSnapTotal] = useState(subject.initialTotal || 0);
  const [snapAttended, setSnapAttended] = useState(subject.initialAttended || 0);
  const [editingLogDate, setEditingLogDate] = useState(null);
  
  // For adding a new log
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLogStatus, setNewLogStatus] = useState('Present');
  const [logError, setLogError] = useState('');

  const handleSaveSnapshot = async (e) => {
    e.preventDefault();
    await setBaselineSnapshot(subject._id, {
      initialDate: snapDate,
      initialTotal: Number(snapTotal),
      initialAttended: Number(snapAttended)
    });
    setSnapshotMode(false);
  };

  const handleSaveLog = async (date, status) => {
    try {
      setLogError('');
      await editDailyLog(subject._id, { date, status });
      setEditingLogDate(null);
      setIsAddingLog(false);
    } catch (err) {
      setLogError(err.response?.data?.message || 'Failed to save log');
    }
  };

  const sortedLogs = useMemo(() => {
    if (!subject.attendanceRecords) return [];
    const baseDateStr = subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : null;
    return [...subject.attendanceRecords]
      .filter(log => log.date && (!baseDateStr || new Date(log.date).toISOString().split('T')[0] >= baseDateStr))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [subject.attendanceRecords, subject.initialDate]);

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
            <h2 style={modal.title}>{subject.name} Register</h2>
            <p style={modal.subtitle}>
              Attended: <strong>{subject.attended}</strong> / {subject.total} 
              <span style={{ marginLeft: 8, color: 'var(--primary, #007aff)' }}>
                ({subject.total > 0 ? ((subject.attended / subject.total) * 100).toFixed(1) : 0}%)
              </span>
            </p>
          </div>
          <button onClick={onClose} style={modal.closeBtn} className="hover:bg-bg transition-all">
            <X size={15} />
          </button>
        </div>

        <div style={modal.body}>
          {/* BASELINE SNAPSHOT SECTION */}
          {snapshotMode ? (
            <form onSubmit={handleSaveSnapshot} style={snapshotForm.wrap}>
              <div style={snapshotForm.header}>
                <Lock size={14} style={{ color: '#8c8a87' }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#4a4845' }}>Set Baseline Snapshot</span>
              </div>
              <p style={{ fontSize: 11, color: '#8c8a87', marginBottom: 16 }}>
                Enter the official attendance shown by the university. Logs before this date will be locked.
              </p>
              
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={snapshotForm.label}>Snapshot Date</label>
                  <input 
                    type="date" 
                    value={snapDate} 
                    onChange={e => setSnapDate(e.target.value)} 
                    style={snapshotForm.input} 
                    required 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={snapshotForm.label}>Attended Classes</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={snapAttended} 
                    onChange={e => setSnapAttended(e.target.value)} 
                    style={snapshotForm.input} 
                    required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={snapshotForm.label}>Total Classes</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={snapTotal} 
                    onChange={e => setSnapTotal(e.target.value)} 
                    style={snapshotForm.input} 
                    required 
                  />
                </div>
              </div>
              <button type="submit" style={snapshotForm.saveBtn} className="hover:opacity-90 active:scale-95">
                <Save size={14} style={{ marginRight: 6 }} /> Save Baseline
              </button>
            </form>
          ) : (
            <div style={timeline.wrap}>
              {/* Snapshot Display Header */}
              {subject.initialDate && (
                <div style={timeline.snapshotEntry}>
                  <div style={timeline.dateBox}>
                    <Lock size={12} style={{ color: '#8c8a87' }} />
                    {new Date(subject.initialDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#4a4845' }}>Baseline Snapshot</p>
                    <p style={{ fontSize: 11, color: '#8c8a87' }}>Official Start Point</p>
                  </div>
                  <div style={timeline.snapshotStats}>
                    {subject.initialAttended} / {subject.initialTotal}
                  </div>
                  <button onClick={() => setSnapshotMode(true)} style={timeline.editBtn}>
                    <Edit3 size={14} />
                  </button>
                </div>
              )}

              {/* Explainer Callout */}
              {subject.initialDate && (
                <div style={{ background: '#f5f4f1', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #0F6E56', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                   <AlertCircle size={14} style={{ color: '#0F6E56', marginTop: 2, flexShrink: 0 }} />
                   <div>
                     <p style={{ fontSize: 11, fontWeight: 600, color: '#4a4845', margin: 0 }}>How this works</p>
                     <p style={{ fontSize: 11, color: '#8c8a87', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                       Your attendance is calculated specifically from the Baseline Snapshot above. 
                       <br/>Any manual logs <b>before</b> this date are locked and ignored to prevent double-counting with the University portal.
                     </p>
                   </div>
                </div>
              )}

              {/* Add Log Button */}
              {!isAddingLog && (
                 <button onClick={() => setIsAddingLog(true)} style={timeline.addBtn} className="hover:bg-bg transition-all">
                    <Plus size={14} style={{ marginRight: 6 }} /> Add Daily Log
                 </button>
              )}

              {/* Add Log Form */}
              {isAddingLog && (
                <div style={timeline.addForm}>
                  <input 
                    type="date" 
                    value={newLogDate} 
                    onChange={e => setNewLogDate(e.target.value)} 
                    style={timeline.dateInput} 
                    min={subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : undefined}
                  />
                  <select 
                    value={newLogStatus} 
                    onChange={e => setNewLogStatus(e.target.value)}
                    style={timeline.selectInput}
                  >
                    {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleSaveLog(newLogDate, newLogStatus)} style={timeline.actionBtn}>
                      <CheckCircle2 size={16} style={{ color: '#0F6E56' }} />
                    </button>
                    <button onClick={() => setIsAddingLog(false)} style={timeline.actionBtn}>
                      <X size={16} style={{ color: '#A32D2D' }} />
                    </button>
                  </div>
                </div>
              )}
              {logError && <p style={{ fontSize: 11, color: '#A32D2D', marginTop: -8, marginBottom: 8 }}>{logError}</p>}

              {/* Editable Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedLogs.map((log) => {
                  const dateStr = new Date(log.date).toISOString().split('T')[0];
                  const isEditing = editingLogDate === dateStr;
                  const colorConfig = STATUS_COLORS[log.status] || STATUS_COLORS.Present;

                  return (
                    <div key={dateStr} style={timeline.logEntry}>
                      <div style={timeline.logDate}>
                        {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                      
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          <select 
                            value={log.status} 
                            onChange={(e) => handleSaveLog(dateStr, e.target.value)}
                            style={timeline.selectInput}
                            autoFocus
                          >
                            {STATUS_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => setEditingLogDate(null)} style={timeline.actionBtn}>
                            <X size={14} style={{ color: '#8c8a87' }} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                          <div style={{ ...timeline.statusBadge, background: colorConfig.bg, color: colorConfig.text }}>
                            {colorConfig.label}
                          </div>
                          <button onClick={() => setEditingLogDate(dateStr)} style={timeline.editBtn}>
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {sortedLogs.length === 0 && !isAddingLog && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8a87', fontSize: 13 }}>
                    No daily logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── STYLES ──
const modal = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  wrap: {
    background: 'var(--card-bg)', borderRadius: 16, border: '0.5px solid var(--border)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.12)', width: '100%', maxWidth: 460,
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

const snapshotForm = {
  wrap: { background: 'var(--bg)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' },
  header: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { display: 'block', fontSize: 10, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
  input: {
    width: '100%', background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderRadius: 8,
    padding: '10px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text)', outline: 'none'
  },
  saveBtn: {
    width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'var(--primary)',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  }
};

const timeline = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  snapshotEntry: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    background: 'var(--bg)', borderRadius: 12, border: '1px dashed var(--border)'
  },
  dateBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width: 46, height: 46, background: 'var(--card-bg)', borderRadius: 10, border: '0.5px solid var(--border)',
    fontSize: 11, fontWeight: 700, color: 'var(--text)', gap: 2
  },
  snapshotStats: { fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: 'monospace' },
  editBtn: {
    width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--subtext)', cursor: 'pointer', background: 'transparent', border: 'none'
  },
  addBtn: {
    width: '100%', padding: '10px', borderRadius: 10, border: '1px dashed var(--border)',
    background: 'var(--card-bg)', color: 'var(--text)', fontSize: 13, fontWeight: 600, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  },
  addForm: {
    display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--bg)',
    borderRadius: 12, border: '0.5px solid var(--border)', marginBottom: 8
  },
  logEntry: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    background: 'var(--card-bg)', borderRadius: 10, border: '0.5px solid var(--border)'
  },
  logDate: { fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 55, flexShrink: 0 },
  statusBadge: {
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
    letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center'
  },
  selectInput: {
    flex: 1, padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--border)',
    fontSize: 13, fontWeight: 600, background: 'var(--card-bg)', outline: 'none'
  },
  dateInput: {
    width: 110, padding: '6px 10px', borderRadius: 8, border: '0.5px solid var(--border)',
    fontSize: 12, fontWeight: 600, background: 'var(--card-bg)', outline: 'none'
  },
  actionBtn: { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' }
};

export default AttendanceRegister;
