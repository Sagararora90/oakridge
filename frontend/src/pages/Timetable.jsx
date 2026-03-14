import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Save, Plus, Trash2, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';
import TimetableUpload from '../components/TimetableUpload';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { subjects, timetable, updateTimetable } = useStore();
  const [localTimetable, setLocalTimetable] = useState(timetable || []);
  const [activeDay, setActiveDay]           = useState(DAYS[new Date().getDay() - 1] || DAYS[0]);
  const [saving, setSaving]                 = useState(false);
  const [saved, setSaved]                   = useState(false);

  // ── Helpers ──
  const handleAddSlot = (day) => {
    const next = localTimetable.map(d => ({ ...d, slots: [...d.slots] }));
    let dayEntry = next.find(d => d.day === day);
    if (!dayEntry) {
      dayEntry = { day, slots: [] };
      next.push(dayEntry);
    }
    dayEntry.slots.push({ time: '09:00 - 10:00', subject: subjects[0]?._id || '' });
    setLocalTimetable(next);
  };

  const handleRemoveSlot = (day, idx) => {
    const next = localTimetable.map(d =>
      d.day === day ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d
    );
    setLocalTimetable(next);
  };

  const handleSlotUpdate = (day, idx, field, value) => {
    const next = localTimetable.map(d => {
      if (d.day !== day) return d;
      const slots = d.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...d, slots };
    });
    setLocalTimetable(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTimetable(localTimetable);
      setSaved(true);
      toast.success('Schedule saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const currentSlots = localTimetable.find(d => d.day === activeDay)?.slots || [];
  const shortDay = (day) => day.substring(0, 3);

  return (
    <div className="flex-1 bg-[#faf9f7] min-h-screen pb-24 animate-in">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-7 py-6 lg:py-10 flex flex-col gap-6 lg:gap-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap size={16} color="#fff" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0f0e0d] tracking-tight">Timetable</h1>
              <p className="text-xs lg:text-sm text-[#8c8a87] font-medium mt-1">Design your ideal weekly academic rhythm.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TimetableUpload onComplete={() => setLocalTimetable(useStore.getState().timetable)} />
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${saving ? 'opacity-70' : 'hover:scale-[1.02] active:scale-98'} ${saved ? 'bg-green-600 shadow-green-600/20' : 'bg-primary shadow-primary/20'}`}
            >
              <Save size={16} />
              {saving ? 'Saving...' : saved ? 'Changes Saved ✓' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── DAY NAVIGATION ── */}
        <div className="flex items-center gap-2 bg-white border border-[#e3e0da] p-1.5 rounded-2xl overflow-x-auto no-scrollbar shadow-sm">
          {DAYS.map(day => {
            const slotCount = localTimetable.find(d => d.day === day)?.slots.length || 0;
            const isActive  = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-[#8c8a87] hover:bg-[#faf9f7] hover:text-[#0f0e0d]'}`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{shortDay(day)}</span>
                {slotCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-[#faf9f7] text-[#8c8a87]'}`}>
                    {slotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── DAY PANEL ── */}
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#e3e0da] rounded-[32px] overflow-hidden shadow-sm min-h-[480px] flex flex-col"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-6 lg:p-8 border-b border-[#faf9f7]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                <Calendar size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#0f0e0d] leading-none mb-1.5">{activeDay}</h2>
                <p className="text-xs font-bold text-[#8c8a87] uppercase tracking-wider">
                  {currentSlots.length === 0 ? 'No sessions scheduled' : `${currentSlots.length} Session${currentSlots.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAddSlot(activeDay)}
              className="group flex items-center gap-2 px-4 py-2.5 bg-[#faf9f7] border border-[#e3e0da] rounded-xl text-xs font-bold text-[#0f0e0d] hover:bg-white hover:border-primary/50 hover:text-primary transition-all shadow-sm"
            >
              <Plus size={16} className="transition-transform group-hover:rotate-90" />
              <span>Add Session</span>
            </button>
          </div>

          {/* Slot Grid */}
          <div className="p-6 lg:p-8 flex-1">
            {currentSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Clock size={40} className="text-[#8c8a87] mb-4" />
                <p className="text-sm font-bold text-[#0f0e0d]">Free Day</p>
                <p className="text-[11px] font-medium text-[#8c8a87] mt-1 max-w-[180px]">Enjoy your break or manually add sessions above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <AnimatePresence mode="popLayout">
                  {currentSlots.map((slot, idx) => {
                    const sub = subjects.find(s => s._id === slot.subject);
                    return (
                      <SlotCard
                        key={idx}
                        slot={slot}
                        idx={idx}
                        sub={sub}
                        subjects={subjects}
                        activeDay={activeDay}
                        onUpdate={handleSlotUpdate}
                        onRemove={handleRemoveSlot}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SlotCard = ({ slot, idx, sub, subjects, activeDay, onUpdate, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-[#faf9f7] border border-[#e3e0da] rounded-2xl p-4 lg:p-5 flex flex-col gap-4 relative group hover:bg-white hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5"
  >
    <div className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl" style={{ background: sub?.color || '#e3e0da' }} />
    
    <div className="flex justify-between items-center pl-1">
      <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest px-1">Time Slot</span>
      <button
        onClick={() => onRemove(activeDay, idx)}
        className="p-1.5 rounded-lg text-[#8c8a87] opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-red-50 transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>

    <div className="flex items-center gap-3 bg-white border border-[#e3e0da] rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all shadow-sm">
      <Clock size={14} className="text-[#8c8a87] shrink-0" />
      <input
        type="text"
        value={slot.time}
        onChange={(e) => onUpdate(activeDay, idx, 'time', e.target.value)}
        placeholder="09:00 - 10:00"
        className="w-full bg-transparent text-sm font-bold text-[#0f0e0d] outline-none"
      />
    </div>

    <div className="space-y-1.5 pl-1">
      <span className="text-[10px] font-black text-[#8c8a87] uppercase tracking-widest px-1">Subject</span>
      <div className="flex items-center gap-3 bg-white border border-[#e3e0da] rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-all shadow-sm">
        <BookOpen size={14} className="text-[#8c8a87] shrink-0" />
        <select
          value={slot.subject}
          onChange={(e) => onUpdate(activeDay, idx, 'subject', e.target.value)}
          className="w-full bg-transparent text-sm font-bold text-[#0f0e0d] outline-none appearance-none cursor-pointer"
        >
          <option value="">Not Mapped</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
    </div>

    {sub && (
      <div className="mt-1 pl-1 flex items-center gap-2">
         <div className="text-[10px] font-black px-2.5 py-1 rounded-full border border-dashed truncate max-w-full" style={{ borderColor: sub.color + '40', color: sub.color, backgroundColor: sub.color + '05' }}>
            {sub.name}
         </div>
      </div>
    )}
  </motion.div>
);

export default Timetable;