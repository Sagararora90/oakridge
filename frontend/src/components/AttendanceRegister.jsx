import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Save, Edit3, CheckCircle2, AlertCircle, Plus, RotateCcw, Trash2, XCircle } from 'lucide-react';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  Present:   { color: 'var(--color-success)', bg: 'var(--color-success-lo)', label: 'Present', icon: CheckCircle2 },
  Absent:    { color: 'var(--color-danger)', bg: 'var(--color-danger-lo)', label: 'Absent', icon: XCircle },
  Medical:   { color: 'var(--color-primary)', bg: 'var(--color-primary-lo)', label: 'Medical', icon: Plus },
  OD:        { color: 'var(--color-accent)', bg: 'var(--color-accent-lo)', label: 'On Duty', icon: AlertCircle },
  Cancelled: { color: 'var(--color-subtext)', bg: 'var(--color-border)', label: 'Cancelled', icon: X }
};

const STATUS_CHOICES = ['Present', 'Absent', 'Medical', 'OD', 'Cancelled'];
const SPRING = { type: 'spring', stiffness: 420, damping: 34 };

const useIsMobile = (bp = 768) => {
  const [m, set] = useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : false);
  React.useEffect(() => {
    const fn = () => set(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
};

const AttendanceRegister = ({ subject, onClose, targetDate }) => {
  const isMobile = useIsMobile();
  const { setBaselineSnapshot, editDailyLog, deleteDailyLog } = useStore();
  const [snapshotMode, setSnapshotMode] = useState(!subject.initialDate);
  const [snapDate, setSnapDate] = useState(subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [snapTotal, setSnapTotal] = useState(subject.initialTotal || 0);
  const [snapAttended, setSnapAttended] = useState(subject.initialAttended || 0);
  const [editingLogId, setEditingLogId] = useState(null);
  
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogDate, setNewLogDate] = useState(targetDate || new Date().toISOString().split('T')[0]);
  const [newLogStatus, setNewLogStatus] = useState('Present');
  const [newLogCredit, setNewLogCredit] = useState(1);

  const handleSaveSnapshot = async (e) => {
    e.preventDefault();
    try {
      await setBaselineSnapshot(subject._id, { initialDate: snapDate, initialTotal: Number(snapTotal), initialAttended: Number(snapAttended) });
      setSnapshotMode(false);
      toast.success('Baseline saved');
    } catch { toast.error('Failed to save'); }
  };

  const handleSaveLog = async (logId, date, status, credit) => {
    try {
      await editDailyLog(subject._id, logId, { date, status, credit: Number(credit || 1) });
      setEditingLogId(null);
      setIsAddingLog(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Delete this entry?')) {
      await deleteDailyLog(subject._id, logId);
    }
  };

  const handleAddLog = async () => {
    try {
      const { addExtraAttendance } = useStore.getState();
      await addExtraAttendance({ subjectId: subject._id, date: newLogDate, status: newLogStatus, credit: newLogCredit });
      setIsAddingLog(false);
      toast.success('Entry added');
    } catch (err) { toast.error('Failed to add'); }
  };

  const sortedLogs = useMemo(() => {
    if (!subject.attendanceRecords) return [];
    const baseDateStr = subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : null;
    return [...subject.attendanceRecords]
      .filter(log => log.date && (!baseDateStr || new Date(log.date).toISOString().split('T')[0] >= baseDateStr))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [subject.attendanceRecords, subject.initialDate]);

  const labelSt = { fontSize: 10, fontWeight: 800, color: 'var(--color-subtext)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' };
  const inputSt = { width: '100%', padding: '10px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'inherit', outline: 'none' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : 20
    }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(var(--bg-rgb), 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 15 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 15 }}
        transition={SPRING}
        style={{
          position: 'relative', background: 'var(--color-card-bg)',
          borderRadius: isMobile ? '32px 32px 0 0' : 32,
          width: '100%', maxWidth: isMobile ? '100%' : 460,
          maxHeight: isMobile ? '92vh' : '85vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '0.5px solid var(--color-border)'
        }}>

        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: 'var(--color-border)' }} />
          </div>
        )}

        {/* HEADER */}
        <div style={{ padding: isMobile ? '16px 24px 20px' : '24px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>{subject.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--color-primary-lo)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '0.02em' }}>
                {subject.total > 0 ? ((subject.attended / subject.total) * 100).toFixed(1) : 0}%
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-subtext)' }}>
                {subject.attended} / {subject.total} Sessions
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-subtext)', transition: 'all 0.2s' }} className="hover:scale-95"><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '0 20px 40px' }}>
          {snapshotMode ? (
            <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 20, border: '0.5px solid var(--color-border)' }}>
              <p style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={12} strokeWidth={3} /> Set Baseline Snapshot</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <div><label style={labelSt}>Date</label><input type="date" value={snapDate} onChange={e=>setSnapDate(e.target.value)} style={inputSt} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelSt}>Attended</label><input type="number" value={snapAttended} onChange={e=>setSnapAttended(e.target.value)} style={inputSt} /></div>
                  <div><label style={labelSt}>Total</label><input type="number" value={snapTotal} onChange={e=>setSnapTotal(e.target.value)} style={inputSt} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {subject.initialDate && <button onClick={()=>setSnapshotMode(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>}
                  <button onClick={handleSaveSnapshot} className="btn-primary" style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800 }}>Save Baseline</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Baseline Info */}
              {subject.initialDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--color-surface)', borderRadius: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtext)', border: '0.5px solid var(--color-border)' }}><Lock size={16} strokeWidth={2.5} /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Baseline Snapshot</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-subtext)', margin: '2px 0 0' }}>Synced: <span style={{ color: 'var(--color-text)' }}>{subject.initialAttended}</span> / <span style={{ color: 'var(--color-text)' }}>{subject.initialTotal}</span></p>
                  </div>
                  <button onClick={()=>setSnapshotMode(true)} style={{ background: 'none', border: 'none', color: 'var(--color-subtext)', cursor: 'pointer' }}><Edit3 size={18} /></button>
                </div>
              )}

              {/* Add Entry */}
              {!isAddingLog ? (
                <button onClick={()=>setIsAddingLog(true)} style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  background: 'var(--color-surface)', color: 'var(--color-text)',
                  border: '1px solid var(--color-border)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
                }}>
                  <Plus size={16} strokeWidth={2.5} style={{ color: 'var(--color-primary)' }} /> Log New Session
                </button>
              ) : (
                <div style={{
                  background: 'var(--color-bg)', borderRadius: 16,
                  border: '1px solid var(--color-primary)', overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.1)'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="date" value={newLogDate} onChange={e=>setNewLogDate(e.target.value)}
                          style={{ padding: '6px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-text)', outline: 'none' }} />
                        <button onClick={()=>setIsAddingLog(false)} style={{ color: 'var(--color-subtext)', background: 'var(--color-surface)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {STATUS_CHOICES.map(st => {
                        const cMap = STATUS_MAP[st];
                        const sel = newLogStatus === st;
                        return (
                          <button key={st} onClick={()=>setNewLogStatus(st)}
                            style={{ flex: 1, minWidth: '30%', padding: '8px 0', borderRadius: 10, background: sel ? cMap.bg : 'var(--color-surface)', color: sel ? cMap.color : 'var(--color-subtext)', border: sel ? `1px solid ${cMap.color}` : '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center' }}>
                            {cMap.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px 16px', background: 'var(--color-primary-lo)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleAddLog} className="btn-primary" style={{ padding: '8px 20px', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>Save Entry</button>
                  </div>
                </div>
              )}

              {/* Log List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedLogs.map(log => {
                  const dateObj = new Date(log.date);
                  const isEditing = editingLogId === log._id;
                  const stMap = STATUS_MAP[log.status] || STATUS_MAP.Present;
                  const Icon = stMap.icon;
                  
                  return (
                    <div key={log._id} style={{
                      background: 'var(--color-bg)', borderRadius: 16,
                      border: isEditing ? `1px solid var(--color-primary)` : `1px solid var(--color-border)`,
                      overflow: 'hidden', transition: 'all 0.2s',
                      boxShadow: isEditing ? '0 4px 14px rgba(0,0,0,0.03)' : 'none'
                    }}>
                      {/* Compact Header Row */}
                      <div 
                        onClick={() => setEditingLogId(isEditing ? null : log._id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{dateObj.getDate()}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)', textTransform: 'uppercase', marginTop: 2 }}>{dateObj.toLocaleDateString('en-GB', { month: 'short' })}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{dateObj.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-subtext)', fontWeight: 600 }}>Credit: {log.credit || 1}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: stMap.bg, color: stMap.color, fontSize: 11, fontWeight: 700 }}>
                            {Icon && <Icon size={12} strokeWidth={3} />}
                            {stMap.label}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Editing Area */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-subtext)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Date</label>
                                <input type="date" value={dateObj.toISOString().split('T')[0]} 
                                  onChange={(e) => handleSaveLog(log._id, e.target.value, log.status, log.credit)}
                                  style={{ padding: '6px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-text)', outline: 'none' }} />
                              </div>

                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                                {STATUS_CHOICES.map(st => {
                                  const cMap = STATUS_MAP[st];
                                  const sel = log.status === st;
                                  return (
                                    <button key={st} onClick={() => handleSaveLog(log._id, dateObj.toISOString().split('T')[0], st, log.credit)}
                                      style={{ flex: 1, minWidth: '30%', padding: '8px 0', borderRadius: 10, background: sel ? cMap.bg : 'var(--color-surface)', color: sel ? cMap.color : 'var(--color-subtext)', border: sel ? `1px solid ${cMap.color}` : '1px solid var(--color-border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center' }}>
                                      {cMap.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleDeleteLog(log._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)', background: 'var(--color-danger-lo)', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                  <Trash2 size={12} /> Delete Entry
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {sortedLogs.length === 0 && !isAddingLog && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-subtext)', fontSize: 13, fontWeight: 600 }}>No entries found.</div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceRegister;
