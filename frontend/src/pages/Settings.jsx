import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Moon, Sun, Download, Calendar,
  Trash2, Plus, Sparkles, Zap, ShieldCheck, FileText, ChevronRight, LogOut, GraduationCap
} from 'lucide-react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const Settings = () => {
  const navigate = useNavigate();
  const {
    user, subjects, theme, toggleTheme,
    holidays, fetchHolidays, addHoliday, deleteHoliday,
    extraClasses, fetchExtraClasses, addExtraClass, deleteExtraClass,
    logout, updateUserSettings
  } = useStore();

  const [holidayDate,  setHolidayDate]  = useState('');
  const [holidayLabel, setHolidayLabel] = useState('');
  const [extraDate,    setExtraDate]    = useState('');
  const [followsDay,   setFollowsDay]   = useState('Monday');

  const [emailEnabled, setEmailEnabled] = useState(user?.notificationSettings?.emailEnabled || false);
  const [notifEmail, setNotifEmail]     = useState(user?.notificationSettings?.notificationEmail || user?.email || '');
  const [savingNotif, setSavingNotif]   = useState(false);

  useEffect(() => {
    fetchHolidays();
    fetchExtraClasses();
  }, [fetchHolidays, fetchExtraClasses]);

  const handleAddHoliday = async () => {
    if (!holidayDate) return;
    await addHoliday(holidayDate, holidayLabel || 'Holiday');
    setHolidayDate('');
    setHolidayLabel('');
    toast.success('Holiday added');
  };

  const handleAddExtra = async () => {
    if (!extraDate) return;
    await addExtraClass(extraDate, followsDay);
    setExtraDate('');
    toast.success('Override added');
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(24, 95, 165); // Oakridge primary
    doc.text('Oakridge Attendance Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(140, 138, 135);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 14, 28);
    doc.text(`Student: ${user?.name || 'Scholar'}`, 14, 34);
    doc.setDrawColor(227, 224, 218);
    doc.line(14, 40, 196, 40);
    let y = 50;
    doc.setFontSize(11);
    doc.setTextColor(15, 14, 13);
    doc.setFont(undefined, 'bold');
    const headers   = ['Subject', 'Attended', 'Total', 'Pct', 'Target'];
    const colWidths = [70, 30, 30, 30, 30];
    let x = 14;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 10;
    doc.setFont(undefined, 'normal');
    subjects.forEach(s => {
      const pct = s.total > 0 ? (s.attended / s.total) * 100 : 0;
      x = 14;
      [s.name, String(s.attended), String(s.total), `${pct.toFixed(0)}%`, `${s.requiredAttendance}%`]
        .forEach((cell, i) => { doc.text(String(cell), x, y); x += colWidths[i]; });
      y += 8;
    });
    doc.save(`Oakridge_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF Downloaded');
  };

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-8">
        
        {/* ── HEADER ── */}
        <header className="flex items-center gap-3">
           <div className="lg:hidden w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
             <GraduationCap size={18} color="#fff" />
           </div>
           <div>
             <h1 className="text-2xl lg:text-3xl font-black text-[var(--color-text)] tracking-tight">System Configuration</h1>
             <p className="text-[10px] lg:text-xs text-[var(--color-subtext)] font-black uppercase tracking-[0.15em] mt-1 opacity-80">Personalize Your Academic Environment</p>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* ── PROFILE & ACCOUNT ── */}
          <Section icon={<ShieldCheck size={18} className="text-primary" />} title="Profile & Account" subtitle="Identity and security settings">
             <div className="space-y-3">
                <InfoCard label="Full Name" value={user?.name || 'Guest Student'} />
                <InfoCard label="Email Address" value={user?.email || 'Not connected'} />
             </div>
          </Section>

          {/* ── SCHEDULE ── */}
          <Section 
             icon={<Calendar size={18} className="text-orange-500" />} 
             title="Schedule Management" 
             subtitle="Timetable & Slots"
          >
             <div className="flex flex-col gap-4">
                <p className="text-[10px] font-bold text-subtext leading-relaxed">
                   Adjust your weekly classes or timing slots.
                </p>
                <button 
                  onClick={() => navigate('/timetable')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-all dark:bg-orange-950 dark:text-orange-300"
                >
                  Edit Timetable
                </button>
             </div>
          </Section>
          
          {/* ── NOTIFICATIONS ── */}
          <Section icon={<Sparkles size={18} className="text-primary" />} title="Smart Notifications" subtitle="Alerts and Reminders">
             <div className="space-y-4">
               {/* Theme Toggle for Mobile (also visible on Desktop) */}
               <div className="md:hidden bg-bg border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-card-bg border border-border flex items-center justify-center shadow-sm">
                        {theme === 'light' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-text">Display Theme</p>
                        <p className="text-[10px] font-bold text-subtext uppercase tracking-wider">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                     </div>
                  </div>
                  <button 
                    onClick={toggleTheme} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}
                  >
                     <motion.div animate={{ x: theme === 'dark' ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
               </div>

               <div className="bg-bg border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-card-bg border border-border flex items-center justify-center shadow-sm">
                        <Zap size={18} className={emailEnabled ? 'text-primary' : 'text-subtext'} />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-text">Email Alerts</p>
                        <p className="text-[10px] font-bold text-subtext uppercase tracking-wider">Upcoming class reminders</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setEmailEnabled(!emailEnabled)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${emailEnabled ? 'bg-primary' : 'bg-border'}`}
                  >
                     <motion.div animate={{ x: emailEnabled ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
               </div>

               <AnimatePresence>
                 {emailEnabled && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                   >
                     <div className="bg-bg border border-border rounded-2xl p-4 space-y-3">
                        <span className="text-[9px] font-black text-subtext uppercase tracking-widest block px-1">Notification Email</span>
                        <input 
                          type="email" 
                          value={notifEmail} 
                          onChange={e => setNotifEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-card-bg border border-border rounded-xl py-2.5 px-3 text-xs font-bold text-text outline-none focus:border-primary/50"
                        />
                        <button 
                          onClick={async () => {
                            setSavingNotif(true);
                            await updateUserSettings({
                              notificationSettings: {
                                emailEnabled: true,
                                notificationEmail: notifEmail
                              }
                            });
                            setSavingNotif(false);
                          }}
                          disabled={savingNotif}
                          className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                        >
                          {savingNotif ? 'Saving...' : 'Save Preferences'}
                        </button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </Section>

          {/* ── ACADEMIC CALENDAR ── */}
          <div className="md:col-span-2 bg-card-bg border border-border rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col gap-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center border border-orange-100 dark:border-orange-900/40">
                   <Calendar size={20} className="text-orange-600" />
                </div>
                <div>
                   <h2 className="text-xl font-extrabold text-text leading-none mb-1.5">Academic Calendar</h2>
                   <p className="text-xs font-bold text-subtext uppercase tracking-wider">Holidays and Schedule adjustments</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                   {/* Holiday Form */}
                   <div className="bg-bg border border-border p-5 rounded-2xl space-y-4 shadow-sm hover:shadow-xl transition-all">
                      <span className="text-[10px] font-black text-subtext uppercase tracking-widest block px-1">Register Holiday</span>
                      <div className="grid grid-cols-2 gap-3">
                         <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full bg-card-bg border border-border rounded-xl py-2.5 px-3 text-xs font-bold text-text outline-none focus:border-orange-400" />
                         <input type="text" value={holidayLabel} onChange={e => setHolidayLabel(e.target.value)} placeholder="e.g. Diwali" className="w-full bg-card-bg border border-border rounded-xl py-2.5 px-3 text-xs font-bold text-text outline-none focus:border-orange-400" />
                      </div>
                      <button onClick={handleAddHoliday} className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-all dark:bg-orange-950 dark:text-orange-300">
                         <Plus size={14} /> Add Holiday
                      </button>
                   </div>

                   {/* Override Form */}
                   <div className="bg-bg border border-border p-5 rounded-2xl space-y-4 shadow-sm hover:shadow-xl transition-all">
                      <div className="px-1">
                        <span className="text-[10px] font-black text-subtext uppercase tracking-widest block">Schedule Override</span>
                        <p className="text-[9px] font-medium text-subtext mt-1 italic">Force a date to follow a specific day's timetable.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <input type="date" value={extraDate} onChange={e => setExtraDate(e.target.value)} className="w-full bg-card-bg border border-border rounded-xl py-2.5 px-3 text-xs font-bold text-text outline-none focus:border-primary/50" />
                         <select value={followsDay} onChange={e => setFollowsDay(e.target.value)} className="w-full bg-card-bg border border-border rounded-xl py-2.5 px-3 text-xs font-bold text-text outline-none appearance-none">
                            {DAYS.map(d => <option key={d}>{d}</option>)}
                         </select>
                      </div>
                      <button onClick={handleAddExtra} className="w-full flex items-center justify-center gap-2 py-3 bg-primary/5 text-primary rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all dark:bg-primary/10">
                         <Plus size={14} /> Add Override
                      </button>
                   </div>
                </div>

                <div className="bg-card-bg border border-border rounded-2xl overflow-hidden min-h-[220px] max-h-[400px] overflow-y-auto no-scrollbar shadow-inner">
                   <div className="p-4 bg-bg border-b border-border flex items-center justify-between sticky top-0 z-10">
                      <span className="text-[10px] font-black text-text uppercase tracking-widest">Saved Calendar Items</span>
                      <Calendar size={14} className="text-subtext" />
                   </div>
                   
                   {holidays.length === 0 && extraClasses.length === 0 ? (
                     <div className="py-20 text-center opacity-30">
                        <Calendar size={32} className="mx-auto text-subtext mb-3" />
                        <p className="text-[11px] font-bold text-text">Empty Calendar</p>
                     </div>
                   ) : (
                     <div className="divide-y divide-border/50">
                        {holidays.map(h => (
                           <div key={h._id} className="p-4 flex items-center justify-between group hover:bg-bg transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-1.5 h-8 rounded-full bg-orange-400" />
                                 <div>
                                    <p className="text-sm font-extrabold text-text">{h.label}</p>
                                    <p className="text-[10px] font-bold text-subtext uppercase tracking-wider">{new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                 </div>
                              </div>
                              <button onClick={() => { deleteHoliday(h._id); toast.success('Removed'); }} className="p-2 text-subtext hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                           </div>
                        ))}
                        {extraClasses.map(ec => (
                           <div key={ec._id} className="p-4 flex items-center justify-between group hover:bg-bg transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-1.5 h-8 rounded-full bg-primary" />
                                 <div>
                                    <p className="text-sm font-extrabold text-text">Follows {ec.followsDay}</p>
                                    <p className="text-[10px] font-bold text-subtext uppercase tracking-wider">{new Date(ec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                 </div>
                              </div>
                              <button onClick={() => { deleteExtraClass(ec._id); toast.success('Removed'); }} className="p-2 text-subtext hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* ── REPORTS & EXPORT ── */}
          <div className="md:col-span-2 bg-card-bg border border-[var(--color-border)] rounded-[32px] p-6 lg:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-xl transition-all relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-110 transition-transform">
                   <FileText size={28} className="text-primary" />
                </div>
                <div>
                   <h2 className="text-xl lg:text-2xl font-black text-[var(--color-text)] leading-none mb-2">Academic Transcript</h2>
                   <p className="text-[10px] lg:text-xs font-black text-[var(--color-subtext)] uppercase tracking-[0.15em]">Consolidated Attendance Assessment (PDF)</p>
                </div>
             </div>
             <button onClick={exportToPDF} className="relative z-10 flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-[1.05] active:scale-95 transition-all text-center">
                <Download size={18} strokeWidth={3} /> Generate Document
             </button>
          </div>

          {/* ── LOGOUT ── */}
          <div className="md:col-span-2 pt-4">
             <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center justify-center gap-3 py-5 bg-card-bg border border-red-100 rounded-[24px] text-red-600 text-sm font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm">
                <LogOut size={20} /> Logout from Secure Session
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ icon, title, subtitle, children }) => (
  <div className="bg-card-bg border border-border rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all">
     <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center border border-border">
           {icon}
        </div>
        <div>
           <h2 className="text-base font-extrabold text-text leading-none mb-1">{title}</h2>
           <p className="text-[10px] font-bold text-subtext uppercase tracking-widest">{subtitle}</p>
        </div>
     </div>
     {children}
  </div>
);

const InfoCard = ({ label, value }) => (
  <div className="bg-bg border border-border rounded-2xl p-4 flex flex-col gap-1">
     <span className="text-[9px] font-black text-subtext uppercase tracking-widest">{label}</span>
     <span className="text-sm font-bold text-text truncate">{value}</span>
  </div>
);

export default Settings;