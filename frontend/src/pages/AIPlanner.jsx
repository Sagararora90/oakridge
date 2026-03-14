import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, BrainCircuit, Target, GraduationCap } from 'lucide-react';
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
    text: "Hi! I'm your AI strategist. I analyze your attendance patterns to help you optimize your schedule. Ask me anything about skipping classes or recovery plans."
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

  const getSkipAdvice = () => {
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const tomorrow  = new Date();
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
      const sub   = subjects.find(s => s._id === subId);
      if (!sub) return;
      const credit        = slot.credit || 1;
      const afterSkipPct  = (sub.attended / (sub.total + credit)) * 100;
      const safe          = afterSkipPct >= (sub.requiredAttendance || 75);
      results.push(
        `${safe ? '✅' : '❌'} ${sub.name} (${slot.time}): ${safe ? 'Safe to skip' : 'Must attend'} (Drops to ${afterSkipPct.toFixed(1)}%)`
      );
    });

    return `Here's your Skip-Safety report for ${tomorrowDay}:\n\n${results.join('\n')}`;
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
        return "All your subjects are above the required threshold. You're in excellent standing!";
      return "Here's what needs immediate attention:\n\n" + struggling.map(s => {
        const target = (s.requiredAttendance || 75) / 100;
        const needed = Math.ceil((target * s.total - s.attended) / (1 - target));
        return `🎯 ${s.name}: Attend the next ${Math.max(0, needed)} classes to hit your ${s.requiredAttendance || 75}% goal.`;
      }).join('\n');
    }

    return "I'm specialized in your academic data. Try asking:\n• \"Can I skip tomorrow?\"\n• \"What's my status?\"\n• \"Which subject needs attention?\"";
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
  const simResult   = selectedSub ? (() => {
    const newAttended = selectedSub.attended + simAttend;
    const newTotal    = selectedSub.total + simAttend + simSkip;
    return { pct: newTotal > 0 ? (newAttended / newTotal) * 100 : 0 };
  })() : null;

  const required = selectedSub?.requiredAttendance || 75;
  const isSafe   = simResult ? simResult.pct >= required : false;

  return (
    <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-6 lg:gap-8">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
               <GraduationCap size={16} color="#fff" />
             </div>
             <div>
               <h1 className="text-2xl lg:text-3xl font-bold text-[#0f0e0d] tracking-tight">AI Strategist</h1>
               <p className="text-xs lg:text-sm text-[#8c8a87] font-medium mt-1">Simulate projections and get real-time skipping advice.</p>
             </div>
          </div>
        </header>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

          {/* ── CHAT ── */}
          <div className="lg:col-span-2 bg-white border border-[#e3e0da] rounded-[32px] overflow-hidden flex flex-col h-[580px] lg:h-[620px] shadow-sm">
            <div className="flex items-center justify-between p-4 lg:p-5 border-b border-[#faf9f7] bg-[#faf9f7]/50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase text-[#0f0e0d] tracking-widest">Academic Agent v2.0</span>
               </div>
               <BrainCircuit size={18} className="text-primary opacity-50" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 no-scrollbar">
               <AnimatePresence>
                 {messages.map((msg, i) => (
                   <motion.div key={i} initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] lg:max-w-[75%] p-4 text-xs lg:text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-[24px_24px_4px_24px]' : 'bg-[#faf9f7] text-[#0f0e0d] rounded-[24px_24px_24px_4px] border border-[#e3e0da]'}`}>
                         {msg.text.split('\n').map((line, li) => (
                           <p key={li} className={li > 0 ? 'mt-2' : ''}>{line}</p>
                         ))}
                      </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
               {isTyping && (
                 <div className="bg-[#faf9f7] p-4 rounded-2xl border border-[#e3e0da] flex gap-1 items-center w-fit">
                    {[0, 0.1, 0.2].map(d => <div key={d} className="w-1.5 h-1.5 bg-[#8c8a87] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                 </div>
               )}
               <div ref={chatEndRef} />
            </div>

            <div className="p-4 lg:p-6 border-t border-[#e3e0da] space-y-4 shrink-0">
               <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => sendMessage(p)} className="text-[10px] font-black uppercase tracking-wider px-3 py-2 bg-[#faf9f7] border border-[#e3e0da] rounded-xl hover:border-primary/50 hover:text-primary transition-all active:scale-95">{p}</button>
                  ))}
               </div>
               <form onSubmit={handleSend} className="flex gap-3">
                  <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything about your schedule..." className="flex-1 bg-white border border-[#e3e0da] rounded-2xl px-5 py-3.5 text-sm font-bold text-[#0f0e0d] outline-none focus:border-primary/50 transition-all shadow-sm" />
                  <button type="submit" disabled={!input.trim()} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-30">
                    <Send size={18} />
                  </button>
               </form>
            </div>
          </div>

          {/* ── SIMULATOR ── */}
          <div className="bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm space-y-6">
             <div>
                <h2 className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">Scenario Simulator</h2>
                <p className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-widest mt-1">Impact Projections</p>
             </div>

             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-[#8c8a87] uppercase ml-1">Track Course</label>
                   <select value={simSubject} onChange={e => setSimSubject(e.target.value)} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-3 px-4 text-sm font-bold text-[#0f0e0d] outline-none appearance-none cursor-pointer">
                      <option value="">Choose subject...</option>
                      {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                   </select>
                </div>

                <div className="space-y-3 p-4 bg-[#faf9f7] rounded-2xl border border-[#e3e0da]">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest">Future Presences</span>
                      <span className="text-xl font-black italic text-green-600">{simAttend}</span>
                   </div>
                   <input type="range" min="0" max="50" value={simAttend} onChange={e => setSimAttend(parseInt(e.target.value))} className="w-full accent-green-600 cursor-pointer h-1.5 bg-[#e3e0da] rounded-full appearance-none" />
                </div>

                <div className="space-y-3 p-4 bg-[#faf9f7] rounded-2xl border border-[#e3e0da]">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest">Future Absences</span>
                      <span className="text-xl font-black italic text-red-600">{simSkip}</span>
                   </div>
                   <input type="range" min="0" max="15" value={simSkip} onChange={e => setSimSkip(parseInt(e.target.value))} className="w-full accent-red-600 cursor-pointer h-1.5 bg-[#e3e0da] rounded-full appearance-none" />
                </div>
             </div>

             {simResult && selectedSub ? (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-[#e3e0da] space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest block mb-2">Projected Status</span>
                    <div className={`text-4xl font-black italic tracking-tighter ${isSafe ? 'text-green-600' : 'text-red-600'}`}>
                       {simResult.pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="relative h-2.5 bg-[#e3e0da] rounded-full overflow-hidden">
                     <div className="absolute top-0 bottom-0 w-0.5 bg-neutral-400 z-10" style={{ left: `${required}%` }} />
                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, simResult.pct)}%` }} className={`h-full rounded-full transition-colors duration-500 ${isSafe ? 'bg-green-600' : 'bg-red-600'}`} />
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-white border border-[#e3e0da] rounded-2xl">
                     <Target size={18} className={isSafe ? 'text-green-600' : 'text-red-600'} />
                     <p className="text-[11px] font-bold leading-relaxed">{isSafe ? `Current strategy maintains health (Goal: ${required}%)` : `Current strategy violates threshold (Goal: ${required}%)`}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-[#e3e0da] border border-[#e3e0da] rounded-xl overflow-hidden">
                     <div className="bg-white p-3 flex flex-col items-center">
                        <span className="text-[9px] font-black text-[#8c8a87] uppercase">Current</span>
                        <span className="text-xs font-black text-[#0f0e0d]">{selectedSub.total > 0 ? (selectedSub.attended / selectedSub.total * 100).toFixed(1) : 0}%</span>
                     </div>
                     <div className="bg-white p-3 flex flex-col items-center">
                        <span className="text-[9px] font-black text-[#8c8a87] uppercase">Required</span>
                        <span className="text-xs font-black text-[#0f0e0d]">{required}%</span>
                     </div>
                  </div>
               </motion.div>
             ) : (
               <div className="py-12 text-center opacity-30">
                  <Sparkles size={32} className="mx-auto text-[#8c8a87] mb-3" />
                  <p className="text-[11px] font-bold text-[#0f0e0d]">Enter Scenario Parameters</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPlanner;