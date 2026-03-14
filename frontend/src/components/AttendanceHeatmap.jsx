import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const AttendanceHeatmap = ({ subjects }) => {
  // 1. Process all stats into a daily map
  const dailyStats = useMemo(() => {
    const stats = {};
    subjects.forEach(sub => {
      (sub.attendanceRecords || []).forEach(record => {
        const dateKey = new Date(record.date).toDateString();
        if (!stats[dateKey]) stats[dateKey] = { attended: 0, total: 0 };
        stats[dateKey].total += 1;
        if (record.status === 'Present') stats[dateKey].attended += 1;
      });
    });
    return stats;
  }, [subjects]);

  // 2. Generate last 91 days (13 weeks)
  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // We want to show a nice grid, maybe 13 columns (weeks) x 7 rows (days)
    // To make it easy, let's just do the last 91 days
    for (let i = 90; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      arr.push(d);
    }
    return arr;
  }, []);

  const getColor = (date) => {
    const stat = dailyStats[date.toDateString()];
    if (!stat) return '#f2f0ec'; // No record
    
    const pct = stat.total > 0 ? (stat.attended / stat.total) : 0;
    if (pct >= 1)   return '#0F6E56'; // Perfect
    if (pct >= 0.7) return '#10b981'; // Good
    if (pct >= 0.5) return '#facc15'; // Mixed
    if (pct > 0)    return '#f97316'; // Poor
    return '#A32D2D'; // Failed entirely
  };

  return (
    <div style={s.container}>
      <div style={s.grid}>
        {days.map((date, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.002 }}
            style={{ ...s.square, background: getColor(date) }}
            title={`${date.toLocaleDateString()}: ${dailyStats[date.toDateString()]?.attended || 0}/${dailyStats[date.toDateString()]?.total || 0}`}
          />
        ))}
      </div>
      <div style={s.footer}>
        <span style={s.label}>Last 3 months</span>
        <div style={s.legend}>
          <div style={{ ...s.legendDot, background: '#f2f0ec' }} />
          <div style={{ ...s.legendDot, background: '#0F6E56' }} />
        </div>
      </div>
    </div>
  );
};

const s = {
  container: {
    padding: '4px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(10px, 1fr))',
    gridAutoRows: '10px',
    gap: '3px',
  },
  square: {
    borderRadius: '2px',
    width: '100%',
    height: '100%',
  },
  footer: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: '10px', color: '#b0ada8', textTransform: 'uppercase', letterSpacing: '0.04em' },
  legend: { display: 'flex', gap: '4px' },
  legendDot: { width: '6px', height: '6px', borderRadius: '1px' },
};

export default AttendanceHeatmap;
