import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, BrainCircuit, Target } from 'lucide-react';
import useStore from '../store/useStore';

const QUICK_PROMPTS = [
  "Can I skip tomorrow?",
  "What's my overall status?",
  "Which subject needs attention?",
];

const AIPlanner = () => {
  const { subjects, timetable, holidays, extraClasses } = useStore();

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Hi! I'm your AI planner. Ask me anything about your attendance — like whether you can skip tomorrow, or which subjects need attention."
  }]);
  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [simSubject, setSimSubject] = useState('');
  const [simAttend,  setSimAttend]  = useState(5);
  const [simSkip,    setSimSkip]    = useState(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── AI logic (unchanged from original) ──
  const getSkipAdvice = () => {
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const tomorrow  = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = dayNames[tomorrow.getDay()];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Check for holiday
    const holiday = (holidays || []).find(h => new Date(h.date).toISOString().split('T')[0] === tomorrowStr);
    if (holiday) return `Tomorrow is a registered holiday (${holiday.label}). Enjoy your day off!`;

    // Check for day override
    const override = (extraClasses || []).find(ec => new Date(ec.date).toISOString().split('T')[0] === tomorrowStr);
    const dayToFollow = override ? override.followsDay : tomorrowDay;

    const daySchedule = timetable?.find(t =>
      t.day.toLowerCase().startsWith(dayToFollow.toLowerCase().substring(0, 2))
    );

    if (!daySchedule?.slots?.length)
      return `No classes scheduled for ${tomorrowDay}. Rest up!`;

    const results = [];
    daySchedule.slots.forEach(slot => {
      const subId = slot.subject?._id || slot.subject?.toString() || slot.subject;
      const sub   = subjects.find(s => s._id === subId);
      if (!sub) return;
      const credit        = slot.credit || 1;
      const afterSkipPct  = (sub.attended / (sub.total + credit)) * 100;
      const safe          = afterSkipPct >= (sub.requiredAttendance || 75);
      results.push(
        `${safe ? '✅' : '❌'} ${sub.name} (${slot.time}): ${safe ? 'Safe to skip' : 'Must attend'} — drops to ${afterSkipPct.toFixed(1)}%`
      );
    });

    return `Here's your report for ${tomorrowDay}:\n\n${results.join('\n')}`;
  };

  const processQuery = (query) => {
    const q = query.toLowerCase();
    if (q.includes('skip') || q.includes('bunk') || q.includes('tomorrow'))
      return getSkipAdvice();

    if (q.includes('improve') || q.includes('how to') || q.includes('status') || q.includes('attention')) {
      const struggling = subjects.filter(s =>
        (s.total > 0 ? (s.attended / s.total * 100) : 100) < (s.requiredAttendance - 0.01 || 74.99)
      );
      if (struggling.length === 0)
        return "All your subjects are above the required threshold. Keep it up!";
      return "Here's what needs attention:\n\n" + struggling.map(s => {
        const target = (s.requiredAttendance || 75) / 100;
        const needed = Math.ceil((target * s.total - s.attended) / (1 - target));
        return `🎯 ${s.name}: Attend the next ${Math.max(0, needed)} classes to recover.`;
      }).join('\n');
    }

    return "Try asking:\n• \"Can I skip tomorrow?\"\n• \"What's my status?\"\n• \"Which subject needs attention?\"";
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: processQuery(text) }]);
      setIsTyping(false);
    }, 700);
  };

  const handleSend = (e) => { e.preventDefault(); sendMessage(input); };

  // ── Simulator ──
  const selectedSub = subjects.find(s => s._id === simSubject);
  const simResult   = selectedSub ? (() => {
    const newAttended = selectedSub.attended + simAttend;
    const newTotal    = selectedSub.total + simAttend + simSkip;
    return { pct: newTotal > 0 ? (newAttended / newTotal) * 100 : 0 };
  })() : null;

  const required = selectedSub?.requiredAttendance || 75;
  const isSafe   = simResult ? simResult.pct >= required : false;

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">
      <div style={pg.page}>

        {/* ── HEADER ── */}
        <div style={pg.header}>
          <div style={pg.headerIcon}>
            <BrainCircuit size={20} color="#fff" />
          </div>
          <div>
            <h1 style={pg.title}>AI Planner</h1>
            <p style={pg.subtitle}>Ask about your schedule, skip safety, and recovery plans.</p>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={pg.grid}>

          {/* ── CHAT ── */}
          <div style={chat.wrap}>

            {/* Chat header */}
            <div style={chat.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={chat.onlineDot} />
                <span style={chat.headerLabel}>AI Specialist</span>
              </div>
              <Sparkles size={15} style={{ color: 'var(--primary, #007aff)', opacity: 0.6 }} />
            </div>

            {/* Quick prompts */}
            <div style={chat.quickRow}>
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  style={chat.quickBtn}
                  className="hover:border-primary/40 hover:text-primary transition-all"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div style={chat.messageArea}>
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display:       'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      ...chat.bubble,
                      background:   msg.role === 'user' ? 'var(--primary, #007aff)' : '#f5f4f1',
                      color:        msg.role === 'user' ? '#fff' : '#0f0e0d',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      alignSelf:    msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <div style={chat.typingWrap}>
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} style={{
                      ...chat.typingDot,
                      animation: `bounce 0.9s ${delay}s infinite`,
                    }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={chat.inputArea}>
              <form onSubmit={handleSend} style={chat.inputRow}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your attendance…"
                  style={chat.input}
                  className="focus:border-primary/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  style={{
                    ...chat.sendBtn,
                    opacity: input.trim() ? 1 : 0.4,
                    cursor:  input.trim() ? 'pointer' : 'default',
                  }}
                  className="active:scale-95 transition-all"
                >
                  <Send size={15} color="#fff" />
                </button>
              </form>
            </div>
          </div>

          {/* ── SIMULATOR ── */}
          <div style={sim.wrap}>
            <div>
              <h2 style={sim.title}>Scenario Simulator</h2>
              <p style={sim.subtitle}>See how future attendance changes your percentage.</p>
            </div>

            {/* Subject picker */}
            <div style={sim.field}>
              <label style={sim.label}>Subject</label>
              <select
                value={simSubject}
                onChange={e => setSimSubject(e.target.value)}
                style={sim.select}
              >
                <option value="">Choose a subject…</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Attend slider */}
            <div style={sim.field}>
              <div style={sim.sliderRow}>
                <label style={sim.label}>Classes to attend</label>
                <span style={{ ...sim.sliderVal, color: '#0F6E56' }}>{simAttend}</span>
              </div>
              <input
                type="range" min="0" max="100" value={simAttend}
                onChange={e => setSimAttend(parseInt(e.target.value))}
                style={sim.range}
                className="accent-secondary"
              />
            </div>

            {/* Skip slider */}
            <div style={sim.field}>
              <div style={sim.sliderRow}>
                <label style={sim.label}>Classes to skip</label>
                <span style={{ ...sim.sliderVal, color: '#A32D2D' }}>{simSkip}</span>
              </div>
              <input
                type="range" min="0" max="15" value={simSkip}
                onChange={e => setSimSkip(parseInt(e.target.value))}
                style={sim.range}
                className="accent-danger"
              />
            </div>

            {/* Result */}
            {simResult && selectedSub ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={sim.result}
              >
                <p style={sim.resultLabel}>Projected attendance</p>
                <p style={{ ...sim.resultPct, color: isSafe ? '#0F6E56' : '#A32D2D' }}>
                  {simResult.pct.toFixed(1)}%
                </p>

                {/* Progress bar */}
                <div style={sim.track}>
                  {/* Threshold marker */}
                  <div style={{ ...sim.marker, left: `${required}%` }} />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, simResult.pct)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ ...sim.bar, background: isSafe ? '#0F6E56' : '#A32D2D' }}
                  />
                </div>

                <p style={sim.resultNote}>
                  {isSafe
                    ? `✅ Above the ${required}% requirement — you're safe.`
                    : `❌ Below ${required}% — you need to attend more classes.`
                  }
                </p>

                {/* Current vs projected */}
                <div style={sim.statRow}>
                  <div style={sim.stat}>
                    <span style={sim.statLabel}>Current</span>
                    <span style={sim.statVal}>
                      {selectedSub.total > 0
                        ? (selectedSub.attended / selectedSub.total * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div style={{ width: 1, background: '#e3e0da' }} />
                  <div style={sim.stat}>
                    <span style={sim.statLabel}>Projected</span>
                    <span style={{ ...sim.statVal, color: isSafe ? '#0F6E56' : '#A32D2D' }}>
                      {simResult.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ width: 1, background: '#e3e0da' }} />
                  <div style={sim.stat}>
                    <span style={sim.statLabel}>Required</span>
                    <span style={sim.statVal}>{required}%</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div style={sim.emptyResult}>
                <Target size={20} style={{ color: '#c8c5bf', marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#b0ada8' }}>
                  Select a subject and adjust the sliders to see your projected attendance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

// ── Styles ──
const pg = {
  page: {
    padding:       '24px 16px',
    maxWidth:      1200,
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column',
    gap:           24,
  },
  header: {
    display:    'flex',
    alignItems: 'center',
    gap:        14,
    paddingTop: 8,
  },
  headerIcon: {
    width:          44,
    height:         44,
    background:     'var(--primary, #007aff)',
    borderRadius:   12,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  title:    { fontSize: 26, fontWeight: 800, color: '#0f0e0d', margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#8c8a87', marginTop: 3 },
  grid: {
    display:  'flex',
    gap:      16,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
};

const chat = {
  wrap: {
    flex:          2,
    minWidth:      280,
    background:    '#fff',
    border:        '0.5px solid #e3e0da',
    borderRadius:  14,
    display:       'flex',
    flexDirection: 'column',
    height:        620,
    overflow:      'hidden',
  },
  header: {
    padding:        '14px 18px',
    borderBottom:   '0.5px solid #f2f0ec',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    background:     '#faf9f7',
    flexShrink:     0,
  },
  onlineDot:   { width: 7, height: 7, borderRadius: '50%', background: '#0F6E56' },
  headerLabel: { fontSize: 12, fontWeight: 600, color: '#4a4845', letterSpacing: '0.02em' },

  quickRow: {
    display:    'flex',
    gap:        8,
    padding:    '10px 14px',
    borderBottom: '0.5px solid #f2f0ec',
    flexWrap:   'wrap',
    flexShrink: 0,
  },
  quickBtn: {
    fontSize:     11,
    fontWeight:   500,
    color:        '#8c8a87',
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 20,
    padding:      '5px 12px',
    cursor:       'pointer',
    whiteSpace:   'nowrap',
  },

  messageArea: {
    flex:          1,
    overflowY:     'auto',
    padding:       '16px 16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
  },
  bubble: {
    maxWidth:   '80%',
    padding:    '10px 14px',
    fontSize:   13,
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
  },
  typingWrap: {
    display:    'flex',
    gap:        4,
    padding:    '10px 14px',
    background: '#f5f4f1',
    borderRadius: '14px 14px 14px 4px',
    width:      'fit-content',
    alignItems: 'center',
  },
  typingDot: {
    width:        6,
    height:       6,
    borderRadius: '50%',
    background:   '#b0ada8',
  },

  inputArea: {
    padding:    '12px 14px',
    borderTop:  '0.5px solid #f2f0ec',
    flexShrink: 0,
  },
  inputRow: {
    display:    'flex',
    gap:        8,
    alignItems: 'center',
  },
  input: {
    flex:         1,
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 10,
    padding:      '10px 14px',
    fontSize:     13,
    color:        '#0f0e0d',
    outline:      'none',
    transition:   'border-color 0.15s',
  },
  sendBtn: {
    width:          38,
    height:         38,
    borderRadius:   10,
    border:         'none',
    background:     'var(--primary, #007aff)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
};

const sim = {
  wrap: {
    flex:          1,
    minWidth:      260,
    background:    '#fff',
    border:        '0.5px solid #e3e0da',
    borderRadius:  14,
    padding:       '20px',
    display:       'flex',
    flexDirection: 'column',
    gap:           20,
  },
  title:    { fontSize: 15, fontWeight: 700, color: '#0f0e0d', margin: 0 },
  subtitle: { fontSize: 12, color: '#8c8a87', marginTop: 3 },

  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 10, color: '#b0ada8', letterSpacing: '0.08em', textTransform: 'uppercase' },
  select: {
    background:   '#faf9f7',
    border:       '0.5px solid #e3e0da',
    borderRadius: 8,
    padding:      '9px 12px',
    fontSize:     13,
    fontWeight:   600,
    color:        '#0f0e0d',
    outline:      'none',
    appearance:   'none',
    cursor:       'pointer',
  },
  sliderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sliderVal: { fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif' },
  range:     { width: '100%', cursor: 'pointer', accentColor: 'inherit' },

  result: {
    background:    '#faf9f7',
    border:        '0.5px solid #e3e0da',
    borderRadius:  10,
    padding:       '16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
  },
  resultLabel: { fontSize: 10, color: '#b0ada8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 },
  resultPct:   { fontSize: 32, fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: -1, margin: 0 },
  track: {
    height:       6,
    background:   '#e3e0da',
    borderRadius: 99,
    overflow:     'visible',
    position:     'relative',
  },
  marker: {
    position:     'absolute',
    top:          -3,
    width:        2,
    height:       12,
    background:   '#8c8a87',
    borderRadius: 1,
    transform:    'translateX(-50%)',
    zIndex:       1,
  },
  bar: { height: '100%', borderRadius: 99 },
  resultNote: { fontSize: 12, color: '#4a4845', margin: 0, lineHeight: 1.5 },

  statRow: {
    display:        'flex',
    alignItems:     'stretch',
    gap:            0,
    borderTop:      '0.5px solid #e3e0da',
    paddingTop:     10,
    justifyContent: 'space-around',
  },
  stat:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 },
  statLabel: { fontSize: 9, color: '#b0ada8', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statVal:   { fontSize: 14, fontWeight: 700, color: '#0f0e0d' },

  emptyResult: {
    background:     '#faf9f7',
    border:         '0.5px dashed #e3e0da',
    borderRadius:   10,
    padding:        '24px 16px',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    textAlign:      'center',
  },
};

export default AIPlanner;