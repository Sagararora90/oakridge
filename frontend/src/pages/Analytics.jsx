import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { Activity, Target, Award, ShieldAlert, GraduationCap, TrendingUp, TrendingDown, BookOpen, Menu, Sparkles, Filter } from 'lucide-react';
import useStore from '../store/useStore';
import RescuePlanModal from '../components/RescuePlanModal';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { subjects, setSidebarOpen } = useStore();
  const [rescueSubject, setRescueSubject] = React.useState(null);

  // ── Data ──
  const pieData = subjects.map(s => ({
    name:  s.name,
    value: s.attended,
    color: s.color || '#4F46E5',
  }));

  const barData = subjects.map(s => ({
    name:     s.name.substring(0, 3).toUpperCase(),
    fullName: s.name,
    Attended: s.attended,
    Missed:   s.total - s.attended,
    color:    s.color || '#4F46E5',
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
      <div className="flex-1 bg-[var(--color-bg)] min-h-screen pb-24 animate-in relative z-10 flex flex-col items-center justify-center">
        <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 nebula-glass rounded-[2rem] flex items-center justify-center mb-8 opacity-20">
              <Activity size={40} className="text-[var(--color-subtext)]" />
            </div>
            <h3 className="text-2xl font-black text-[var(--color-text)] tracking-tight">ANALYSIS OFFLINE</h3>
            <p className="text-xs font-bold text-[var(--color-subtext)] mt-3 uppercase tracking-[0.2em] opacity-60 max-w-[280px]">No academic telemetry detected for processing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--color-bg)] min-h-screen pb-24 animate-in relative z-10 p-4 lg:p-10">
      <div className="max-w-[1600px] mx-auto space-y-8 lg:space-y-12">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-12 h-12 nebula-glass rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Menu size={20} className="text-primary" />
            </button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-[var(--color-text)] tracking-tighter leading-none mb-2">INTELLIGENCE</h1>
              <p className="text-[10px] font-black text-[var(--color-subtext)] uppercase tracking-[0.2em] opacity-60">Deep Telemetry & Predictive Insights</p>
            </div>
          </div>
          <div className="apple-card px-8 py-5 flex flex-col items-center min-w-[200px] shadow-2xl relative group border-primary/20 bg-gradient-to-br from-surface/40 to-primary/5">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 opacity-80">Aggregate Efficiency</span>
            <div className="text-5xl font-black tracking-tighter text-[var(--color-text)] leading-none flex items-baseline gap-1">
              {avgAttendance.toFixed(1)}
              <span className="text-xl opacity-40">%</span>
            </div>
            <div className={`absolute -bottom-1 left-0 h-1 rounded-full transition-all duration-1000`} style={{ width: `${avgAttendance}%`, background: avgAttendance >= 75 ? 'var(--secondary)' : 'var(--danger)' }} />
          </div>
        </header>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { label: 'Attended', value: totalAttended, color: 'var(--secondary)', icon: <TrendingUp size={22} /> },
            { label: 'Missed',   value: totalMissed,   color: 'var(--danger)', icon: <TrendingDown size={22} /> },
            { label: 'Modules',  value: subjects.length, color: 'var(--primary)', icon: <BookOpen size={22} /> },
            { label: 'Total',    value: totalClasses,  color: 'var(--accent)', icon: <Activity size={22} /> },
          ].map((s, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -6, scale: 1.02 }} 
              className="apple-card p-8 flex flex-col justify-between group relative shadow-xl"
            >
               <div className="w-14 h-14 rounded-2xl nebula-glass flex items-center justify-center mb-6 shadow-inner" style={{ color: s.color }}>
                  {s.icon}
               </div>
               <div>
                 <div className="text-4xl font-black text-[var(--color-text)] tracking-tighter mb-1">{s.value}</div>
                 <div className="text-[10px] font-black text-[var(--color-subtext)] uppercase tracking-widest opacity-60">{s.label}</div>
               </div>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 blur-3xl opacity-5 rounded-full" style={{ background: s.color }} />
            </motion.div>
          ))}
        </div>

        {/* ── CHARTS ROW 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 apple-card p-8 lg:p-12 shadow-2xl flex flex-col gap-10">
             <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tighter leading-none mb-2">TELEMETRY FLOW</h2>
                  <p className="text-[10px] font-black text-[var(--color-subtext)] uppercase tracking-widest opacity-60">Temporal Presence Distribution</p>
               </div>
               <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2 text-primary"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> Attended</div>
                  <div className="flex items-center gap-2 text-danger"><div className="w-2.5 h-2.5 rounded-full bg-danger opacity-40" /> Missed</div>
               </div>
             </div>
             
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-subtext)', fontSize: 10, fontWeight: 900 }} dy={15} />
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }} />
                    <Area type="monotone" dataKey="Attended" stroke="var(--primary)" strokeWidth={4} fill="url(#areaGradient)" dot={{ r: 5, fill: '#fff', stroke: 'var(--primary)', strokeWidth: 3 }} activeDot={{ r: 8, fill: 'var(--primary)', stroke: '#fff', strokeWidth: 3 }} />
                    <Area type="monotone" dataKey="Missed" stroke="var(--danger)" strokeWidth={2} strokeDasharray="6 6" fill="transparent" opacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="apple-card p-8 lg:p-10 shadow-2xl flex flex-col">
             <div className="mb-8">
                <h2 className="text-2xl font-black text-[var(--color-text)] tracking-tighter leading-none mb-2">EQUILIBRIUM</h2>
                <p className="text-[10px] font-black text-[var(--color-subtext)] uppercase tracking-widest opacity-60">Module Load Balance</p>
             </div>
             <div className="h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.9} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 800 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-4xl font-black text-[var(--color-text)] tracking-tighter leading-none">{totalAttended}</span>
                   <span className="text-[9px] font-black text-[var(--color-subtext)] uppercase tracking-widest opacity-60 mt-2">Sessions</span>
                </div>
             </div>
             <div className="mt-10 space-y-4">
                {subjects.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: s.color }} />
                        <span className="text-[11px] font-black text-[var(--color-text)] truncate uppercase tracking-tight">{s.name}</span>
                     </div>
                     <span className="text-[11px] font-black text-[var(--color-subtext)] shrink-0 opacity-60">{s.attended}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* ── INSIGHTS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
           <motion.div whileHover={{ y: -8 }} className="apple-card p-10 flex flex-col h-full shadow-2xl group">
              <div className="w-14 h-14 nebula-glass rounded-2xl flex items-center justify-center mb-8 shadow-inner border-primary/20">
                 <Target size={24} className="text-primary" />
              </div>
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest mb-4">Oracle's Verdict</h3>
              <p className="text-xs font-bold text-[var(--color-subtext)] leading-relaxed flex-1 opacity-80 uppercase tracking-tight">
                 {avgAttendance >= 75 
                   ? "Consistent threshold convergence detected. Optimal engagement levels maintained within target parameters."
                   : "Critical threshold violation. System engagement is below 75% baseline. Intervention required immediately."}
              </p>
           </motion.div>

           <motion.div whileHover={{ y: -8 }} className="apple-card p-10 flex flex-col h-full shadow-2xl group border-secondary/20">
              <div className="w-14 h-14 nebula-glass rounded-2xl flex items-center justify-center mb-8 shadow-inner border-secondary/20">
                 <Award size={24} className="text-secondary" />
              </div>
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest mb-4">Apex Performer</h3>
              <p className="text-xs font-bold text-[var(--color-subtext)] leading-relaxed flex-1 opacity-80 uppercase tracking-tight">
                 {best ? `${best.name.toUpperCase()} is your standard-bearer at ${best.total > 0 ? (best.attended / best.total * 100).toFixed(1) : 0}%. Synchronize other modules to this baseline.` : "Awaiting telemetry data..."}
              </p>
           </motion.div>

           <motion.div whileHover={{ y: -8 }} className="apple-card p-10 flex flex-col h-full shadow-2xl border-danger/20 group relative overflow-hidden">
              <div className="w-14 h-14 nebula-glass rounded-2xl flex items-center justify-center mb-8 shadow-inner border-danger/20">
                 <ShieldAlert size={24} className="text-danger" />
              </div>
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest mb-4">Critical Outlier</h3>
              <div className="flex-1">
                 {worst && worst !== best ? (
                   <div className="space-y-6">
                      <p className="text-xs font-bold text-[var(--color-subtext)] leading-relaxed opacity-80 uppercase tracking-tight">
                        {worst.name.toUpperCase()} is underperforming at {(worst.attended / worst.total * 100).toFixed(1)}%. Deploy rescue protocol.
                      </p>
                      <button 
                        onClick={() => setRescueSubject(worst)}
                        className="btn-nebula w-full !py-3 bg-gradient-to-br from-danger to-accent shadow-danger/20 text-[9px]"
                      >
                         <Sparkles size={14} /> COMMENCE RESCUE
                      </button>
                   </div>
                 ) : (
                   <p className="text-xs font-bold text-[var(--color-subtext)] leading-relaxed opacity-80 uppercase tracking-tight">All academic subsystems are operating within synchronized parameters.</p>
                 )}
              </div>
           </motion.div>
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