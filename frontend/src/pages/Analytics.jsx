import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Activity, Target, Award, ShieldAlert,
  TrendingUp, TrendingDown, BookOpen, Sparkles,
} from 'lucide-react';
import useStore from '../store/useStore';
import RescuePlanModal from '../components/RescuePlanModal';

/* ─── Tokens ─────────────────────────────────────────────────── */
const FONT   = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif";
const SPRING = { type: 'spring', stiffness: 340, damping: 30 };

/* ─── Helpers ────────────────────────────────────────────────── */
function pct(attended, total) {
  return total > 0 ? (attended / total) * 100 : 0;
}

const useIsMobile = (bp = 768) => {
  const [m, set] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : false);
  React.useEffect(() => {
    const fn = () => set(window.innerWidth < bp);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
};

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, isMobile }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={SPRING}
      style={{
        background: 'var(--color-card-bg)',
        borderRadius: 18,
        border: '1px solid var(--color-border)',
        padding: isMobile ? '16px' : '22px 22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 10 : 14,
        fontFamily: FONT,
      }}
    >
      <div style={{
        width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: 11,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={isMobile ? 16 : 18} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', marginTop: 5, letterSpacing: '0.02em' }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Insight card ───────────────────────────────────────────── */
function InsightCard({ icon: Icon, iconColor, iconBg, title, children, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={SPRING}
      style={{
        background: 'var(--color-card-bg)',
        borderRadius: 18,
        border: accent ? `1px solid color-mix(in srgb, ${accent} 28%, transparent)` : '1px solid var(--color-border)',
        padding: '22px 22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONT,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor,
        flexShrink: 0,
      }}>
        <Icon size={17} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-subtext)', lineHeight: 1.6, flex: 1, fontWeight: 400 }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Custom tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-card-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '10px 14px',
      fontFamily: FONT,
      fontSize: 12,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
    }}>
      <p style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{payload[0]?.payload?.fullName || label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════ */
const Analytics = () => {
  const isMobile = useIsMobile();
  const { subjects } = useStore();
  const [rescueSubject, setRescueSubject] = React.useState(null);

  /* ── derived data ── */
  const historyData = React.useMemo(() => {
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14Days.push({
        dateStr: d.toISOString().split('T')[0],
        label:   d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        Attended: 0,
        Missed:   0,
      });
    }

    subjects.forEach(s => {
      s.attendanceRecords?.forEach(log => {
        if (!log.date) return;
        const date = new Date(log.date).toISOString().split('T')[0];
        const dayMatch = last14Days.find(d => d.dateStr === date);
        if (dayMatch) {
          if (log.status === 'Present' || log.status === 'OD' || log.status === 'Medical') {
            dayMatch.Attended += (log.credit || 1);
          } else if (log.status === 'Absent') {
            dayMatch.Missed += (log.credit || 1);
          }
        }
      });
    });
    return last14Days;
  }, [subjects]);

  const pieData = subjects.map(s => ({
    name:  s.name,
    value: s.attended,
    color: s.color || 'var(--color-primary)',
  }));

  const barData = subjects.map(s => ({
    name:     s.name.substring(0, 4).toUpperCase(),
    fullName: s.name,
    Attended: s.attended,
    Missed:   s.total - s.attended,
    color:    s.color || 'var(--color-primary)',
  }));

  const avgAttendance = subjects.length > 0
    ? subjects.reduce((acc, s) => acc + pct(s.attended, s.total), 0) / subjects.length
    : 0;

  const totalAttended = subjects.reduce((a, s) => a + s.attended, 0);
  const totalClasses  = subjects.reduce((a, s) => a + s.total,    0);
  const totalMissed   = totalClasses - totalAttended;

  const ranked = [...subjects].sort((a, b) => pct(b.attended, b.total) - pct(a.attended, a.total));
  const best   = ranked[0];
  const worst  = ranked[ranked.length - 1];

  const isHealthy = avgAttendance >= 75;

  /* ── empty state ── */
  if (subjects.length === 0) {
    return (
      <div style={{
        minHeight: '100svh', background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT,
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={26} strokeWidth={1.4} style={{ color: 'var(--color-subtext)' }} />
          </div>
          <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em', margin: 0 }}>No data yet</p>
          <p style={{ fontSize: 14, color: 'var(--color-subtext)', margin: 0, maxWidth: 240, lineHeight: 1.5 }}>
            Add subjects to start seeing your attendance analytics.
          </p>
        </div>
      </div>
    );
  }

  /* ════ RENDER ════ */
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100svh', paddingBottom: 64, fontFamily: FONT }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>

        {/* ── HEADER ── */}
        <header style={{
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between',
          padding: isMobile ? '24px 0 20px' : '28px 0 24px', 
          gap: 16,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 28,
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 24 : 26, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>
              Analytics
            </h1>
            <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--color-subtext)', margin: '3px 0 0', fontWeight: 400 }}>
              Attendance overview across all courses
            </p>
          </div>

          <div style={{
            background: 'var(--color-card-bg)',
            border: `1px solid var(--color-border)`,
            borderRadius: 16,
            padding: '14px 22px',
            textAlign: 'center',
            width: isMobile ? '100%' : 130,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtext)', letterSpacing: '0.04em', marginBottom: 4 }}>
              Overall
            </div>
            <div style={{
              fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1,
              color: isHealthy ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
              {avgAttendance.toFixed(1)}<span style={{ fontSize: 16, opacity: 0.5 }}>%</span>
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0,
              height: 3,
              width: `${Math.min(avgAttendance, 100)}%`,
              background: isHealthy ? 'var(--color-success)' : 'var(--color-danger)',
              borderRadius: '0 3px 0 0',
              transition: 'width 1s ease',
            }} />
          </div>
        </header>

        {/* ── STATS ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: isMobile ? 8 : 12,
          marginBottom: 28,
        }}>
          <StatCard label={isMobile ? "Attended" : "Sessions attended"} value={totalAttended} icon={TrendingUp}   color="var(--color-success)" isMobile={isMobile} />
          <StatCard label={isMobile ? "Missed" : "Sessions missed"}   value={totalMissed}   icon={TrendingDown} color="var(--color-danger)" isMobile={isMobile} />
          <StatCard label={isMobile ? "Courses" : "Active courses"}           value={subjects.length} icon={BookOpen}   color="var(--color-primary)" isMobile={isMobile} />
          <StatCard label={isMobile ? "Total" : "Total sessions"}    value={totalClasses}  icon={Activity}     color="var(--color-accent)" isMobile={isMobile} />
        </div>

        {/* ── CHARTS ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)',
          gap: 12,
          marginBottom: 28,
        }}>

          {/* area chart */}
          <div style={{
            background: 'var(--color-card-bg)', borderRadius: 18,
            border: '1px solid var(--color-border)',
            padding: isMobile ? '18px 18px 12px' : '22px 22px 14px',
          }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
                  Attendance trend
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-subtext)', margin: '3px 0 0', fontWeight: 400 }}>
                  Last 14 days activity
                </p>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {[['var(--color-primary)', 'Attended'], ['var(--color-danger)', 'Missed']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-subtext)', fontWeight: 600 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: isMobile ? 200 : 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--color-danger)" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false} tickLine={false}
                    tick={{ fill: 'var(--color-subtext)', fontSize: 10, fontWeight: 600, fontFamily: FONT }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="Attended"
                    stroke="var(--color-primary)" strokeWidth={2.5}
                    fill="url(#ag1)"
                    dot={{ r: 4, fill: 'var(--color-bg)', stroke: 'var(--color-primary)', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--color-bg)', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone" dataKey="Missed"
                    stroke="var(--color-danger)" strokeWidth={1.5}
                    strokeDasharray="5 4"
                    fill="url(#ag2)"
                    dot={false}
                    opacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* donut */}
          <div style={{
            background: 'var(--color-card-bg)', borderRadius: 18,
            border: '1px solid var(--color-border)',
            padding: '22px 20px',
            display: 'flex', flexDirection: 'column',
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Distribution
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-subtext)', margin: '0 0 16px', fontWeight: 400 }}>
              Sessions by course
            </p>

            <div style={{ height: 180, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={58} outerRadius={82}
                    paddingAngle={4} dataKey="value" stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.88} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {totalAttended}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-subtext)', fontWeight: 500, marginTop: 3 }}>
                  sessions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── INSIGHTS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>

          <InsightCard
            icon={Target}
            iconColor="var(--color-primary)"
            iconBg="var(--color-primary-lo)"
            title="Overall verdict"
            accent="var(--color-primary)"
          >
            {isHealthy
              ? `You're tracking well at ${avgAttendance.toFixed(1)}% — above the 75% threshold.`
              : `Your average of ${avgAttendance.toFixed(1)}% is below the 75% requirement.`}
          </InsightCard>

          <InsightCard
            icon={Award}
            iconColor="var(--color-success)"
            iconBg="var(--color-success-lo)"
            title="Best course"
            accent="var(--color-success)"
          >
            {best
              ? `${best.name} leads at ${pct(best.attended, best.total).toFixed(1)}%.`
              : 'Not enough data yet.'}
          </InsightCard>

          <InsightCard
            icon={ShieldAlert}
            iconColor="var(--color-danger)"
            iconBg="var(--color-danger-lo)"
            title="Needs attention"
            accent="var(--color-danger)"
          >
            {worst && worst !== best ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span>
                  {worst.name} is at {pct(worst.attended, worst.total).toFixed(1)}%.
                </span>
                <button
                  onClick={() => setRescueSubject(worst)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 0', borderRadius: 10,
                    border: 'none', background: 'var(--color-danger)', color: 'white',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                    transition: 'background .12s, transform .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-danger)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-danger)'}

                  onMouseDown={e => e.currentTarget.style.transform = 'scale(.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Sparkles size={13} /> Rescue plan
                </button>
              </div>
            ) : (
              'All courses are meeting their attendance targets.'
            )}
          </InsightCard>
        </div>

      </div>

      <AnimatePresence>
        {rescueSubject && (
          <RescuePlanModal subject={rescueSubject} onClose={() => setRescueSubject(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;