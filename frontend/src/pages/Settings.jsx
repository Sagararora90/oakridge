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
    logout
  } = useStore();

  const [holidayDate,  setHolidayDate]  = useState('');
  const [holidayLabel, setHolidayLabel] = useState('');
  const [extraDate,    setExtraDate]    = useState('');
  const [followsDay,   setFollowsDay]   = useState('Monday');

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
    <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-8">
        
        {/* ── HEADER ── */}
        <header className="flex items-center gap-3">
           <div className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
             <GraduationCap size={16} color="#fff" />
           </div>
           <div>
             <h1 className="text-2xl lg:text-3xl font-bold text-[#0f0e0d] tracking-tight">Settings</h1>
             <p className="text-xs lg:text-sm text-[#8c8a87] font-medium mt-1">Personalize your experience and academic parameters.</p>
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

          {/* ── APPEARANCE ── */}
          <Section icon={<Sparkles size={18} className="text-orange-500" />} title="Appearance" subtitle="Visual theme and interface">
             <div className="bg-[#faf9f7] border border-[#e3e0da] rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white border border-[#e3e0da] flex items-center justify-center shadow-sm">
                      {theme === 'dark' ? <Moon size={18} className="text-slate-800" /> : <Sun size={18} className="text-orange-500" />}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-[#0f0e0d]">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
                      <p className="text-[10px] font-bold text-[#8c8a87] uppercase tracking-wider">Current interface</p>
                   </div>
                </div>
                <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition-colors relative ${theme === 'dark' ? 'bg-primary' : 'bg-[#e3e0da]'}`}>
                   <motion.div animate={{ x: theme === 'dark' ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
             </div>
          </Section>

          {/* ── ACADEMIC CALENDAR ── */}
          <div className="md:col-span-2 bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col gap-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                   <Calendar size={20} className="text-orange-600" />
                </div>
                <div>
                   <h2 className="text-xl font-extrabold text-[#0f0e0d] leading-none mb-1.5">Academic Calendar</h2>
                   <p className="text-xs font-bold text-[#8c8a87] uppercase tracking-wider">Holidays and Schedule adjustments</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                   {/* Holiday Form */}
                   <div className="bg-[#faf9f7] border border-[#e3e0da] p-5 rounded-2xl space-y-4 shadow-sm hover:shadow-xl transition-all">
                      <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest block px-1">Register Holiday</span>
                      <div className="grid grid-cols-2 gap-3">
                         <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0f0e0d] outline-none focus:border-orange-400" />
                         <input type="text" value={holidayLabel} onChange={e => setHolidayLabel(e.target.value)} placeholder="e.g. Diwali" className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0f0e0d] outline-none focus:border-orange-400" />
                      </div>
                      <button onClick={handleAddHoliday} className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-all">
                         <Plus size={14} /> Add Holiday
                      </button>
                   </div>

                   {/* Override Form */}
                   <div className="bg-[#faf9f7] border border-[#e3e0da] p-5 rounded-2xl space-y-4 shadow-sm hover:shadow-xl transition-all">
                      <div className="px-1">
                        <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest block">Schedule Override</span>
                        <p className="text-[9px] font-medium text-[#8c8a87] mt-1 italic">Force a date to follow a specific day's timetable.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <input type="date" value={extraDate} onChange={e => setExtraDate(e.target.value)} className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0f0e0d] outline-none focus:border-primary/50" />
                         <select value={followsDay} onChange={e => setFollowsDay(e.target.value)} className="w-full bg-white border border-[#e3e0da] rounded-xl py-2.5 px-3 text-xs font-bold text-[#0f0e0d] outline-none appearance-none">
                            {DAYS.map(d => <option key={d}>{d}</option>)}
                         </select>
                      </div>
                      <button onClick={handleAddExtra} className="w-full flex items-center justify-center gap-2 py-3 bg-primary/5 text-primary rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all">
                         <Plus size={14} /> Add Override
                      </button>
                   </div>
                </div>

                <div className="bg-white border border-[#e3e0da] rounded-2xl overflow-hidden min-h-[220px] max-h-[400px] overflow-y-auto no-scrollbar shadow-inner">
                   <div className="p-4 bg-[#faf9f7] border-b border-[#e3e0da] flex items-center justify-between sticky top-0 z-10">
                      <span className="text-[10px] font-black text-[#0f0e0d] uppercase tracking-widest">Saved Calendar Items</span>
                      <Calendar size={14} className="text-[#8c8a87]" />
                   </div>
                   
                   {holidays.length === 0 && extraClasses.length === 0 ? (
                     <div className="py-20 text-center opacity-30">
                        <Calendar size={32} className="mx-auto text-[#8c8a87] mb-3" />
                        <p className="text-[11px] font-bold text-[#0f0e0d]">Empty Calendar</p>
                     </div>
                   ) : (
                     <div className="divide-y divide-[#e3e0da]/50">
                        {holidays.map(h => (
                          <div key={h._id} className="p-4 flex items-center justify-between group hover:bg-[#faf9f7] transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-1.5 h-8 rounded-full bg-orange-400" />
                                <div>
                                   <p className="text-sm font-extrabold text-[#0f0e0d]">{h.label}</p>
                                   <p className="text-[10px] font-bold text-[#8c8a87] uppercase tracking-wider">{new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                             </div>
                             <button onClick={() => { deleteHoliday(h._id); toast.success('Removed'); }} className="p-2 text-[#c8c5bf] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        ))}
                        {extraClasses.map(ec => (
                          <div key={ec._id} className="p-4 flex items-center justify-between group hover:bg-[#faf9f7] transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-1.5 h-8 rounded-full bg-primary" />
                                <div>
                                   <p className="text-sm font-extrabold text-[#0f0e0d]">Follows {ec.followsDay}</p>
                                   <p className="text-[10px] font-bold text-[#8c8a87] uppercase tracking-wider">{new Date(ec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                             </div>
                             <button onClick={() => { deleteExtraClass(ec._id); toast.success('Removed'); }} className="p-2 text-[#c8c5bf] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* ── REPORTS & EXPORT ── */}
          <div className="md:col-span-2 bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all border-b-[4px] border-b-primary">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                   <FileText size={24} className="text-primary" />
                </div>
                <div>
                   <h2 className="text-xl font-extrabold text-[#0f0e0d] leading-none mb-1.5">Consolidated Report</h2>
                   <p className="text-xs font-bold text-[#8c8a87] uppercase tracking-wider">Export all session data to PDF for academic record.</p>
                </div>
             </div>
             <button onClick={exportToPDF} className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all text-center">
                <Download size={18} /> Download PDF Report
             </button>
          </div>

          {/* ── LOGOUT ── */}
          <div className="md:col-span-2 pt-4">
             <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center justify-center gap-3 py-5 bg-white border border-red-100 rounded-[24px] text-red-600 text-sm font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm">
                <LogOut size={20} /> Logout from Secure Session
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const Section = ({ icon, title, subtitle, children }) => (
  <div className="bg-white border border-[#e3e0da] rounded-[32px] p-6 lg:p-8 shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all">
     <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#faf9f7] rounded-xl flex items-center justify-center border border-[#e3e0da]">
           {icon}
        </div>
        <div>
           <h2 className="text-base font-extrabold text-[#0f0e0d] leading-none mb-1">{title}</h2>
           <p className="text-[10px] font-bold text-[#8c8a87] uppercase tracking-widest">{subtitle}</p>
        </div>
     </div>
     {children}
  </div>
);

const InfoCard = ({ label, value }) => (
  <div className="bg-[#faf9f7] border border-[#e3e0da] rounded-2xl p-4 flex flex-col gap-1">
     <span className="text-[9px] font-black text-[#8c8a87] uppercase tracking-widest">{label}</span>
     <span className="text-sm font-bold text-[#0f0e0d] truncate">{value}</span>
  </div>
);

export default Settings;