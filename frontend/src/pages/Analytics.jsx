import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { Activity, Target, Award, ShieldAlert } from 'lucide-react';
import useStore from '../store/useStore';
import RescuePlanModal from '../components/RescuePlanModal';
import { AnimatePresence } from 'framer-motion';

const Analytics = () => {
  const { subjects } = useStore();
  const [rescueSubject, setRescueSubject] = React.useState(null);

  // ── Data ──
  const pieData = subjects.map(s => ({
    name:  s.name,
    value: s.attended,
    color: s.color || '#007aff',
  }));

  const barData = subjects.map(s => ({
    name:     s.name.length > 8 ? s.name.substring(0, 7) + '…' : s.name,
    fullName: s.name,
    Attended: s.attended,
    Missed:   s.total - s.attended,
    color:    s.color || '#007aff',
  }));

  const avgAttendance = subjects.length > 0
    ? subjects.reduce((acc, s) =>
        acc + (s.total > 0 ? (s.attended / s.total) * 100 : 0), 0
      ) / subjects.length
    : 0;

  const totalAttended = subjects.reduce((a, s) => a + s.attended, 0);
  const totalClasses  = subjects.reduce((a, s) => a + s.total,    0);
  const totalMissed   = totalClasses - totalAttended;

  // Best and worst subject
  const ranked = [...subjects].sort((a, b) => {
    const pa = a.total > 0 ? a.attended / a.total : 0;
    const pb = b.total > 0 ? b.attended / b.total : 0;
    return pb - pa;
  });
  const best  = ranked[0];
  const worst = ranked[ranked.length - 1];

  const tooltipStyle = {
    background:   '#fff',
    border:       '0.5px solid #e3e0da',
    borderRadius: 8,
    fontSize:     12,
    boxShadow:    'none',
  };

  if (subjects.length === 0) {
    return (
      <div className="flex-1 bg-bg min-h-screen pb-24 animate-in" style={pg.page}>
        <div style={pg.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#8c8a87' }}>No data yet</p>
          <p style={{ fontSize: 13, color: '#c8c5bf', marginTop: 6 }}>Add subjects and mark attendance to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-bg min-h-screen pb-24 animate-in">
      <div style={pg.page}>

        {/* ── HEADER ── */}
        <div style={pg.header}>
          <div>
            <h1 style={pg.title}>Analytics</h1>
            <p style={pg.subtitle}>Your attendance breakdown across all subjects.</p>
          </div>
          <div style={pg.avgBadge}>
            <span style={pg.avgLabel}>Overall avg</span>
            <span style={{
              ...pg.avgVal,
              color: avgAttendance >= 75 ? '#0F6E56' : avgAttendance >= 70 ? '#BA7517' : '#A32D2D'
            }}>
              {avgAttendance.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ── SUMMARY STATS ── */}
        <div style={pg.statRow}>
          {[
            { label: 'Total attended', value: totalAttended, color: '#0F6E56' },
            { label: 'Total missed',   value: totalMissed,   color: '#A32D2D' },
            { label: 'Subjects',       value: subjects.length, color: '#185FA5' },
            { label: 'Classes logged', value: totalClasses,  color: '#3C3489' },
          ].map((s, i) => (
            <motion.div key={i} whileHover={{ y: -2 }}
              style={{ ...pg.statCard, borderTopColor: s.color }}>
              <div style={{ ...pg.statVal, color: s.color }}>{s.value}</div>
              <div style={pg.statLabel}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── CHARTS ROW 1: Area + Donut ── */}
        <div style={pg.chartRow}>

          {/* Area chart */}
          <div style={{ ...pg.card, flex: 2, minWidth: 0 }}>
            <div style={pg.cardHeader}>
              <div>
                <h2 style={pg.cardTitle}>Attended vs Missed</h2>
                <p style={pg.cardSub}>Per subject breakdown</p>
              </div>
              <div style={pg.cardIcon}>
                <Activity size={16} style={{ color: 'var(--primary, #007aff)' }} />
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0F6E56" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F6E56" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="areaRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#A32D2D" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#A32D2D" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#b0ada8', fontSize: 10 }}
                    dy={6}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="Attended"
                    stroke="#0F6E56"
                    strokeWidth={2}
                    fill="url(#areaGreen)"
                    dot={{ r: 4, fill: '#fff', stroke: '#0F6E56', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Missed"
                    stroke="#A32D2D"
                    strokeWidth={2}
                    fill="url(#areaRed)"
                    dot={{ r: 4, fill: '#fff', stroke: '#A32D2D', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={pg.legend}>
              <LegendItem color="#0F6E56" label="Attended" />
              <LegendItem color="#A32D2D" label="Missed"   />
            </div>
          </div>

          {/* Donut chart */}
          <div style={{ ...pg.card, flex: 1, minWidth: 220 }}>
            <div style={pg.cardHeader}>
              <div>
                <h2 style={pg.cardTitle}>Load split</h2>
                <p style={pg.cardSub}>By subject</p>
              </div>
            </div>
            <div style={{ height: 180, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val, name) => [`${val} classes`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label */}
              <div style={pg.donutCenter}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#0f0e0d' }}>{totalAttended}</span>
                <span style={{ fontSize: 9, color: '#b0ada8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>classes</span>
              </div>
            </div>
            {/* Subject legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
              {subjects.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color || '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#4a4845', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: '#b0ada8' }}>{s.attended}</span>
                </div>
              ))}
              {subjects.length > 4 && (
                <span style={{ fontSize: 10, color: '#b0ada8', marginTop: 2 }}>+{subjects.length - 4} more</span>
              )}
            </div>
          </div>
        </div>

        {/* ── BAR CHART ── */}
        <div style={pg.card}>
          <div style={pg.cardHeader}>
            <div>
              <h2 style={pg.cardTitle}>Comparative analysis</h2>
              <p style={pg.cardSub}>Attended vs missed per subject</p>
            </div>
            <div style={pg.legend}>
              <LegendItem color="#0F6E56" label="Attended" />
              <LegendItem color="#A32D2D" label="Missed"   />
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#b0ada8', fontSize: 10 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#b0ada8', fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="Attended" fill="#0F6E56" fillOpacity={0.85} radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Missed"   fill="#A32D2D" fillOpacity={0.4}  radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── INSIGHT CARDS ── */}
        <div style={pg.insightRow}>
          <InsightCard
            icon={<Target size={18} style={{ color: 'var(--primary, #007aff)' }} />}
            iconBg="rgba(0,122,255,0.08)"
            title="Efficiency"
            body={
              avgAttendance >= 75
                ? `You're above the 75% threshold. You can afford to miss a few without risk.`
                : `You're below 75% on average. Focus on the subjects marked "Warning" first.`
            }
          />
          <InsightCard
            icon={<Award size={18} style={{ color: '#0F6E56' }} />}
            iconBg="rgba(15,110,86,0.08)"
            title="Best subject"
            body={best
              ? `${best.name} has your highest attendance at ${best.total > 0 ? (best.attended / best.total * 100).toFixed(1) : 0}%.`
              : 'No data yet.'}
          />
          <InsightCard
            icon={<Activity size={18} style={{ color: '#BA7517' }} />}
            iconBg="rgba(186,117,23,0.08)"
            title="Needs attention"
            body={worst && worst !== best
              ? (
                <div>
                  <span>{worst.name} is your lowest at {worst.total > 0 ? (worst.attended / worst.total * 100).toFixed(1) : 0}%.</span>
                  <button 
                    onClick={() => setRescueSubject(worst)} 
                    style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 8, background: '#FDF6E3', border: '1px solid #F5E1A4', color: '#BA7517', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6 }}
                    className="hover:opacity-80 active:scale-95 transition-all"
                  >
                    <ShieldAlert size={14} /> Calculate Rescue Plan
                  </button>
                </div>
              )
              : 'All subjects are performing equally.'}
          />
        </div>

        {/* ── MODALS ── */}
        <AnimatePresence>
          {rescueSubject && (
            <RescuePlanModal 
               subject={rescueSubject} 
               onClose={() => setRescueSubject(null)} 
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// ── Small helpers ──
const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    <span style={{ fontSize: 10, color: '#8c8a87', letterSpacing: '0.06em' }}>{label}</span>
  </div>
);

const InsightCard = ({ icon, iconBg, title, body }) => (
  <motion.div whileHover={{ y: -2 }} style={pg.insightCard}>
    <div style={{ ...pg.insightIcon, background: iconBg }}>{icon}</div>
    <h3 style={pg.insightTitle}>{title}</h3>
    <div style={pg.insightBody}>{body}</div>
  </motion.div>
);

// ── Styles ──
const pg = {
  page: {
    padding:       '24px 16px',
    maxWidth:      1200,
    margin:        '0 auto',
    display:       'flex',
    flexDirection: 'column',
    gap:           20,
  },

  header: {
    display:        'flex',
    flexWrap:       'wrap',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    gap:            16,
    paddingTop:     8,
  },
  title:    { fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'var(--subtext)', marginTop: 4 },
  avgBadge: {
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 12,
    padding:      '12px 20px',
    display:      'flex',
    flexDirection:'column',
    alignItems:   'center',
    minWidth:     120,
  },
  avgLabel: { fontSize: 9, color: 'var(--subtext)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  avgVal:   { fontSize: 28, fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: -1, marginTop: 2 },

  statRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap:                 12,
  },
  statCard: {
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderTop:    '2px solid',
    borderRadius: 10,
    padding:      '14px 16px',
    cursor:       'default',
  },
  statVal:   { fontSize: 24, fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: 'var(--subtext)', marginTop: 4, letterSpacing: '0.04em' },

  chartRow: {
    display:  'flex',
    gap:      16,
    flexWrap: 'wrap',
  },
  card: {
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 12,
    padding:      '20px',
  },
  cardHeader: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   16,
    gap:            12,
    flexWrap:       'wrap',
  },
  cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 },
  cardSub:   { fontSize: 11, color: 'var(--subtext)', marginTop: 3 },
  cardIcon: {
    width:          34,
    height:         34,
    borderRadius:   8,
    background:     'rgba(0,122,255,0.06)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  legend: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 },

  donutCenter: {
    position:       'absolute',
    top:            '50%',
    left:           '50%',
    transform:      'translate(-50%, -50%)',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    pointerEvents:  'none',
  },

  insightRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap:                 14,
  },
  insightCard: {
    background:   'var(--card-bg)',
    border:       '0.5px solid var(--border)',
    borderRadius: 12,
    padding:      '18px',
    cursor:       'default',
  },
  insightIcon: {
    width:          36,
    height:         36,
    borderRadius:   9,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   12,
  },
  insightTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' },
  insightBody:  { fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6, margin: 0 },

  emptyState: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '80px 24px',
    textAlign:      'center',
  },
};

export default Analytics;