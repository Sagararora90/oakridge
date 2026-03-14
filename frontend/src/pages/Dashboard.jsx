import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, XCircle, TrendingUp,
  Calendar, Bell, Search, GraduationCap,
  Check, X, RotateCcw, ChevronDown, Plus, Loader2
} from 'lucide-react';
import useStore from '../store/useStore';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import { StatSkeleton, SlotSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const {
    user,
    fetchUser,
    subjects,
    fetchSubjects,
    fetchGamification,
    timetable,
    fetchTimetable,
    extraClasses,
    fetchExtraClasses,
    markAttendance,
    undoAttendance,
    fetchAIBrief,
    autoFillMissed,
    notifications,
    fetchNotifications,
    markNotificationsRead
  } = useStore();

  useEffect(() => {
    fetchUser();
    fetchSubjects();
    fetchTimetable();
    fetchExtraClasses();
    fetchGamification();
    fetchAIBrief();
    fetchNotifications();
  }, [fetchUser, fetchSubjects, fetchTimetable, fetchExtraClasses, fetchGamification, fetchAIBrief, fetchNotifications]);

  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSlotMenu, setOpenSlotMenu] = useState(null); // track which slot's menu is open
  const unreadCount = notifications.filter(n => !n.read).length;
  const [extraForm, setExtraForm] = useState({ subjectId: '', status: 'Present', credit: 1, date: new Date().toISOString().split('T')[0] });

  // ── Calculations ──
  const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalClasses  = subjects.reduce((acc, s) => acc + s.total, 0);
  const avgPct        = totalClasses > 0 ? (totalAttended / totalClasses * 100).toFixed(1) : 0;

  let totalBunksAvailable = 0;
  let totalClassesNeeded = 0;

  subjects.forEach(sub => {
    const req = (sub.requiredAttendance || 75) / 100;
    const margin = sub.attended - (req * sub.total);
    if (margin > 0) {
      const bunks = Math.floor(margin / req);
      totalBunksAvailable += bunks;
      sub._safeBunks = Math.max(0, bunks);
      sub._neededClasses = 0;
    } else if (margin < 0) {
      const need = Math.ceil(Math.abs(margin) / (1 - req));
      totalClassesNeeded += need;
      sub._safeBunks = 0;
      sub._neededClasses = Math.max(0, need);
    } else {
      sub._safeBunks = 0;
      sub._neededClasses = 0;
    }
  });

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const getTodaySlots = () => {
    const now      = new Date();
    const dateStr  = now.toDateString();
    const override = (extraClasses || []).find(ec => new Date(ec.date).toDateString() === dateStr);
    const dayName = override ? override.followsDay : todayLabel;
    return timetable?.find(t => t.day.toLowerCase() === dayName.toLowerCase())?.slots || [];
  };
  const todaySlots = getTodaySlots();

  const barData = subjects.slice(0, 5).map(s => ({
    name:  s.name.substring(0, 3).toUpperCase(),
    full:  s.name,
    value: s.attended,
    color: s.color || '#185FA5',
  }));

  const slotColors = ['#185FA5', '#0F6E56', '#BA7517', '#3C3489', '#A32D2D'];

  return (
    <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
      {/* ── CATCH UP ALERT ── */}
      {(() => {
        const lastMarked = user?.lastAttendanceDate ? new Date(user.lastAttendanceDate) : null;
        const todayAtZero = new Date();
        todayAtZero.setHours(0,0,0,0);
        const yesterday = new Date(todayAtZero);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastMarked && lastMarked < yesterday && subjects.length > 0) {
          const diffDays = Math.floor((todayAtZero - lastMarked) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            return (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pt-4 lg:px-7 lg:pt-6"
              >
                <div className="bg-primary border border-primary text-white p-4 lg:p-5 rounded-2xl flex items-center shadow-lg shadow-primary/20">
                  <div className="flex-1">
                    <p className="text-sm font-bold leading-tight">Missing {diffDays} day{diffDays > 1 ? 's' : ''} of logs</p>
                    <p className="text-[11px] opacity-80 mt-1">Don't lose your streak! Auto-fill missed classes.</p>
                  </div>
                  <button 
                    onClick={() => {
                        const start = new Date(lastMarked);
                        start.setDate(start.getDate() + 1);
                        autoFillMissed(start.toISOString(), yesterday.toISOString(), 'Present');
                    }}
                    className="bg-white text-primary rounded-xl px-4 py-2 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all ml-4"
                  >
                    Auto-Fill
                  </button>
                </div>
              </motion.div>
            );
          }
        }
        return null;
      })()}

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e3e0da] px-4 py-3 lg:px-7 lg:py-5 flex flex-col gap-3 transition-all">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap size={16} color="#fff" />
            </div>
            <h1 className="text-base lg:text-xl font-bold text-[#0f0e0d] tracking-tight">Dashboard</h1>
          </div>

          <div className="hidden lg:flex items-center relative flex-1 max-w-sm ml-4 group">
            <Search size={14} className="absolute left-3.5 text-[#8c8a87] group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-2 pl-10 pr-4 text-sm font-medium text-[#0f0e0d] outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className={`lg:hidden w-9 h-9 rounded-xl border border-[#e3e0da] flex items-center justify-center transition-all ${
                showMobileSearch ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-white text-[#8c8a87]'
              }`}
            >
              <Search size={15} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl border border-[#e3e0da] flex items-center justify-center transition-all hover:bg-white relative ${
                  showNotifications ? 'bg-white border-primary/30 text-primary shadow-sm' : 'text-[#8c8a87]'
                }`}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-danger rounded-full border border-white shadow-sm" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 max-h-[440px] bg-white border border-[#e3e0da] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                      <div className="p-4 border-b border-[#e3e0da]/50 bg-[#faf9f7] flex items-center justify-between">
                        <h3 className="text-xs font-extrabold text-[#0f0e0d] uppercase tracking-wider">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markNotificationsRead} className="text-[10px] font-bold text-primary hover:underline transition-all">Mark all as read</button>
                        )}
                      </div>
                      <div className="overflow-y-auto p-3 space-y-2.5">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-[11px] text-[#8c8a87] font-medium">No new notifications.</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n._id} className={`p-3 rounded-[14px] border transition-all ${n.read ? 'bg-bg/30 border-transparent opacity-60' : 'bg-primary/5 border-primary/10'}`}>
                              <p className="text-[12px] font-bold text-[#0f0e0d] mb-0.5">{n.title}</p>
                              <p className="text-[11px] text-[#8c8a87] leading-relaxed font-medium">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'S'}&backgroundColor=007aff`}
              alt="Profile"
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-[#e3e0da] bg-white shadow-sm cursor-pointer hover:border-primary/50 transition-all"
            />
          </div>
        </div>

        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden"
            >
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c8a87]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Filter subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-5 lg:px-7 lg:py-8 flex flex-col gap-6 lg:gap-8 max-w-[1440px] mx-auto w-full">
        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {subjects.length === 0 ? (
            Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            [
              { label: 'Avg Attendance',   value: `${avgPct}%`,     color: '#185FA5', icon: <TrendingUp   size={16} /> },
              { label: 'Attended',         value: totalAttended,    color: '#0F6E56', icon: <CheckCircle2 size={16} /> },
              { label: 'Classes Needed',   value: totalClassesNeeded, color: '#A32D2D', icon: <XCircle size={16} /> },
              { label: 'Bunks Available',  value: totalBunksAvailable, color: '#BA7517', icon: <BookOpen size={16} /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="bg-white border border-[#e3e0da] border-t-[3px] rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-center"
                style={{ borderTopColor: stat.color }}
              >
                <div style={{ color: stat.color }} className="mb-3">{stat.icon}</div>
                <div className="text-2xl lg:text-3xl font-bold text-[#0f0e0d] tracking-tighter mb-1">{stat.value}</div>
                <div className="text-[10px] lg:text-[11px] font-extrabold text-[#8c8a87] uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── TODAY + CHART ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Today's schedule */}
          <div className="flex flex-col">
            <div className="text-[11px] font-extrabold text-[#8c8a87] uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow" />
              Today — {todayLabel}
            </div>
            
            <button 
                onClick={() => setIsExtraModalOpen(true)}
                className="mb-4 w-full py-3 border border-dashed border-[#e3e0da] rounded-2xl text-xs font-bold text-[#8c8a87] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 bg-white/40"
            >
                <Plus size={15} /> Log Extra Session
            </button>

            {subjects.length === 0 ? (
               Array(3).fill(0).map((_, i) => <SlotSkeleton key={i} />)
            ) : todaySlots.length === 0 ? (
              <div className="bg-white/50 border border-dashed border-[#e3e0da] rounded-2xl py-12 flex flex-col items-center justify-center text-center">
                <Calendar size={28} className="text-[#8c8a87]/30 mb-3" />
                <span className="text-sm font-medium text-[#8c8a87]">No classes today</span>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.map((slot, i) => {
                  const subId   = slot.subject?._id || slot.subject?.toString() || slot.subject;
                  const subject = subjects.find(sub => sub._id === subId);
                  const color   = subject?.color || slotColors[i % slotColors.length];
                  const isUpdating = useStore.getState().updatingAttendance[subId];
                  const todayStr = new Date().toISOString().split('T')[0];
                  let todayLog = subject?.attendanceRecords?.find(log => log.date && new Date(log.date).toISOString().split('T')[0] === todayStr);

                  return (
                    <motion.div
                      key={i}
                      whileHover={{ x: 4 }}
                      className={`group bg-white border border-[#e3e0da] border-l-[4px] rounded-xl p-3.5 lg:p-4 flex items-center gap-4 transition-all ${isUpdating ? 'opacity-60 grayscale-[0.5]' : 'hover:scale-[1.01] hover:shadow-md shadow-sm'}`}
                      style={{ borderLeftColor: color }}
                    >
                      <div className="min-w-[50px]"><span className="text-[10px] font-bold text-[#8c8a87] uppercase">{slot.time}</span></div>
                      <div className="flex-1 min-w-0"><span className="text-sm lg:text-[15px] font-bold text-[#0f0e0d] truncate block">{subject?.name || 'Unmapped Subject'}</span></div>
                      
                      <div className="flex items-center gap-2 ml-auto">
                        {subject && todayLog ? (
                          <div className="flex items-center gap-2">
                             <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              todayLog.status === 'Absent' ? 'bg-danger/10 text-danger' : 
                              todayLog.status === 'Present' ? 'bg-green-500/10 text-green-600' : 'bg-[#faf9f7] text-[#8c8a87]'
                            }`}>
                              {todayLog.status} {todayLog.status === 'Present' ? '✓' : todayLog.status === 'Absent' ? '✗' : ''}
                            </div>
                            <button onClick={() => undoAttendance(subject._id)} disabled={isUpdating} className="w-8 h-8 rounded-lg border border-[#e3e0da] flex items-center justify-center text-[#8c8a87] hover:bg-[#faf9f7] transition-all"><RotateCcw size={12} /></button>
                          </div>
                        ) : subject ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => markAttendance(subject._id, 'Present', slot.credit || 1)}
                              disabled={isUpdating}
                              className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 border border-green-500/20 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
                            ><Check size={18} strokeWidth={3} /></button>
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenSlotMenu(openSlotMenu === i ? null : i);
                                }}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${openSlotMenu === i ? 'bg-primary/10 border-primary/30 text-primary' : 'border-[#e3e0da] text-[#8c8a87] hover:bg-[#faf9f7]'}`}
                              >
                                <ChevronDown size={14} className={`transition-transform duration-200 ${openSlotMenu === i ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {openSlotMenu === i && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOpenSlotMenu(null)} />
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                      className="absolute right-0 top-full mt-2 bg-white border border-[#e3e0da] rounded-xl shadow-2xl py-1.5 z-50 w-28 origin-top-right overflow-hidden"
                                    >
                                      {['Absent', 'Medical', 'OD', 'Cancelled'].map((st) => (
                                        <button 
                                          key={st} 
                                          onClick={() => {
                                            markAttendance(subject._id, st, slot.credit || 1);
                                            setOpenSlotMenu(null);
                                          }} 
                                          className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#faf9f7] text-[#0f0e0d]"
                                        >
                                          {st}
                                        </button>
                                      ))}
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="flex flex-col h-full">
            <div className="text-[11px] font-extrabold text-[#8c8a87] uppercase tracking-widest mb-4 px-1">Engagement Mix</div>
            <div className="bg-white border border-[#e3e0da] rounded-2xl p-5 lg:p-7 shadow-sm h-full flex flex-col justify-between">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} barSize={26}>
                  <Tooltip cursor={false} contentStyle={{ background: '#fff', border: '1px solid #e3e0da', borderRadius: '12px', fontSize: '11px' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 flex flex-col gap-2.5">
                {barData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-[11px] font-bold text-[#0f0e0d] truncate">{d.full}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#8c8a87]">{d.value} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIVITY & HEATMAP ── */}
        <div className="bg-white border border-[#e3e0da] rounded-2xl p-5 lg:p-7 shadow-sm overflow-hidden">
          <div className="text-[11px] font-extrabold text-[#8c8a87] uppercase tracking-widest mb-6">Global Attendance Flow</div>
          <AttendanceHeatmap subjects={subjects} />
        </div>

        {/* ── TRANSCRIPT / COURSES ── */}
        <div className="bg-white border border-[#e3e0da] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e3e0da] bg-[#faf9f7] flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold text-[#0f0e0d] uppercase tracking-widest">Active Courses</h2>
            <Link to="/subjects" className="text-[11px] font-bold text-primary hover:underline transition-all">View All</Link>
          </div>

          <div className="overflow-x-auto">
             {/* Desktop Table */}
            <table className="hidden md:table w-full border-collapse">
              <thead>
                <tr className="bg-[#faf9f7]/50">
                  {['Subject', 'Progress', 'Score', 'Status', 'Insights'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-[10px] font-extrabold text-[#8c8a87] uppercase tracking-wider border-b border-[#e3e0da]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e0da]/50">
                {subjects.map(sub => {
                  const pct = sub.total > 0 ? (sub.attended / sub.total * 100).toFixed(1) : 0;
                  const isLow = pct < (sub.requiredAttendance || 75);
                  return (
                    <tr key={sub._id} className="group hover:bg-[#faf9f7] transition-all cursor-pointer" onClick={() => window.location.href = `/subjects?view=${sub._id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: sub.color || '#888' }} />
                          <span className="text-sm font-bold text-[#0f0e0d]">{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#8c8a87]">{sub.attended} / {sub.total} sessions</td>
                      <td className={`px-6 py-4 text-sm font-extrabold ${isLow ? 'text-danger' : 'text-green-600'}`}>{pct}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${isLow ? 'bg-danger/10 text-danger' : 'bg-green-500/10 text-green-600'}`}>{isLow ? 'Warning' : 'On Track'}</span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-[#8c8a87]">
                         {sub._safeBunks > 0 ? <span className="text-warning">{sub._safeBunks} safe skips</span> : sub._neededClasses > 0 ? <span className="text-danger">Need {sub._neededClasses} more</span> : 'Steady'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-[#e3e0da]/50">
                {subjects.map(sub => {
                  const pct = sub.total > 0 ? (sub.attended / sub.total * 100).toFixed(1) : 0;
                  const isLow = pct < (sub.requiredAttendance || 75);
                  return (
                    <div key={sub._id} className="p-4 flex items-center justify-between" onClick={() => window.location.href = `/subjects?view=${sub._id}`}>
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sub.color || '#888' }} />
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-[#0f0e0d] truncate">{sub.name}</p>
                              <p className="text-[10px] text-[#8c8a87] font-bold">
                                 {sub._safeBunks > 0 ? `${sub._safeBunks} skips` : sub._neededClasses > 0 ? `Need ${sub._neededClasses}` : 'On track'}
                              </p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className={`text-sm font-extrabold ${isLow ? 'text-danger' : 'text-green-600'}`}>{pct}%</span>
                           <span className={`text-[9px] font-bold uppercase ${isLow ? 'text-danger' : 'text-green-600'}`}>{isLow ? 'Warn' : 'OK'}</span>
                        </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>

      {/* ── EXTRA SESSION MODAL ── */}
      <AnimatePresence>
        {isExtraModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsExtraModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-[#e3e0da] flex items-center justify-between bg-[#faf9f7]">
                <div><h2 className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">Log Extra Session</h2><p className="text-xs text-[#8c8a87] font-medium leading-none mt-1">Add a session manually outside timetable</p></div>
                <button onClick={() => setIsExtraModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-[#8c8a87] transition-all"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Subject</label>
                    <select value={extraForm.subjectId} onChange={(e) => setExtraForm({...extraForm, subjectId: e.target.value})} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-2.5 px-3 text-sm font-bold text-[#0f0e0d]">
                      <option value="">Select a subject</option>
                      {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Status</label>
                      <select value={extraForm.status} onChange={(e) => setExtraForm({...extraForm, status: e.target.value})} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-2.5 px-3 text-sm font-bold text-[#0f0e0d]">
                        {['Present', 'Absent', 'OD', 'Medical'].map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 w-24">
                      <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Credit</label>
                      <input type="number" min="1" value={extraForm.credit} onChange={(e) => setExtraForm({...extraForm, credit: parseInt(e.target.value) || 1})} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-2.5 px-3 text-sm font-bold text-[#0f0e0d]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#8c8a87] uppercase ml-1">Date</label>
                    <input type="date" value={extraForm.date} onChange={(e) => setExtraForm({...extraForm, date: e.target.value})} className="w-full bg-[#faf9f7] border border-[#e3e0da] rounded-xl py-2.5 px-3 text-sm font-bold text-[#0f0e0d]" />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!extraForm.subjectId) return toast.error('Please select a subject');
                      try { await useStore.getState().addExtraAttendance(extraForm); setIsExtraModalOpen(false); toast.success('Extra session logged!'); } catch {}
                    }}
                    className="w-full bg-primary text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all mt-4"
                  >Log This Session</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;