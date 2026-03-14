import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { Activity, Target, Award, ShieldAlert, GraduationCap, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import useStore from '../store/useStore';
import RescuePlanModal from '../components/RescuePlanModal';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { subjects } = useStore();
  const [rescueSubject, setRescueSubject] = React.useState(null);

  // ── Data ──
  const pieData = subjects.map(s => ({
    name:  s.name,
    value: s.attended,
    color: s.color || '#185FA5',
  }));

  const barData = subjects.map(s => ({
    name:     s.name.length > 8 ? s.name.substring(0, 7) + '...' : s.name,
    fullName: s.name,
    Attended: s.attended,
    Missed:   s.total - s.attended,
    color:    s.color || '#185FA5',
  }));

  const avgAttendance = subjects.length > 0
    ? subjects.reduce((acc, s) =>
        acc + (s.total > 0 ? (s.attended / s.total) * 100 : 0), 0
      ) / subjects.length
    : 0;

  const totalAttended = subjects.reduce((a, s) => a + s.attended, 0);
  const totalClasses  = subjects.reduce((a, s) => a + s.total,    0);
  const totalMissed   = totalClasses - totalAttended;

  const ranked = [...subjects].sort((a, b) => {
    const pa = a.total > 0 ? a.attended / a.total : 0;
    const pb = b.total > 0 ? b.attended / b.total : 0;
    return pb - pa;
  });
  const best  = ranked[0];
  const worst = ranked[ranked.length - 1];

  if (subjects.length === 0) {
    return (
      <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
        <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-6">📊</div>
            <p className="text-base font-bold text-[#0f0e0d]">No data to analyze</p>
            <p className="text-xs text-[#8c8a87] font-medium mt-2 max-w-[200px]">Add subjects and mark attendance to unlock your performance insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-8">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
               <GraduationCap size={16} color="#fff" />
             </div>
             <div>
               <h1 className="text-2xl lg:text-3xl font-bold text-[#0f0e0d] tracking-tight">Analytics</h1>
               <p className="text-xs lg:text-sm text-[#8c8a87] font-medium mt-1">Deep dive into your academic engagement and trends.</p>
             </div>
          </div>
          <div className="bg-white border border-[#e3e0da] rounded-2xl p-4 lg:p-5 flex flex-col items-center min-w-[140px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: avgAttendance >= 75 ? '#0F6E56' : '#A32D2D' }} />
            <span className="text-[9px] font-black text-[#8c8a87] uppercase tracking-widest mb-1.5">Overall Weighted Score</span>
            <span className={`text-3xl font-black italic tracking-tighter ${avgAttendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {avgAttendance.toFixed(1)}%
            </span>
          </div>
        </header>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {[
            { label: 'Total Attended', value: totalAttended, color: '#0F6E56', icon: <TrendingUp size={14} /> },
            { label: 'Total Missed',   value: totalMissed,   color: '#A32D2D', icon: <TrendingDown size={14} /> },
            { label: 'Courses Tracked',value: subjects.length, color: '#185FA5', icon: <BookOpen size={14} /> },
            { label: 'Sessions Logged',value: totalClasses,  color: '#3C3489', icon: <Activity size={14} /> },
          ].map((s, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="bg-white border border-[#e3e0da] border-t-[3px] rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-xl transition-all" style={{ borderTopColor: s.color }}>
               <div className="flex items-center justify-between mb-3" style={{ color: s.color }}>
                  {s.icon}
                  <div className="w-1.5 h-1.5 rounded-full opacity-20" style={{ background: s.color }} />
               </div>
               <div className="text-2xl lg:text-3xl font-black italic tracking-tighter text-[#0f0e0d] leading-none mb-1">{s.value}</div>
               <div className="text-[10px] font-black uppercase text-[#8c8a87] tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── CHARTS ROW 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col gap-6">
             <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">Presence Distribution</h2>
                  <p className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-widest mt-1">Attended vs Missed Comparison</p>
               </div>
               <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-green-600"><div className="w-2 h-2 rounded-full bg-green-600" /> Attended</div>
                  <div className="flex items-center gap-1.5 text-red-600"><div className="w-2 h-2 rounded-full bg-red-600" /> Missed</div>
               </div>
             </div>
             
             <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="areaRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A32D2D" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#A32D2D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8c8a87', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e3e0da', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="Attended" stroke="#0F6E56" strokeWidth={3} fill="url(#areaGreen)" dot={{ r: 4, fill: '#fff', stroke: '#0F6E56', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="Missed" stroke="#A32D2D" strokeWidth={3} fill="url(#areaRed)" dot={{ r: 4, fill: '#fff', stroke: '#A32D2D', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col">
             <div className="mb-6">
                <h2 className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">Load Balance</h2>
                <p className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-widest mt-1">Subject Weightage</p>
             </div>
             <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e3e0da', borderRadius: '16px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-2xl font-black italic italic-0 text-[#0f0e0d] leading-none">{totalAttended}</span>
                   <span className="text-[9px] font-black text-[#8c8a87] uppercase tracking-tighter mt-1">Sessions</span>
                </div>
             </div>
             <div className="mt-8 space-y-3">
                {subjects.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-[11px] font-bold text-[#0f0e0d] truncate">{s.name}</span>
                     </div>
                     <span className="text-[11px] font-black text-[#8c8a87] shrink-0">{s.attended}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* ── BAR CHART ── */}
        <div className="bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm space-y-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                 <h2 className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">Comparative Analysis</h2>
                 <p className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-widest mt-1">Performance Benchmarking</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 text-green-600"><div className="w-3 h-3 rounded-md bg-green-600" /> Attended</div>
                  <div className="flex items-center gap-1.5 text-red-600/30"><div className="w-3 h-3 rounded-md bg-red-600/30" /> Missed</div>
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8c8a87', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8a87', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#faf9f7' }} contentStyle={{ background: '#fff', border: '1px solid #e3e0da', borderRadius: '16px', fontSize: '11px' }} />
                  <Bar dataKey="Attended" fill="#0F6E56" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="Missed" fill="#A32D2D" fillOpacity={0.15} radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* ── INSIGHTS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
           <div className="bg-white border border-[#e3e0da] rounded-[24px] p-6 shadow-sm flex flex-col h-full hover:shadow-xl transition-all">
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center mb-5 border border-primary/10">
                 <Target size={18} className="text-primary" />
              </div>
              <h3 className="text-sm font-black text-[#0f0e0d] uppercase tracking-wider mb-2">Efficiency Rating</h3>
              <p className="text-xs font-medium text-[#8c8a87] leading-relaxed flex-1">
                 {avgAttendance >= 75 
                   ? "You're consistently meeting the 75% engagement threshold. Keep this momentum to secure your semester goals."
                   : "Your current engagement is below the mandatory 75%. Prioritize subjects with a 'Warning' status to recover."}
              </p>
           </div>

           <div className="bg-white border border-[#e3e0da] rounded-[24px] p-6 shadow-sm flex flex-col h-full hover:shadow-xl transition-all">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-5 border border-green-100">
                 <Award size={18} className="text-green-600" />
              </div>
              <h3 className="text-sm font-black text-[#0f0e0d] uppercase tracking-wider mb-2">Strongest Subject</h3>
              <p className="text-xs font-medium text-[#8c8a87] leading-relaxed flex-1">
                 {best ? `${best.name} is your benchmark subject with ${best.total > 0 ? (best.attended / best.total * 100).toFixed(1) : 0}% attendance. Use its study schedule as a model for others.` : "No data available yet."}
              </p>
           </div>

           <div className="bg-white border border-orange-100 rounded-[24px] p-6 shadow-sm flex flex-col h-full border-b-[3px] border-b-orange-400 group relative">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-5 border border-orange-100">
                 <Activity size={18} className="text-orange-600" />
              </div>
              <h3 className="text-sm font-black text-[#0f0e0d] uppercase tracking-wider mb-2">Rescue Target</h3>
              <div className="flex-1">
                 {worst && worst !== best ? (
                   <div className="space-y-4">
                      <p className="text-xs font-medium text-[#8c8a87] leading-relaxed">
                        {worst.name} requires intervention at {worst.total > 0 ? (worst.attended / worst.total * 100).toFixed(1) : 0}%. Let's build a recovery strategy.
                      </p>
                      <button 
                        onClick={() => setRescueSubject(worst)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                      >
                         <ShieldAlert size={14} /> Calculate Strategy
                      </button>
                   </div>
                 ) : (
                   <p className="text-xs font-medium text-[#8c8a87] leading-relaxed">All subjects are performing within the same deviation range. No critical outliers detected.</p>
                 )}
              </div>
           </div>
        </div>

        {/* ── RESCUE MODAL ── */}
        <AnimatePresence>
          {rescueSubject && (
            <RescuePlanModal subject={rescueSubject} onClose={() => setRescueSubject(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Analytics;