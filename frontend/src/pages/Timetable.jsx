import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Save, Plus, Trash2, BookOpen, ChevronRight, 
  ChevronLeft, CheckCircle2, XCircle, Pill, GraduationCap, MapPin, Search
} from 'lucide-react';
import useStore from '../store/useStore';
import TimetableUpload from '../components/TimetableUpload';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────
   APPLE DEVELOPER STRUCTURE — CSS vars, theme-agnostic
   Unified Timeline — merges Timetable & Daily Check-in
───────────────────────────────────────────────────────── */

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace";
const SP   = { type: 'spring', stiffness: 340, damping: 28 };

// Hardcoded Apple Palette for subject dots
const PALETTE = ['#007AFF','#34C759','#FF9F0A','#AF52DE','#FF3B30','#32ADE6','#FFD60A','#FF6B35'];
const accent = (sub, i) => sub?.color || PALETTE[i % PALETTE.length];

const lbl = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--color-subtext)', margin: 0,
  fontFamily: FONT,
};

const DATES_TO_SHOW = 14; // Show 14 days in the strip (7 past, today, 6 future)

function useIsMobile(bp = 1024) {
  const [m, set] = useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : false);
  useEffect(() => {
    const fn = () => set(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}

/* ════════════════════════════════════════════════════════════ */
export default function Timetable() {
  const { subjects, timetable, updateTimetable, fetchUser, fetchDailyStatus, markAttendance, undoAttendance } = useStore();
  const isMobile = useIsMobile();

  const [local,     setLocal]     = useState(timetable || []);
  const [saving,    setSaving]    = useState(false);
  const [editMode,  setEditMode]  = useState(false); // true = editing base timetable
  
  // Date State - Use local date string to avoid UTC offset issues
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  
  // Helper to safely get YYYY-MM-DD in local time
  const getLocalDateStr = (dateObj) => {
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const selectedDateStr = getLocalDateStr(selectedDateObj);
  const selectedDayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Daily Status State (fetched from backend)
  const [dailyData, setDailyData] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Strip state
  const stripDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    // Start 7 days ago
    for (let i = -7; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  useEffect(() => {
    setLocal(timetable || []);
  }, [timetable]);

  // Load backend status whenever date changes and NOT in edit mode
  useEffect(() => {
    if (!editMode) {
      loadDailyStatus(selectedDateStr);
    }
  }, [selectedDateStr, editMode, fetchDailyStatus]);

  const loadDailyStatus = async (dateStr) => {
    setLoadingDaily(true);
    try {
      const result = await fetchDailyStatus(dateStr);
      setDailyData(result);
    } catch {
      // fail silently, just show base timetable
    } finally {
      setLoadingDaily(false);
    }
  };

  /* ── Base Timetable Interactions (Edit Mode) ── */
  const slotsForDay = (dayName) => local.find(e => e.day.toLowerCase() === dayName.toLowerCase())?.slots || [];

  const addSlot = (day) => {
    const next  = local.map(d => ({ ...d, slots: [...d.slots] }));
    let   entry = next.find(d => d.day.toLowerCase() === day.toLowerCase());
    if (!entry) { entry = { day, slots: [] }; next.push(entry); }
    entry.slots.push({ time: '09:00 - 10:00', subject: subjects[0]?._id || '', credit: 1 });
    setLocal(next);
  };

  const removeSlot = (day, idx) =>
    setLocal(local.map(d => d.day.toLowerCase() === day.toLowerCase() ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d));

  const updateSlot = (day, idx, field, value) =>
    setLocal(local.map(d => {
      if (d.day.toLowerCase() !== day.toLowerCase()) return d;
      return { ...d, slots: d.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s) };
    }));

  const handleSaveTimetable = async () => {
    setSaving(true);
    const id = toast.loading('Saving schedule…');
    try {
      await updateTimetable(local);
      toast.success('Schedule saved', { id });
      setEditMode(false);
    } catch { 
      toast.error('Failed to save', { id }); 
    } finally { 
      setSaving(false); 
    }
  };

  /* ── Daily Logging Interactions ── */
  const handleMark = async (subjectId, status, credit = 1) => {
    const todayStr = getLocalDateStr(new Date());
    if (selectedDateStr > todayStr) {
      return toast.error("Cannot mark attendance for future dates.");
    }

    // Optimistic UI update
    setDailyData(prev => {
      if (!prev || !prev.sessions) return prev;
      return {
         ...prev,
         sessions: prev.sessions.map(s => s.subjectId === subjectId ? { ...s, status } : s)
      };
    });

    try {
      await markAttendance(subjectId, status, credit, selectedDateStr);
      toast.success(`Marked ${status}`);
      // Refresh to ensure sync
      loadDailyStatus(selectedDateStr);
    } catch {
      toast.error("Failed to mark attendance");
      loadDailyStatus(selectedDateStr); // Revert
    }
  };

  const handleUndo = async (subjectId) => {
    // For historical or specific date undo, we should delete the specific log entry
    const session = dailyData?.sessions?.find(s => s.subjectId === subjectId && s.recordId);
    
    if (session && session.recordId) {
      try {
        await useStore.getState().deleteDailyLog(subjectId, session.recordId);
        toast.success("Attendance removed");
        loadDailyStatus(selectedDateStr);
      } catch {
        toast.error("Failed to remove attendance");
      }
    } else {
      // Fallback to generic undo if no recordId found (e.g. just marked but dailyData not refreshed)
      try {
        await undoAttendance(subjectId);
        toast.success("Attendance removed");
        loadDailyStatus(selectedDateStr);
      } catch {
        toast.error("Failed to remove attendance");
      }
    }
  };

  const isToday = selectedDateStr === getLocalDateStr(new Date());
  const isFuture = selectedDateStr > getLocalDateStr(new Date());
  const baseSlots = slotsForDay(selectedDayName);

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100svh', paddingBottom: isMobile ? 96 : 48, fontFamily: FONT }}>

      {/* ══ STICKY HEADER ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(var(--bg-rgb), 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
           <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(var(--primary-rgb), 0.25)' }}>
             <Clock size={14} color="white" strokeWidth={2.5} />
           </div>
           <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginLeft: 4 }}>
             Schedule
           </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!editMode ? (
            <button onClick={() => setEditMode(true)} style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.15s'
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
              Edit Weekly Base
            </button>
          ) : (
            <>
              <TimetableUpload onComplete={async () => {
                 await fetchUser();
                 const f = useStore.getState().timetable;
                 if (f) setLocal(f);
              }} />
              <button onClick={() => { setEditMode(false); setLocal(timetable || []); }} style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                color: 'var(--color-subtext)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT
              }}>Cancel</button>
              <button onClick={handleSaveTimetable} disabled={saving} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: 'var(--color-primary)', color: 'white', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {saving ? 'Saving...' : 'Save Base'}
              </button>
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '0 0' : '24px 24px' }}>
        
        {/* ══ DATE STRIP (Only visible in normal mode) ══ */}
        <AnimatePresence>
          {!editMode && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
               style={{ overflow: 'hidden' }}
            >
              <div style={{ 
                padding: isMobile ? '16px 0 20px' : '0 0 24px', 
                borderBottom: isMobile ? '1px solid var(--color-border)' : 'none',
                background: isMobile ? 'var(--color-bg)' : 'transparent'
              }}>
                <div style={{ 
                  display: 'flex', gap: 8, overflowX: 'auto', padding: isMobile ? '0 16px' : '0 4px',
                  WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' 
                }}>
                  {stripDates.map((date, i) => {
                    const ds = getLocalDateStr(date);
                    const isSelected = ds === selectedDateStr;
                    const isTodayTag = ds === getLocalDateStr(new Date());
                    
                    return (
                      <button 
                        key={ds} onClick={() => setSelectedDateObj(date)}
                        ref={el => { if (isSelected && el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }}
                        style={{
                          flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          width: 56, height: 68, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: FONT,
                          background: isSelected ? 'var(--color-text)' : 'var(--color-surface)',
                          color: isSelected ? 'var(--color-bg)' : 'var(--color-subtext)',
                          border: isSelected ? 'none' : '1px solid var(--color-border)',
                           position: 'relative', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                           boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                         }}
                      >
                         <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isSelected ? 'rgba(var(--bg-rgb), 0.7)' : 'var(--color-subtext)', marginBottom: 2 }}>
                           {date.toLocaleDateString('en-US', { weekday: 'short' })}
                         </span>
                         <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0em', color: isSelected ? 'var(--color-bg)' : 'var(--color-text)', lineHeight: 1 }}>
                           {date.getDate()}
                         </span>
                         {isTodayTag && !isSelected && <div style={{ position: 'absolute', bottom: -10, width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ CONTENT AREA ══ */}
        <div style={{ padding: isMobile ? '20px 16px' : '0', paddingTop: isMobile && editMode ? 20 : undefined }}>
          
          <div style={{ marginBottom: 24 }}>
             <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
               {editMode ? 'Weekly Base' : (isToday ? 'Today' : selectedDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }))}
             </h1>
             <p style={{ fontSize: 13, color: 'var(--color-subtext)', margin: '6px 0 0' }}>
               {editMode ? 'Modify your fixed repeating schedule.' : (isFuture ? 'Upcoming sessions.' : 'Tap any class to log attendance instantly.')}
             </p>
          </div>

          {/* EDIT MODE WEEKLY SELECTOR */}
          {editMode && (
             <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, marginBottom: 16, scrollbarWidth: 'none' }}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                   const isActive = day === selectedDayName;
                   return (
                     <button key={day} onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + ((['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(day) - d.getDay() + 7) % 7));
                        setSelectedDateObj(d);
                     }} style={{
                        padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: FONT,
                        background: isActive ? 'var(--color-surface)' : 'transparent',
                        color: isActive ? 'var(--color-text)' : 'var(--color-subtext)',
                        fontWeight: isActive ? 700 : 500, fontSize: 13, flexShrink: 0,
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px var(--color-border)' : 'none',
                     }}>
                        {day}
                     </button>
                   )
                })}
             </div>
          )}

          <AnimatePresence mode="wait">
             <motion.div key={editMode ? `edit-${selectedDayName}` : `view-${selectedDateStr}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                
                {editMode ? (
                   /* ── EDIT MODE CARDS ── */
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {baseSlots.length === 0 ? (
                        <EmptyState onAdd={() => addSlot(selectedDayName)} isEditMode={true} />
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {baseSlots.map((slot, idx) => (
                            <EditableSlotCard key={idx} slot={slot} idx={idx} subjects={subjects} day={selectedDayName} onUpdate={updateSlot} onRemove={removeSlot} />
                          ))}
                           <button onClick={() => addSlot(selectedDayName)} style={{ marginTop: 8, padding: '14px', borderRadius: 16, border: '2px dashed var(--color-border)', background: 'transparent', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                             <Plus size={16} /> Add Class
                           </button>
                        </AnimatePresence>
                      )}
                   </div>
                ) : (
                   /* ── TIMELINE VIEW MODE ── */
                   <div style={{ position: 'relative' }}>
                     {/* Timeline Line */}
                     <div style={{ position: 'absolute', top: 16, bottom: 16, left: 16, width: 2, background: 'var(--color-border)', zIndex: 0 }} />

                     {loadingDaily ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-subtext)', fontSize: 13, fontWeight: 600 }}>Loading timeline...</div>
                     ) : (!dailyData || dailyData.sessions?.length === 0) ? (
                        <div style={{ paddingLeft: 40 }}>
                           <EmptyState onAdd={() => setEditMode(true)} isEditMode={false} />
                        </div>
                     ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingLeft: 40, position: 'relative', zIndex: 1 }}>
                           {dailyData.sessions.map((session, idx) => (
                             <TimelineCard 
                               key={`${session.subjectId}-${idx}`} 
                               session={session} 
                               idx={idx} 
                               isFuture={isFuture}
                               selectedDateStr={selectedDateStr}
                               onMark={handleMark}
                               onUndo={handleUndo}
                             />
                           ))}
                        </div>
                     )}
                   </div>
                )}

             </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TIMELINE CARD — Inline Interactive Logging
══════════════════════════════════════════════════════════ */
function TimelineCard({ session, idx, isFuture, selectedDateStr, onMark, onUndo }) {
  const [expanded, setExpanded] = useState(false);
  
  const getLocalDateStr = (dObj) => {
    const d = new Date(dObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const isLive = useMemo(() => {
    if (selectedDateStr !== getLocalDateStr(new Date())) return false;
    try {
      const [start, end] = session.time.split('-').map(t => t.trim());
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      
      const parse = (t) => {
        const parts = t.split(' ');
        let [h, m] = parts[0].split(':').map(Number);
        const mod = parts[1];
        if (mod?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (mod?.toUpperCase() === 'AM' && h === 12) h = 0;
        if (!mod && h >= 1 && h <= 7) h += 12; // smart college guess
        return h * 60 + (m || 0);
      };
      
      return currentMin >= parse(start) && currentMin <= parse(end);
    } catch { return false; }
  }, [session.time, selectedDateStr]);

  const status = session.status; // Present, Absent, Medical, OD, Cancelled, null
  
  const ST_COLORS = {
    Present:   { c: 'var(--color-success)', bg: 'var(--color-success-lo)' },
    Absent:    { c: 'var(--color-danger)',  bg: 'var(--color-danger-lo)' },
    Medical:   { c: 'var(--color-accent)',  bg: 'var(--color-accent-lo)' },
    OD:        { c: 'var(--color-primary)', bg: 'var(--color-primary-lo)' },
    Cancelled: { c: 'var(--color-subtext)', bg: 'var(--color-border)' }
  };

  const currentSt = status ? ST_COLORS[status] : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Node on the timeline */}
      <div style={{ 
         position: 'absolute', left: -24 - 4, top: 22, transform: 'translateY(-50%)',
         width: 12, height: 12, borderRadius: '50%', background: currentSt ? currentSt.bg : 'var(--color-surface)',
         border: `2px solid ${currentSt ? currentSt.c : 'var(--color-border)'}`, zIndex: 10,
         boxShadow: isLive ? '0 0 0 4px var(--color-primary-lo)' : 'none'
      }}>
         {isLive && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid var(--color-primary)', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
      </div>

      <motion.div 
         layout
         initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={SP}
         style={{
           background: isLive ? 'var(--color-primary-lo)' : 'var(--color-card-bg)',
            borderRadius: 16, border: `1px solid ${isLive ? 'var(--color-primary)' : 'var(--color-border)'}`,
            overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
          }}
      >
        <div 
          onClick={() => { if (!isFuture && !status) setExpanded(!expanded); }}
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: (!isFuture && !status) ? 'pointer' : 'default' }}
        >
           <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: session.subjectColor }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.subjectName}
                </h3>
                 {isLive && (
                  <span style={{ fontSize: 9, fontWeight: 900, color: 'white', background: 'var(--color-primary)', padding: '2px 6px', borderRadius: 6, letterSpacing: '0.05em' }}>LIVE</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 12, fontWeight: 600, color: 'var(--color-subtext)' }}>
                    <Clock size={12} /> {session.time}
                 </div>
                 {session.professor && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--color-text)', opacity: 0.8, background: 'var(--color-surface)', padding: '2px 8px', borderRadius: 6 }}>
                      {session.professor}
                   </div>
                 )}
              </div>
           </div>

           {/* Status Badge / Action */}
           <div style={{ flexShrink: 0, marginLeft: 16 }}>
              {isFuture ? (
                 <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-subtext)', background: 'var(--color-surface)', padding: '4px 10px', borderRadius: 8 }}>UPCOMING</span>
              ) : status ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <span style={{ fontSize: 12, fontWeight: 800, color: currentSt.c, background: currentSt.bg, border: `1px solid ${currentSt.c}`, padding: '4px 10px', borderRadius: 8 }}>
                     {status}
                   </span>
                   <button onClick={(e) => { e.stopPropagation(); onUndo(session.subjectId); }} style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'var(--color-surface)', color: 'var(--color-subtext)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                     <XCircle size={14} />
                   </button>
                 </div>
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtext)', transition: 'all 0.2s', background: expanded ? 'var(--color-surface)' : 'transparent', transform: expanded ? 'rotate(45deg)' : 'none' }}>
                  <Plus size={16} />
                </div>
              )}
           </div>
        </div>

        {/* INLINE ACTION SHEET */}
        <AnimatePresence>
           {expanded && !status && !isFuture && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                 <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                    <LogButton status="Present"   icon={CheckCircle2}  color="var(--color-success)"  bg="var(--color-success-lo)"  onClick={() => { onMark(session.subjectId, 'Present', session.credit); setExpanded(false); }} />
                    <LogButton status="Absent"    icon={XCircle}       color="var(--color-danger)"   bg="var(--color-danger-lo)"   onClick={() => { onMark(session.subjectId, 'Absent', session.credit); setExpanded(false); }} />
                    <LogButton status="Medical"   icon={Pill}          color="var(--color-accent)"   bg="var(--color-accent-lo)"   onClick={() => { onMark(session.subjectId, 'Medical', session.credit); setExpanded(false); }} />
                    <LogButton status="OD"        icon={GraduationCap} color="var(--color-primary)"  bg="var(--color-primary-lo)"  onClick={() => { onMark(session.subjectId, 'OD', session.credit); setExpanded(false); }} />
                    <LogButton status="Cancelled" icon={XCircle}       color="var(--color-subtext)"  bg="var(--color-border)"      onClick={() => { onMark(session.subjectId, 'Cancelled', session.credit); setExpanded(false); }} />
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

function LogButton({ status, icon: Icon, color, bg, onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 0', border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = color; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
       <Icon size={20} style={{ color }} />
       <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text)', fontFamily: FONT }}>{status}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   EDITABLE SLOT CARD (For Base Timetable)
══════════════════════════════════════════════════════════ */
function EditableSlotCard({ slot, idx, subjects, day, onUpdate, onRemove }) {
  const sub   = subjects.find(s => s._id === slot.subject);
  const color = accent(sub, idx);
  
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} style={{ background: 'var(--color-card-bg)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={lbl}>Slot {idx + 1}</span>
          {sub?.professor && (
            <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-subtext)' }}>
               {sub.professor}
            </span>
          )}
        </div>
        <button onClick={() => onRemove(day, idx)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--color-danger-lo)', background: 'var(--color-danger-lo)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
          <Trash2 size={13} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <p style={{ ...lbl, marginBottom: 6 }}>Subject</p>
          <div style={{ position: 'relative' }}>
            <BookOpen size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtext)', pointerEvents: 'none' }} />
            <select value={slot.subject} onChange={e => onUpdate(day, idx, 'subject', e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}>
              <option value="">— Unassigned —</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ ...lbl, marginBottom: 6 }}>Time</p>
            <div style={{ position: 'relative' }}>
              <Clock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtext)', pointerEvents: 'none' }} />
              <input type="text" value={slot.time} onChange={e => onUpdate(day, idx, 'time', e.target.value)} placeholder="09:00 - 10:00" style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', outline: 'none', fontFamily: MONO }} />
            </div>
          </div>
          <div>
            <p style={{ ...lbl, marginBottom: 6 }}>Credits</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3].map(n => {
                const on = (slot.credit || 1) === n;
                return (
                   <button key={n} onClick={() => onUpdate(day, idx, 'credit', n)} style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-primary)' : 'var(--color-surface)', color: on ? 'white' : 'var(--color-text)', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── empty state ── */
function EmptyState({ onAdd, isEditMode }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: '2px dashed var(--color-border)', borderRadius: 20 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtext)' }}>
        <MapPin size={24} strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>No Classes</p>
        <p style={{ fontSize: 13, color: 'var(--color-subtext)', margin: '4px 0 0', fontWeight: 500, maxWidth: 220, lineHeight: 1.4 }}>
          {isEditMode ? 'Add classes to build your base timetable for this day.' : 'You have a free day today. Enjoy the break!'}
        </p>
      </div>
      {isEditMode && (
         <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--color-primary)', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 8, boxShadow: '0 4px 12px rgba(0,122,255,0.2)' }}>
           <Plus size={16} strokeWidth={2.5} /> Add first class
         </button>
      )}
    </div>
  );
}