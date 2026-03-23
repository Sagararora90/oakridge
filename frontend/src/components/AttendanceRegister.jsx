import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Save, Edit3, CheckCircle2, AlertCircle, Plus, RotateCcw, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  Present:   { color: 'var(--color-success)', bg: 'rgba(52,199,89,0.1)', label: 'P' },
  Absent:    { color: 'var(--color-danger)', bg: 'rgba(255,59,48,0.1)', label: 'A' },
  Medical:   { color: '#5AC8FA', bg: 'rgba(90,200,250,0.1)', label: 'M' },
  OD:        { color: 'var(--color-accent)', bg: 'rgba(191,90,242,0.1)', label: 'O' },
  Cancelled: { color: 'var(--color-subtext)', bg: 'rgba(142,142,147,0.1)', label: 'C' }
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

const AttendanceRegister = ({ subject, onClose }) => {
  const isMobile = useIsMobile();
  const { setBaselineSnapshot, editDailyLog, deleteDailyLog } = useStore();
  const [snapshotMode, setSnapshotMode] = useState(!subject.initialDate);
  const [snapDate, setSnapDate] = useState(subject.initialDate ? new Date(subject.initialDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [snapTotal, setSnapTotal] = useState(subject.initialTotal || 0);
  const [snapAttended, setSnapAttended] = useState(subject.initialAttended || 0);
  const [editingLogId, setEditingLogId] = useState(null);
  
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
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

  const labelSt = { fontSize: 10, fontWeight: 700, color: 'var(--color-subtext)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' };
  const inputSt = { width: '100%', padding: '10px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'inherit', outline: 'none' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : 20
    }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} />
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.96, opacity: 0, y: 10 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.96, opacity: 0, y: 10 }}
        transition={SPRING}
        style={{
          position: 'relative', background: 'var(--color-card-bg)',
          borderRadius: isMobile ? '24px 24px 0 0' : 24,
          width: '100%', maxWidth: isMobile ? '100%' : 460,
          maxHeight: isMobile ? '92vh' : '85vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)'
        }}>

        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--color-border)' }} />
          </div>
        )}

        {/* HEADER */}
        <div style={{ padding: isMobile ? '12px 24px 18px' : '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>{subject.name}</h2>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-subtext)', margin: '2px 0 0' }}>{subject.attended} / {subject.total} Sessions • {subject.total > 0 ? ((subject.attended / subject.total) * 100).toFixed(1) : 0}%</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-subtext)' }}><X size={16} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: isMobile ? 40 : 20 }}>
          {snapshotMode ? (
            <div style={{ padding: 18, background: 'var(--color-surface)', borderRadius: 18, border: '1px solid var(--color-border)' }}>
              <p style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={12} /> Set Baseline Snapshot</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <div><label style={labelSt}>Date</label><input type="date" value={snapDate} onChange={e=>setSnapDate(e.target.value)} style={inputSt} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelSt}>Attended</label><input type="number" value={snapAttended} onChange={e=>setSnapAttended(e.target.value)} style={inputSt} /></div>
                  <div><label style={labelSt}>Total</label><input type="number" value={snapTotal} onChange={e=>setSnapTotal(e.target.value)} style={inputSt} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {subject.initialDate && <button onClick={()=>setSnapshotMode(false)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>Cancel</button>}
                  <button onClick={handleSaveSnapshot} className="btn-primary" style={{ flex: 1, padding: 10 }}>Save Baseline</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Baseline Info */}
              {subject.initialDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtext)' }}><Lock size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Baseline Snapshot</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', margin: 0, textTransform: 'uppercase' }}>Synced: {subject.initialAttended}/{subject.initialTotal}</p>
                  </div>
                  <button onClick={()=>setSnapshotMode(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                </div>
              )}

              {/* Add Entry */}
              {!isAddingLog ? (
                <button onClick={()=>setIsAddingLog(true)} style={{ width: '100%', padding: 14, border: '1px dashed var(--color-border)', borderRadius: 16, background: 'var(--color-surface)', color: 'var(--color-subtext)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus size={16} /> Add Daily Entry
                </button>
              ) : (
                <div style={{ p: 14, background: 'var(--color-surface)', border: '1px solid var(--color-primary)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input type="date" value={newLogDate} onChange={e=>setNewLogDate(e.target.value)} style={{ ...inputSt, width: 'auto' }} />
                    <button onClick={()=>setIsAddingLog(false)} style={{ color: 'var(--color-subtext)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {STATUS_CHOICES.map(st => (
                        <button key={st} onClick={()=>setNewLogStatus(st)}
                          style={{ width: 32, height: 32, borderRadius: '50%', background: newLogStatus === st ? STATUS_MAP[st].bg : 'var(--color-bg)', color: newLogStatus === st ? STATUS_MAP[st].color : 'var(--color-subtext)', border: 'none', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {STATUS_MAP[st].label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleAddLog} className="btn-primary" style={{ padding: '8px 16px', borderRadius: 10 }}>Add</button>
                  </div>
                </div>
              )}

              {/* Log List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {sortedLogs.map(log => {
                  const dateObj = new Date(log.date);
                  const isEditing = editingLogId === log._id;
                  
                  return (
                    <div key={log._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                      <div style={{ width: 50 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)', margin: 0, textTransform: 'uppercase' }}>{dateObj.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                      </div>
                      
                      <div style={{ display: 'flex', flex: 1, gap: 6, justifyContent: 'center' }}>
                        {STATUS_CHOICES.map(st => (
                          <button key={st} onClick={()=>handleSaveLog(log._id, dateObj.toISOString().split('T')[0], st, log.credit)}
                            style={{ width: 32, height: 32, borderRadius: '50%', background: log.status === st ? STATUS_MAP[st].bg : 'transparent', color: log.status === st ? STATUS_MAP[st].color : 'var(--color-subtext)', opacity: log.status === st ? 1 : 0.4, border: 'none', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                            {STATUS_MAP[st].label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button onClick={()=>setEditingLogId(isEditing ? null : log._id)} style={{ background: 'none', border: 'none', color: isEditing ? 'var(--color-primary)' : 'var(--color-subtext)', cursor: 'pointer', opacity: isEditing ? 1 : 0.4 }}><Edit3 size={14} /></button>
                        <button onClick={()=>handleDeleteLog(log._id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', opacity: 0.4 }}><Trash2 size={14} /></button>
                      </div>

                      {/* Inline Date Edit Overlay */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            style={{ position: 'absolute', inset: 0, background: 'var(--color-card-bg)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={labelSt}>New Date</span>
                              <input type="date" defaultValue={dateObj.toISOString().split('T')[0]} 
                                onChange={(e) => {
                                  handleSaveLog(log._id, e.target.value, log.status, log.credit);
                                }}
                                style={{ ...inputSt, width: 'auto', padding: '6px 10px', fontSize: 12 }} />
                            </div>
                            <button onClick={()=>setEditingLogId(null)} style={{ background: 'none', border: 'none', color: 'var(--color-subtext)', cursor: 'pointer' }}><X size={16} /></button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {sortedLogs.length === 0 && !isAddingLog && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-subtext)', fontSize: 12, fontWeight: 600 }}>No entries found.</div>
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
