import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, BrainCircuit, Target, Menu, ChevronDown, ArrowUp } from 'lucide-react';
import useStore from '../store/useStore';

const QUICK_PROMPTS = [
  "Can I skip tomorrow?",
  "Overall status?",
  "Needs attention?",
];

const AIPlanner = () => {
  const { subjects, timetable, holidays, extraClasses, setSidebarOpen } = useStore();

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Hi! I'm your AI strategist. I analyze your attendance patterns to help you optimize your schedule. Ask me anything about skipping classes or recovery plans."
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [simSubject, setSimSubject] = useState('');
  const [simAttend, setSimAttend] = useState(5);
  const [simSkip, setSimSkip] = useState(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getSkipAdvice = () => {
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = dayNames[tomorrow.getDay()];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const holiday = (holidays || []).find(h => new Date(h.date).toISOString().split('T')[0] === tomorrowStr);
    if (holiday) return `Tomorrow is a registered holiday (${holiday.label}). Enjoy your day off!`;

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
      const sub = subjects.find(s => s._id === subId);
      if (!sub) return;
      const credit = slot.credit || 1;
      const afterSkipPct = (sub.attended / (sub.total + credit)) * 100;
      const safe = afterSkipPct >= (sub.requiredAttendance || 75);
      results.push(`${safe ? '✅' : '❌'} ${sub.name} (${slot.time}): ${safe ? 'Safe to skip' : 'Must attend'} — drops to ${afterSkipPct.toFixed(1)}%`);
    });

    return `Skip-safety report for ${tomorrowDay}:\n\n${results.join('\n')}`;
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
        return "All subjects are above the required threshold. You're in excellent standing!";
      return "Subjects needing attention:\n\n" + struggling.map(s => {
        const target = (s.requiredAttendance || 75) / 100;
        if (target >= 1) {
          return `🎯 ${s.name}: You must attend EVERY remaining class to reach 100%`;
        }
        const needed = Math.ceil((target * s.total - s.attended) / (1 - target));
        return `🎯 ${s.name}: Attend next ${Math.max(0, needed)} classes to reach ${s.requiredAttendance || 75}%`;
      }).join('\n');
    }

    return "I'm specialized in your academic data. Try:\n• \"Can I skip tomorrow?\"\n• \"What's my status?\"\n• \"Which subject needs attention?\"";
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

  const selectedSub = subjects.find(s => s._id === simSubject);
  const simResult = selectedSub ? (() => {
    const newAttended = selectedSub.attended + simAttend;
    const newTotal = selectedSub.total + simAttend + simSkip;
    return { pct: newTotal > 0 ? (newAttended / newTotal) * 100 : 0 };
  })() : null;

  const required = selectedSub?.requiredAttendance || 75;
  const isSafe = simResult ? simResult.pct >= required : false;
  const currentPct = selectedSub && selectedSub.total > 0 ? (selectedSub.attended / selectedSub.total * 100) : 0;

  return (
    <div className="ap-root">
      <div className="ap-bg-mesh" />

      <div className="ap-container">

        {/* HEADER */}
        <header className="ap-header">
          <div className="ap-header-left">
            <div>
              <div className="ap-eyebrow">
                <span className="ap-live-dot" />
                AI Strategist
              </div>
              <h1 className="ap-title">Academic Planner</h1>
            </div>
          </div>
          <div className="ap-badge">
            <BrainCircuit size={12} style={{ color: 'var(--color-subtext)' }} />
            <span className="ap-badge-text">v2.1</span>
          </div>
        </header>

        {/* GRID */}
        <div className="ap-grid">

          {/* ── CHAT ── */}
          <div className="ap-chat-panel">
            <div className="ap-messages no-scrollbar">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`ap-msg-row ${msg.role === 'user' ? 'ap-msg-user' : 'ap-msg-ai'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="ap-ai-icon">
                        <Sparkles size={10} color="#fff" />
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'ap-bubble-user' : 'ap-bubble-ai'}>
                      {msg.text.split('\n').map((line, li) => (
                        <p key={li} style={{ margin: li > 0 ? '4px 0 0' : '0', lineHeight: 1.55 }}>{line}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ap-msg-row ap-msg-ai"
                >
                  <div className="ap-ai-icon"><Sparkles size={10} color="#fff" /></div>
                  <div className="ap-typing-bubble">
                    <span className="ap-dot" style={{ animationDelay: '0s' }} />
                    <span className="ap-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="ap-dot" style={{ animationDelay: '0.3s' }} />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="ap-input-area">
              <div className="ap-quick-row">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} className="ap-quick-btn" onClick={() => sendMessage(p)}>{p}</button>
                ))}
              </div>
              <form onSubmit={handleSend} className="ap-input-row">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your schedule…"
                  className="ap-text-input"
                />
                <button type="submit" disabled={!input.trim()} className="ap-send-btn">
                  <ArrowUp size={15} color="#fff" strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>

          {/* ── SIMULATOR ── */}
          <div className="ap-sim-panel">
            <div className="ap-sim-header">
              <div>
                <p className="ap-sim-eyebrow">Scenario Simulator</p>
                <h2 className="ap-sim-title">Impact Projection</h2>
              </div>
              <div className="ap-badge" style={{ background: 'var(--color-primary-lo)' }}>
                <Target size={12} style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>

            {/* Subject select */}
            <div className="ap-field">
              <label className="ap-field-label">Course</label>
              <div style={{ position: 'relative' }}>
                <select value={simSubject} onChange={e => setSimSubject(e.target.value)} className="ap-select">
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <ChevronDown size={13} className="ap-select-icon" />
              </div>
            </div>

            {/* Sliders */}
            <div className="ap-sliders-card">
              <SliderRow label="Presences" value={simAttend} min={0} max={50} onChange={v => setSimAttend(v)} color="var(--color-success)" />
              <div className="ap-slider-divider" />
              <SliderRow label="Absences" value={simSkip} min={0} max={15} onChange={v => setSimSkip(v)} color="var(--color-danger)" />
            </div>

            {/* Result */}
            <AnimatePresence mode="wait">
              {simResult && selectedSub ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="ap-result-card"
                >
                  <div className="ap-result-top">
                    <div>
                      <p className="ap-result-label">Projected</p>
                      <div className="ap-result-num-row">
                        <span className="ap-result-pct" style={{ color: isSafe ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {simResult.pct.toFixed(1)}
                        </span>
                        <span className="ap-result-pct-sym">%</span>
                      </div>
                    </div>
                    <div className="ap-status-pill" style={{ background: isSafe ? 'var(--color-success-lo)' : 'var(--color-danger-lo)' }}>
                      <span className="ap-status-dot" style={{ background: isSafe ? 'var(--color-success)' : 'var(--color-danger)' }} />
                      <span className="ap-status-text" style={{ color: isSafe ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isSafe ? 'Safe' : 'At Risk'}
                      </span>
                    </div>
                  </div>

                  <div className="ap-progress-track">
                    <motion.div
                      className="ap-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, simResult.pct)}%` }}
                      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ background: isSafe ? 'var(--color-success)' : 'var(--color-danger)' }}
                    />
                    <div className="ap-threshold-mark" style={{ left: `${required}%` }} />
                  </div>
                  <div className="ap-progress-labels">
                    <span>0%</span>
                    <span style={{ color: 'var(--color-primary)' }}>Goal: {required}%</span>
                    <span>100%</span>
                  </div>

                  <div className="ap-stats-row">
                    <div className="ap-stat-cell">
                      <span className="ap-stat-label">Current</span>
                      <span className="ap-stat-val">{currentPct.toFixed(1)}%</span>
                    </div>
                    <div className="ap-stat-div" />
                    <div className="ap-stat-cell">
                      <span className="ap-stat-label">Required</span>
                      <span className="ap-stat-val">{required}%</span>
                    </div>
                    <div className="ap-stat-div" />
                    <div className="ap-stat-cell">
                      <span className="ap-stat-label">Delta</span>
                      <span className="ap-stat-val" style={{ color: simResult.pct - currentPct >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {simResult.pct - currentPct >= 0 ? '+' : ''}{(simResult.pct - currentPct).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ap-empty">
                  <div className="ap-empty-icon"><Sparkles size={18} color="var(--color-subtext)" style={{ opacity: 0.4 }} /></div>
                  <p className="ap-empty-text">Select a subject to simulate impact</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        .ap-root {
          min-height: 100vh;
          background: var(--color-bg);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif;
          position: relative;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .ap-bg-mesh {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 70% 50% at 15% -5%, var(--color-primary-lo) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 105%, var(--color-success-lo) 0%, transparent 60%);
          opacity: 0.6;
        }
        .ap-container {
          position: relative; z-index: 1;
          max-width: 1080px; margin: 0 auto;
          padding: 28px 18px 80px;
          display: flex; flex-direction: column; gap: 22px;
        }
        /* Header */
        .ap-header { display: flex; align-items: center; justify-content: space-between; }
        .ap-header-left { display: flex; align-items: center; gap: 10px; }
        .ap-eyebrow {
          display: flex; align-items: center; gap: 6px;
          font-size: 10.5px; font-weight: 600; color: var(--color-primary);
          letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 3px;
        }
        .ap-live-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--color-success);
          display: inline-block; box-shadow: 0 0 0 2.5px var(--color-success-lo);
          animation: ap-pulse 2s infinite;
        }
        .ap-title {
          margin: 0; font-size: 24px; font-weight: 700; color: var(--color-text);
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .ap-badge {
          display: flex; align-items: center; gap: 5px;
          background: var(--color-surface); border-radius: 20px; padding: 5px 10px;
          border: 1px solid var(--color-border);
        }
        .ap-badge-text { font-size: 11px; font-weight: 700; color: var(--color-subtext); }

        /* Grid */
        .ap-grid {
          display: grid; grid-template-columns: 1fr; gap: 14px;
        }
        @media (min-width: 860px) {
          .ap-grid { grid-template-columns: 1fr 340px; gap: 14px; align-items: start; }
        }

        /* Chat panel */
        .ap-chat-panel {
          background: var(--color-card-bg);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: 18px;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xl);
          display: flex; flex-direction: column; height: 540px; overflow: hidden;
        }
        @media (min-width: 860px) { .ap-chat-panel { height: 600px; } }

        .ap-messages {
          flex: 1; overflow-y: auto; padding: 18px 18px 6px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .ap-msg-row { display: flex; align-items: flex-end; gap: 7px; }
        .ap-msg-user { justify-content: flex-end; }
        .ap-msg-ai { justify-content: flex-start; }

        .ap-ai-icon {
          width: 20px; height: 20px; border-radius: 50%; background: var(--color-primary);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; align-self: flex-start; margin-top: 1px;
        }
        .ap-bubble-user {
          background: var(--color-primary); color: #fff;
          border-radius: 18px 18px 5px 18px;
          padding: 9px 14px; font-size: 13.5px; font-weight: 400;
          max-width: 76%; letter-spacing: -0.01em; line-height: 1.5;
        }
        .ap-bubble-ai {
          background: var(--color-bg); color: var(--color-text);
          border-radius: 18px 18px 18px 5px;
          padding: 9px 14px; font-size: 13.5px; font-weight: 500;
          max-width: 78%; letter-spacing: -0.01em;
          border: 0.5px solid var(--color-border);
        }
        .ap-typing-bubble {
          background: var(--color-surface); border-radius: 18px 18px 18px 5px;
          padding: 12px 16px; display: flex; gap: 5px; align-items: center;
          border: 1px solid var(--color-border);
        }
        .ap-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--color-subtext);
          display: inline-block; animation: ap-bounce 1.2s infinite;
        }

        .ap-input-area {
          padding: 11px 14px 14px;
          border-top: 1px solid var(--color-border);
          display: flex; flex-direction: column; gap: 9px;
          background: var(--color-bg);
          backdrop-filter: blur(12px);
        }
        .ap-quick-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .ap-quick-btn {
          font-size: 11.5px; font-weight: 500; color: var(--color-subtext);
          padding: 5px 11px; border-radius: 20px;
          background: var(--color-surface); border: 1px solid var(--color-border);
          cursor: pointer; letter-spacing: -0.01em; font-family: inherit;
          transition: all 0.15s ease; white-space: nowrap;
        }
        .ap-quick-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-lo); }
        .ap-quick-btn:active { transform: scale(0.96); }

        .ap-input-row { display: flex; gap: 8px; align-items: center; }
        .ap-text-input {
          flex: 1; background: var(--color-surface);
          border: 1px solid var(--color-border); border-radius: 13px;
          padding: 9.5px 15px; font-size: 13.5px; font-weight: 400;
          color: var(--color-text); outline: none; font-family: inherit;
          letter-spacing: -0.01em; transition: border-color 0.2s;
        }
        .ap-text-input:focus { border-color: var(--color-primary); }
        .ap-text-input::placeholder { color: var(--color-subtext); }
        .ap-send-btn {
          width: 36px; height: 36px; flex-shrink: 0;
          background: var(--color-primary); border: none; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 8px var(--color-primary-lo);
          transition: all 0.15s ease;
        }
        .ap-send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .ap-send-btn:active:not(:disabled) { transform: scale(0.95); }
        .ap-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Simulator */
        .ap-sim-panel {
          background: var(--color-card-bg);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: 18px;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xl);
          padding: 18px; display: flex; flex-direction: column; gap: 16px;
        }
        .ap-sim-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .ap-sim-eyebrow {
          margin: 0 0 3px; font-size: 10.5px; font-weight: 600; color: var(--color-primary);
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .ap-sim-title {
          margin: 0; font-size: 19px; font-weight: 700; color: var(--color-text); letter-spacing: -0.03em;
        }

        .ap-field { display: flex; flex-direction: column; gap: 5px; }
        .ap-field-label {
          font-size: 10.5px; font-weight: 600; color: var(--color-subtext);
          letter-spacing: 0.05em; text-transform: uppercase; padding-left: 2px;
        }
        .ap-select {
          width: 100%; padding: 9.5px 34px 9.5px 13px;
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: 12px; font-size: 13.5px; font-weight: 400; color: var(--color-text);
          cursor: pointer; font-family: inherit; outline: none;
          -webkit-appearance: none; appearance: none;
          transition: border-color 0.2s; letter-spacing: -0.01em;
        }
        .ap-select:focus { border-color: var(--color-primary); }
        .ap-select-icon {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          color: var(--color-subtext); pointer-events: none;
        }

        .ap-sliders-card {
          background: var(--color-surface); border-radius: 13px; padding: 14px;
          border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 12px;
        }
        .ap-slider-divider { height: 1px; background: var(--color-border); margin: 1px 0; }

        /* Result */
        .ap-result-card {
          background: var(--color-surface); border-radius: 14px; padding: 14px;
          border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 12px;
        }
        .ap-result-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .ap-result-label {
          margin: 0 0 1px; font-size: 10.5px; font-weight: 600;
          color: rgba(60,60,67,0.45); letter-spacing: 0.05em; text-transform: uppercase;
        }
        .ap-result-num-row { display: flex; align-items: baseline; gap: 3px; }
        .ap-result-pct { font-size: 40px; font-weight: 700; letter-spacing: -0.05em; line-height: 1; }
        .ap-result-pct-sym { font-size: 17px; font-weight: 700; color: var(--color-subtext); }
        .ap-status-pill { display: flex; align-items: center; gap: 5px; border-radius: 20px; padding: 5px 10px; }
        .ap-status-dot { width: 5px; height: 5px; border-radius: 50%; }
        .ap-status-text { font-size: 12px; font-weight: 600; letter-spacing: -0.01em; }

        .ap-progress-track {
          height: 4px; background: var(--color-border); border-radius: 2px;
          position: relative; overflow: hidden;
        }
        .ap-progress-fill { height: 100%; border-radius: 2px; position: absolute; top: 0; left: 0; }
        .ap-threshold-mark {
          position: absolute; top: -3px; bottom: -3px; width: 2px;
          background: rgba(0,122,255,0.5); border-radius: 1px; z-index: 2;
        }
        .ap-progress-labels {
          display: flex; justify-content: space-between; margin-top: -2px;
          font-size: 9.5px; font-weight: 700; color: var(--color-subtext); letterSpacing: 0.02em;
        }

        .ap-stats-row {
          display: flex; background: var(--color-bg); border-radius: 11px;
          overflow: hidden; border: 1px solid var(--color-border);
        }
        .ap-stat-cell {
          flex: 1; padding: 9px 6px;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .ap-stat-div { width: 1px; background: var(--color-border); align-self: stretch; }
        .ap-stat-label {
          font-size: 9px; font-weight: 600; color: var(--color-subtext);
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .ap-stat-val { font-size: 13.5px; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; }

        /* Empty state */
        .ap-empty {
          padding: 24px 12px; display: flex; flex-direction: column;
          align-items: center; gap: 9px;
        }
        .ap-empty-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: var(--color-surface);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--color-border);
        }
        .ap-empty-text {
          margin: 0; font-size: 12.5px; font-weight: 600;
          color: var(--color-subtext); letterSpacing: -0.01em; text-align: center;
        }

        /* Animations */
        @keyframes ap-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 2.5px rgba(52,199,89,0.2); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(52,199,89,0.1); }
        }
        @keyframes ap-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }

        /* Range slider */
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-runnable-track {
          height: 4px; border-radius: 2px; background: var(--color-border);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 17px; height: 17px; border-radius: 50%;
          background: var(--color-text); margin-top: -6.5px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer; transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:active { transform: scale(1.18); }
      `}</style>
    </div>
  );
};

const SliderRow = ({ label, value, min, max, onChange, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-subtext)', letterSpacing: '-0.01em' }}>{label}</span>
      <span style={{ fontSize: 19, fontWeight: 700, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
    </div>
    <input
      type="range" min={min} max={max} value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      style={{ width: '100%', accentColor: color, outline: 'none', cursor: 'pointer' }}
    />
  </div>
);

export default AIPlanner;