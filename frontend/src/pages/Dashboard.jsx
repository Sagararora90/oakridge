import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, CheckCircle2, XCircle, TrendingUp,
  Calendar, Bell, Search, GraduationCap,
  Check, X, RotateCcw, ChevronDown, Plus
} from 'lucide-react';
import useStore from '../store/useStore';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import { StatSkeleton, SlotSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Simple hook to get window width for responsive logic
const useWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
};

const Dashboard = () => {
  const {
    user,
    fetchUser,
    subjects,
    fetchSubjects,
    gamification,
    fetchGamification,
    timetable,
    fetchTimetable,
    extraClasses,
    fetchExtraClasses,
    markAttendance,
    undoAttendance,
    aiBrief,
    fetchAIBrief,
    autoFillMissed,
    notifications,
    fetchNotifications,
    markNotificationsRead
  } = useStore();

  const width   = useWidth();
  const isMobile = width < 640;   // phone
  const isTablet = width < 1024;  // tablet / small laptop

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
  const unreadCount = notifications.filter(n => !n.read).length;
  const [extraForm, setExtraForm] = useState({ subjectId: '', status: 'Present', credit: 1, date: new Date().toISOString().split('T')[0] });

  // ── Calculations ──
  const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalClasses  = subjects.reduce((acc, s) => acc + s.total, 0);
  const totalMissed   = totalClasses - totalAttended;
  const avgPct        = totalClasses > 0 ? (totalAttended / totalClasses * 100).toFixed(1) : 0;

  // Calculate Actionable Stats
  let totalBunksAvailable = 0;
  let totalClassesNeeded = 0;

  subjects.forEach(sub => {
    const req = (sub.requiredAttendance || 75) / 100;
    
    // Bunks = Math.floor((Attended - (Req * Total)) / Req)
    // Need  = Math.ceil(((Req * Total) - Attended) / (1 - Req))
    
    const margin = sub.attended - (req * sub.total);
    if (margin > 0) {
      // safe bunks
      const bunks = Math.floor(margin / req);
      totalBunksAvailable += bunks;
      sub._safeBunks = Math.max(0, bunks);
      sub._neededClasses = 0;
    } else if (margin < 0) {
      // needed classes
      const need = Math.ceil(Math.abs(margin) / (1 - req));
      totalClassesNeeded += need;
      sub._safeBunks = 0;
      sub._neededClasses = Math.max(0, need);
    } else {
      sub._safeBunks = 0;
      sub._neededClasses = 0;
    }
  });

  // ── Today's schedule ──
  const getTodaySlots = () => {
    const now      = new Date();
    const dateStr  = now.toDateString();
    const override = (extraClasses || []).find(
      ec => new Date(ec.date).toDateString() === dateStr
    );
    const dayName = override
      ? override.followsDay
      : now.toLocaleDateString('en-US', { weekday: 'long' });
    return timetable?.find(
      t => t.day.toLowerCase() === dayName.toLowerCase()
    )?.slots || [];
  };

  const todaySlots = getTodaySlots();
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // ── Bar chart data ──
  const barData = subjects.slice(0, 5).map(s => ({
    name:  s.name.substring(0, 3).toUpperCase(),
    full:  s.name,
    value: s.attended,
    color: s.color || '#185FA5',
  }));

  const slotColors = ['#185FA5', '#0F6E56', '#BA7517', '#3C3489', '#A32D2D'];

  // ── Responsive values ──
  const pad        = isMobile ? '12px 16px' : '16px 28px';
  const contentPad = isMobile ? 16 : isTablet ? 20 : 28;

  // Stat grid: 2 cols on mobile, 4 on tablet+
  const statCols = isMobile
    ? 'repeat(2, 1fr)'
    : 'repeat(4, 1fr)';

  // Mid grid: stacked on mobile/tablet, side-by-side on desktop
  const midCols = isTablet ? '1fr' : '1fr 1fr';

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">

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
                style={{ padding: '16px 16px 0' }}
              >
                <div style={{ ...s.dangerAlert, background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff', padding: '12px 20px', borderRadius: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Missing {diffDays} day{diffDays > 1 ? 's' : ''} of logs</p>
                    <p style={{ fontSize: 11, opacity: 0.9, margin: '2px 0 0' }}>Your timetable can auto-fill these for you.</p>
                  </div>
                  <button 
                    onClick={() => {
                        const start = new Date(lastMarked);
                        start.setDate(start.getDate() + 1);
                        autoFillMissed(start.toISOString(), yesterday.toISOString(), 'Present');
                    }}
                    style={{ background: '#fff', color: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    className="active:scale-95 transition-all shadow-lg"
                  >
                    Auto-Fill Present
                  </button>
                </div>
              </motion.div>
            );
          }
        }
        return null;
      })()}

      {/* ── TOP BAR ── */}
      <div
        className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border/50"
        style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: showMobileSearch ? 12 : 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div className="lg:hidden" style={s.logoIcon}>
            <GraduationCap size={15} color="#fff" />
          </div>
          <h1 style={{ ...s.pageTitle, fontSize: isMobile ? 16 : 18 }}>Dashboard</h1>
        </div>

        {/* Search — hidden on mobile to save space */}
        {!isMobile && (
          <div style={{ ...s.searchWrap, maxWidth: isTablet ? 220 : 360 }}>
            <Search size={13} style={s.searchIcon} />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50"
              style={s.searchInput}
            />
          </div>
        )}

        {/* Bell + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Show search icon on mobile instead of full bar */}
          {isMobile && (
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              style={s.bellBtn} 
              className={`transition-all ${showMobileSearch ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-white'}`}
            >
              <Search size={14} style={{ stroke: showMobileSearch ? 'var(--primary)' : '#8c8a87' }} />
            </button>
          )}
          <div className="relative" style={{ zIndex: showNotifications ? 51 : 'auto' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ ...s.bellBtn, zIndex: showNotifications ? 51 : 'auto', position: 'relative' }} 
              className="hover:bg-white transition-all"
            >
              <Bell size={14} style={{ stroke: '#8c8a87' }} />
              {unreadCount > 0 && <div style={s.bellDot} />}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-card-bg border border-border rounded-2xl shadow-2xl z-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-text">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            markNotificationsRead();
                            toast.success('All marked as read');
                          }}
                          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-all"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-xs text-subtext">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div 
                            key={n._id || i} 
                            className={`p-3 rounded-xl border border-border/50 transition-all ${n.read ? 'opacity-60 bg-bg/30' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                n.type === 'Attendance' ? 'bg-danger' : 
                                n.type === 'Exam' ? 'bg-warning' : 
                                'bg-primary'
                              }`} />
                              <div>
                                <p className="text-[11px] font-bold text-text leading-tight mb-1">{n.title}</p>
                                <p className="text-[10px] text-subtext leading-relaxed">{n.message}</p>
                                <p className="text-[9px] text-subtext/60 mt-2">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
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
            style={s.avatar}
          />
        </div>
      </div>

      {/* Mobile Search Bar Expansion */}
      <AnimatePresence>
        {isMobile && showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pb-1"
            style={{ padding: pad, paddingTop: 0 }}
          >
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
              <input
                autoFocus
                type="text"
                placeholder="Filter subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card-bg border border-border rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

        {/* ── EXTRA SESSION MODAL ── */}
        <AnimatePresence>
          {isExtraModalOpen && (
            <div
              style={modal.backdrop}
              className="z-[100]"
              onClick={(e) => { if (e.target === e.currentTarget) setIsExtraModalOpen(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1,    opacity: 1, y: 0  }}
                exit={{   scale: 0.95, opacity: 0, y: 20  }}
                style={modal.wrap}
                className="max-w-[400px] w-full"
              >
                <div style={modal.header}>
                  <div>
                    <h2 style={modal.title}>Log Extra Session</h2>
                    <p style={modal.subtitle}>Log a class that wasn't on your schedule.</p>
                  </div>
                  <button onClick={() => setIsExtraModalOpen(false)} style={modal.closeBtn}><X size={16} /></button>
                </div>
                <div style={modal.body}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label style={modal.label}>Subject</label>
                      <select 
                        value={extraForm.subjectId}
                        onChange={(e) => setExtraForm({...extraForm, subjectId: e.target.value})}
                        style={modal.input}
                      >
                        <option value="">Select a subject</option>
                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label style={modal.label}>Status</label>
                            <select 
                                value={extraForm.status}
                                onChange={(e) => setExtraForm({...extraForm, status: e.target.value})}
                                style={modal.input}
                            >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="OD">On Duty (OD)</option>
                                <option value="Medical">Medical</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 w-24">
                            <label style={modal.label}>Credit</label>
                            <input 
                                type="number"
                                min="1"
                                value={extraForm.credit}
                                onChange={(e) => setExtraForm({...extraForm, credit: parseInt(e.target.value) || 1})}
                                style={modal.input}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label style={modal.label}>Date</label>
                      <input 
                        type="date"
                        value={extraForm.date}
                        onChange={(e) => setExtraForm({...extraForm, date: e.target.value})}
                        style={modal.input}
                      />
                    </div>
                    <button 
                        onClick={async () => {
                            if (!extraForm.subjectId) return toast.error('Please select a subject');
                            try {
                                await useStore.getState().addExtraAttendance(extraForm);
                                setIsExtraModalOpen(false);
                            } catch (err) {}
                        }}
                        style={{ ...modal.submitBtn, background: 'var(--primary)', marginTop: 10 }}
                    >
                        Log Session
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      <div style={{ padding: contentPad, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: statCols, gap: isMobile ? 10 : 14 }}>
          {subjects.length === 0 ? (
            Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            [
              { label: 'Avg Attendance',   value: `${avgPct}%`,     color: '#185FA5', icon: <TrendingUp   size={14} /> },
              { label: 'Attended',         value: totalAttended,    color: '#0F6E56', icon: <CheckCircle2 size={14} /> },
              { label: 'Classes Needed',   value: totalClassesNeeded, color: '#A32D2D', icon: <XCircle      size={14} /> },
              { label: 'Bunks Available',  value: totalBunksAvailable, color: '#BA7517', icon: <BookOpen     size={14} /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -2 }}
                style={{ ...s.statCard, borderTopColor: stat.color, padding: isMobile ? '12px 14px' : '16px 18px' }}
              >
                <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ ...s.statVal, fontSize: isMobile ? 22 : 28 }}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── TODAY + CHART ── */}
        <div style={{ display: 'grid', gridTemplateColumns: midCols, gap: isMobile ? 16 : 20 }}>

          {/* Today's schedule */}
          <div>
            <div style={s.sectionHead}>
              <span style={s.liveDot} />
              Today — {todayLabel}
            </div>
            <button 
                onClick={() => setIsExtraModalOpen(true)}
                className="mb-4 w-full py-2.5 border border-dashed border-border rounded-xl text-[11px] font-bold text-subtext hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
                <Plus size={14} /> Log Extra Session
            </button>

            {subjects.length === 0 ? (
               Array(3).fill(0).map((_, i) => <SlotSkeleton key={i} />)
            ) : todaySlots.length === 0 ? (
              <div style={s.emptyBox}>
                <Calendar size={20} style={{ color: '#ccc', marginBottom: 8 }} />
                <span style={{ fontSize: 12, color: '#8c8a87' }}>No classes today</span>
              </div>
            ) : (
              todaySlots.map((slot, i) => {
                const subId   = slot.subject?._id || slot.subject?.toString() || slot.subject;
                const subject = subjects.find(sub => sub._id === subId);
                const color   = subject?.color || slotColors[i % slotColors.length];
                const isUpdating = useStore.getState().updatingAttendance[subId];
                
                // Check if marked today
                const todayStr = new Date().toISOString().split('T')[0];
                let todayLog = null;
                if (subject && subject.attendanceRecords) {
                  todayLog = subject.attendanceRecords.find(log => log.date && new Date(log.date).toISOString().split('T')[0] === todayStr);
                }

                const handleMark = async (status) => {
                  try {
                    await markAttendance(subject._id, status, slot.credit || 1);
                    toast.success(`Marked ${status} for ${subject.name}`);
                  } catch (err) {
                    toast.error('Failed to mark attendance');
                  }
                };

                return (
                  <motion.div
                    key={i}
                    whileHover={{ x: 2 }}
                    style={{ ...s.slot, borderLeftColor: color, opacity: isUpdating ? 0.6 : 1 }}
                    className="group-slot"
                  >
                    <span style={s.slotTime}>{slot.time}</span>
                    <span style={s.slotName}>{subject?.name || 'Unmapped Subject'}</span>
                    
                    <div className="flex items-center gap-1.5 ml-auto">
                      {subject && todayLog ? (
                        <>
                          <div style={{ 
                            ...s.slotBadge, 
                            background: todayLog.status === 'Absent' ? '#FCEBEB' : todayLog.status === 'Present' ? '#E1F5EE' : todayLog.status === 'Cancelled' ? '#F5F5F3' : '#EBF3FE', 
                            color: todayLog.status === 'Absent' ? '#A32D2D' : todayLog.status === 'Present' ? '#0F6E56' : todayLog.status === 'Cancelled' ? '#8c8a87' : '#2166CC' 
                          }}>
                            {todayLog.status} {todayLog.status === 'Present' ? '✓' : todayLog.status === 'Absent' ? '✗' : todayLog.status === 'Cancelled' ? '○' : ''}
                          </div>
                          <button
                            onClick={() => undoAttendance(subject._id)}
                            disabled={isUpdating}
                            style={s.miniBtnUndo}
                            className="hover:bg-bg transition-all"
                            title="Undo Last Mark"
                          >
                            <RotateCcw size={11} />
                          </button>
                        </>
                      ) : subject ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMark('Present')}
                            disabled={isUpdating}
                            style={s.miniBtnOk}
                            className="hover:bg-secondary/10 hover:text-secondary transition-all"
                            title="Mark Present"
                          >
                            <Check size={12} />
                          </button>
                          
                          <div className="relative group/menu">
                            <button
                              disabled={isUpdating}
                              style={s.miniBtnMore}
                              className="hover:bg-bg transition-all"
                            >
                              <ChevronDown size={11} />
                            </button>
                            
                            <div className="absolute right-0 top-full mt-1 bg-card-bg border border-border rounded-lg shadow-xl py-1 z-50 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all w-24">
                              <button onClick={() => handleMark('Absent')} className="w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-danger/5 text-danger">Absent</button>
                              <button onClick={() => handleMark('Medical')} className="w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-primary/5 text-primary">Medical</button>
                              <button onClick={() => handleMark('OD')} className="w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-accent/5 text-accent">Duty (OD)</button>
                              <button onClick={() => handleMark('Cancelled')} className="w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-neutral-100 text-neutral-500">Cancelled</button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {!todayLog && <span style={s.slotBadge}>Lecture</span>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Bar chart */}
          <div>
            <div style={s.sectionHead}>Engagement mix</div>
            <div style={s.chartCard}>
              <ResponsiveContainer width="100%" height={isMobile ? 120 : 150}>
                <BarChart data={barData} barSize={isMobile ? 22 : 30}>
                  <Tooltip
                    cursor={false}
                    contentStyle={s.tooltipBox}
                    formatter={(val, _, props) => [`${val} classes`, props.payload.full]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={s.legend}>
                {barData.map((d, i) => (
                  <div key={i} style={s.legendRow}>
                    <div style={{ ...s.legendDot, background: d.color }} />
                    <span style={s.legendName}>{d.full}</span>
                    <span style={s.legendVal}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIVITY & TRENDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: midCols, gap: isMobile ? 16 : 20 }}>
          {/* Heatmap */}
          <div style={s.chartCard}>
            <div style={{ ...s.sectionHead, marginBottom: 14 }}>Global activity</div>
            <AttendanceHeatmap subjects={subjects} />
          </div>
        </div>

        {/* ── COURSE TABLE ── */}
        <div style={s.tableWrap}>
          <div style={s.tableHead}>Active Courses</div>

          {/* On mobile: card list instead of table (tables overflow badly on small screens) */}
          {isMobile ? (
            <div style={{ padding: '8px 0' }}>
              {subjects.map(sub => {
                const pct   = sub.total > 0 ? (sub.attended / sub.total * 100).toFixed(1) : 0;
                const isLow = pct < (sub.requiredAttendance || 75);
                return (
                  <div key={sub._id} style={s.mobileRow} onClick={() => window.location.href = `/subjects?view=${sub._id}`} className="cursor-pointer hover:bg-neutral-50 transition-colors">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{ ...s.subDot, background: sub.color || '#888', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0f0e0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sub.name}
                        </span>
                        <span style={{ fontSize: 10, color: '#8c8a87' }}>
                           {sub._safeBunks > 0 ? `${sub._safeBunks} safe skips` : sub._neededClasses > 0 ? `Need ${sub._neededClasses} classes` : 'On track'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: isLow ? '#A32D2D' : '#0F6E56' }}>
                        {pct}%
                      </span>
                      <span style={isLow ? s.badgeWarn : s.badgeOk}>
                        {isLow ? 'Warn' : 'OK'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* On tablet/desktop: full table */
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Subject', 'Attended / Total', 'Score', 'Status', 'Actionable Stats'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(sub => {
                    const pct   = sub.total > 0 ? (sub.attended / sub.total * 100).toFixed(1) : 0;
                    const isLow = pct < (sub.requiredAttendance || 75);
                    return (
                      <tr key={sub._id} onClick={() => window.location.href = `/subjects?view=${sub._id}`} className="cursor-pointer hover:bg-neutral-50 transition-colors">
                        <td style={s.td}>
                          <span style={{ ...s.subDot, background: sub.color || '#888' }} />
                          {sub.name}
                        </td>
                        <td style={{ ...s.td, color: '#8c8a87' }}>{sub.attended} / {sub.total}</td>
                        <td style={{ ...s.td, color: isLow ? '#A32D2D' : '#0F6E56', fontWeight: 500 }}>
                          {pct}%
                        </td>
                        <td style={s.td}>
                          <span style={isLow ? s.badgeWarn : s.badgeOk}>
                            {isLow ? 'Warning' : 'Nominal'}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: 11 }}>
                           {sub._safeBunks > 0 ? (
                              <span style={{ color: '#BA7517', fontWeight: 500 }}>{sub._safeBunks} Safe Bunks Available</span>
                           ) : sub._neededClasses > 0 ? (
                              <span style={{ color: '#A32D2D', fontWeight: 500 }}>Need {sub._neededClasses} more classes</span>
                           ) : (
                              <span style={{ color: '#8c8a87' }}>Exactly on track</span>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Static styles (things that don't change with screen size) ──
const s = {
  logoIcon:    { width: 30, height: 30, background: 'var(--primary, #007aff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { fontWeight: 700, color: 'var(--text)', letterSpacing: -0.3, margin: 0 },
  searchWrap:  { position: 'relative', display: 'flex', alignItems: 'center', flex: 1, margin: '0 12px' },
  searchIcon:  { position: 'absolute', left: 10, stroke: 'var(--subtext)', pointerEvents: 'none' },
  searchInput: { width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px 7px 30px', fontSize: 12, color: 'var(--text)', outline: 'none' },
  bellBtn:     { width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 },
  bellDot:     { position: 'absolute', top: 7, right: 7, width: 5, height: 5, background: '#E24B4A', borderRadius: '50%', border: '1.5px solid var(--bg)' },
  avatar:      { width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 },

  statCard:    { background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderTop: '2px solid', borderRadius: 12, cursor: 'default', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  statVal:     { fontWeight: 400, color: 'var(--text)', letterSpacing: -0.5, fontFamily: 'var(--font-display, inherit)' },
  statLabel:   { fontSize: 10, color: 'var(--subtext)', marginTop: 2, letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' },

  sectionHead: { fontSize: 10, letterSpacing: '0.1em', color: 'var(--subtext)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 },
  liveDot:     { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#0F6E56', flexShrink: 0 },

  slot:        { background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderLeft: '2.5px solid', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 },
  slotTime:    { fontSize: 10, color: 'var(--subtext)', width: 44, flexShrink: 0 },
  slotName:    { fontSize: 12, fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  slotBadge:   { fontSize: 9, padding: '3px 8px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', flexShrink: 0 },
  emptyBox:    { background: 'var(--card-bg)', border: '0.5px dashed var(--border)', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },

  chartCard:   { background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 14px 10px' },
  tooltipBox:  { background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderRadius: 6, fontSize: 11, boxShadow: 'none' },
  legend:      { marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 },
  legendRow:   { display: 'flex', alignItems: 'center', gap: 8 },
  legendDot:   { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  legendName:  { flex: 1, fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  legendVal:   { fontSize: 10, color: 'var(--subtext)' },

  tableWrap:   { background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  tableHead:   { padding: '12px 16px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--subtext)', textTransform: 'uppercase' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: 400 },
  th:          { padding: '8px 16px', fontSize: 9, letterSpacing: '0.1em', color: 'var(--subtext)', textTransform: 'uppercase', textAlign: 'left', background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', fontWeight: 400, whiteSpace: 'nowrap' },
  td:          { padding: '10px 16px', fontSize: 12, color: 'var(--text)', borderBottom: '0.5px solid var(--bg)', whiteSpace: 'nowrap' },

  // Mobile card row (replaces table on phones)
  mobileRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: '0.5px solid var(--border)', minHeight: 64 },

  subDot:      { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 6, verticalAlign: 'middle' },
  badgeOk:     { fontSize: 9, padding: '3px 8px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', whiteSpace: 'nowrap' },
  badgeWarn:   { fontSize: 9, padding: '3px 8px', borderRadius: 20, background: '#FCEBEB', color: '#A32D2D', whiteSpace: 'nowrap' },

  miniBtnOk: {
    width:          24,
    height:         24,
    borderRadius:   6,
    background:     'transparent',
    border:         '0.5px solid var(--border)',
    color:          'var(--subtext)',
    display:        'flex',
    alignItems:      'center',
    justifyContent: 'center',
    cursor:          'pointer',
  },
  miniBtnWarn: {
    width:          24,
    height:         24,
    borderRadius:   6,
    background:     'transparent',
    border:         '0.5px solid var(--border)',
    color:          'var(--subtext)',
    display:        'flex',
    alignItems:      'center',
    justifyContent: 'center',
    cursor:          'pointer',
  },
  miniBtnMore: {
    width:          24,
    height:         24,
    borderRadius:   6,
    background:     'transparent',
    border:         '0.5px solid var(--border)',
    color:          'var(--subtext)',
    display:        'flex',
    alignItems:      'center',
    justifyContent: 'center',
    cursor:          'pointer',
  },
  miniBtnUndo: {
    width:          24,
    height:         24,
    borderRadius:   6,
    background:     'transparent',
    border:         '0.5px solid var(--border)',
    color:          'var(--subtext)',
    display:        'flex',
    alignItems:      'center',
    justifyContent: 'center',
    cursor:          'pointer',
  },

  briefCard: {
    background:   'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
    borderRadius: 16,
    padding:      '16px 20px',
    display:      'flex',
    alignItems:   'center',
    gap:          16,
    color:        '#fff',
    boxShadow:    '0 10px 30px rgba(24,95,165,0.15)',
    marginBottom: 8,
  },
  briefIconWrap: {
    width:          40,
    height:         40,
    borderRadius:   12,
    background:     'rgba(255,255,255,0.15)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    border:         '1px solid rgba(255,255,255,0.1)',
  },
  briefTitle: { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: 4 },
  briefText:  { fontSize: 14, fontWeight: 500, lineHeight: 1.5, margin: 0 },

  alertRow: { marginBottom: 12 },
  dangerAlert: {
    background:   '#FCEBEB',
    border:       '0.5px solid #F2AEAE',
    borderRadius: 10,
    padding:      '10px 14px',
    display:      'flex',
    alignItems:   'center',
    gap:          10,
  },
  alertDot: { width: 6, height: 6, borderRadius: '50%', background: '#A32D2D', boxShadow: '0 0 8px #A32D2D' },
  alertText: { fontSize: 12, color: '#A32D2D' },
};

export default Dashboard;