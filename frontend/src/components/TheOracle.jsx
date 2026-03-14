import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Check, X, XCircle } from 'lucide-react';
import useStore from '../store/useStore';

// Helper to parse "10:00", "1:00 PM", "13:00" into minutes
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let [_, hours, mins, modifier] = match;
  hours = parseInt(hours, 10);
  mins = parseInt(mins, 10);

  if (modifier) {
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + mins;
};

const TheOracle = () => {
  const { timetable, subjects, editDailyLog, token } = useStore();
  const [activePrompt, setActivePrompt] = useState(null);
  const [dismissedSlots, setDismissedSlots] = useState(new Set()); // Keep track of dismissed prompts in this session

  useEffect(() => {
    if (!token || !timetable || !subjects) return;

    // Check every minute
    const interval = setInterval(() => {
      findPrompt();
    }, 60000);

    // Run once on mount after a shortly delay
    setTimeout(findPrompt, 2000);

    return () => clearInterval(interval);
  }, [timetable, subjects, token, dismissedSlots]);

  const findPrompt = () => {
    // If prompt is already showing, wait for user action
    if (activePrompt) return;

    const now = new Date();
    const todayLabel = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todaySlots = timetable?.find(t => t.day.toLowerCase() === todayLabel.toLowerCase())?.slots || [];
    
    if (!todaySlots.length) return;

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().split('T')[0];

    for (const slot of todaySlots) {
      if (!slot.time || !slot.time.includes('-')) continue;
      
      const parts = slot.time.split('-');
      const endTimeStr = parts[1];
      const endMins = parseTimeToMinutes(endTimeStr);

      if (!endMins) continue;

      // Class ended between 5 and 60 mins ago
      const isTimeToPrompt = currentMins >= (endMins + 5) && currentMins <= (endMins + 60);

      if (isTimeToPrompt) {
        // Did we already dismiss it this session?
        const slotKey = `${todayStr}_${slot.time}`;
        if (dismissedSlots.has(slotKey)) continue;

        // Has the user already logged attendance for it today?
        const subId = slot.subject?._id || slot.subject;
        const subject = subjects.find(s => s._id === subId);
        if (!subject) continue;

        const hasLoggedToday = subject.attendanceRecords?.some(log => {
          return log.date && new Date(log.date).toISOString().split('T')[0] === todayStr;
        });

        if (!hasLoggedToday) {
            // We found a match! Set the active prompt.
            setActivePrompt({ slot, subject, key: slotKey });
            return; // break out of loop, show only one prompt at a time
        }
      }
    }
  };

  const handleAction = async (status) => {
    if (!activePrompt) return;
    const { subject, slot } = activePrompt;
    
    const todayStr = new Date().toISOString().split('T')[0];
    await editDailyLog(subject._id, { date: todayStr, status });
    
    // Dismiss
    handleDismiss();
  };

  const handleDismiss = () => {
    if (!activePrompt) return;
    setDismissedSlots(prev => new Set(prev).add(activePrompt.key));
    setActivePrompt(null);
  };

  return (
    <AnimatePresence>
      {activePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 24, stiffness: 200 }}
          style={s.overlayWrap}
        >
          <div style={s.card}>
            {/* Header / Icon */}
            <div style={s.iconWrap}>
              <BellRing size={16} style={{ color: '#BA7517' }} />
            </div>

            {/* Content */}
            <div style={s.content}>
               <p style={s.title}>The Oracle</p>
               <p style={s.text}>
                 Looks like <b>{activePrompt.subject.name}</b> just ended. Were you present?
               </p>
               <div style={s.actions}>
                  <button onClick={() => handleAction('Present')} style={s.btnYes} className="hover:opacity-90 active:scale-95 transition-all">
                     <Check size={14} style={{ marginRight: 6 }} /> Present
                  </button>
                  <button onClick={() => handleAction('Absent')} style={s.btnNo} className="hover:opacity-90 active:scale-95 transition-all">
                     <X size={14} style={{ marginRight: 6 }} /> Absent
                  </button>
               </div>
            </div>

            {/* Dismiss Button */}
            <button onClick={handleDismiss} style={s.dismissBtn} className="hover:bg-neutral-100 transition-colors">
               <XCircle size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const s = {
  overlayWrap: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
  },
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    maxWidth: 360,
    position: 'relative',
    overflow: 'hidden'
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2
  },
  content: {
    flex: 1,
    paddingRight: 20
  },
  title: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--warning)',
    margin: 0,
    marginBottom: 4
  },
  text: {
    fontSize: 13,
    color: 'var(--text)',
    margin: 0,
    lineHeight: 1.4,
    marginBottom: 12
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  btnYes: {
    flex: 1,
    background: 'var(--secondary)',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  btnNo: {
    flex: 1,
    background: 'var(--danger)',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  dismissBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'transparent',
    border: 'none',
    color: 'var(--subtext)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  }
};

export default TheOracle;
