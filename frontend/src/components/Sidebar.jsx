import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar,
  BrainCircuit, Settings, LogOut, GraduationCap,
  X, Target, BarChart3, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

/* ─── nav config ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { name: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard'  },
  { name: 'Timetable',  icon: Calendar,        path: '/timetable'  },
  { name: 'Exams',      icon: Target,          path: '/exams'      },
  { name: 'AI Planner', icon: BrainCircuit,    path: '/ai-planner' },
  { name: 'Analytics',  icon: BarChart3,       path: '/analytics'  },
  { name: 'Subjects',   icon: BookOpen,        path: '/subjects'   },
  { name: 'Settings',   icon: Settings,        path: '/settings'   },
];

const BOTTOM_ITEMS = [
  { name: 'Home',     icon: LayoutDashboard, path: '/dashboard'  },
  { name: 'Schedule', icon: Calendar,        path: '/timetable'  },
  { name: 'Ask AI',   icon: BrainCircuit,    path: '/ai-planner' },
  { name: 'Analysis', icon: BarChart3,       path: '/analytics'  },
  { name: 'Subjects', icon: BookOpen,        path: '/subjects'   },
  { name: 'Settings', icon: Settings,        path: '/settings'   },
];

/* ─── motion presets — same as Dashboard ────────────────── */
const SPRING = { type: 'spring', stiffness: 420, damping: 34 };

/* ─── style atoms — mirrors Dashboard's token system ─────── */
const T = {
  font: "-apple-system,'SF Pro Display',sans-serif",
};

/* ════════════════════════════════════════════════════════════ */

export default function Sidebar() {
  const { logout, user, theme, toggleTheme, sidebarOpen, setSidebarOpen } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* ══ DESKTOP SIDEBAR (≥ 1024 px) ══════════════════════ */}
      <aside style={{
        display: 'none',               /* overridden by media query below */
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexDirection: 'column',
        background: 'var(--sidebar-bg, var(--color-card-bg))',
        borderRight: '1px solid var(--color-border)',
        zIndex: 50,
        fontFamily: T.font,
        flexShrink: 0,
      }}
        className="desktop-sidebar"   /* targeted by <style> below */
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 0 24px', overflow: 'hidden' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 36 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
                OAKRIDGE
              </p>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '3px 0 0' }}>
                Intelligence
              </p>
            </div>
          </div>

          {/* Nav groups */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <NavGroup label="Main"     items={NAV_ITEMS.slice(0, 4)} />
            <NavGroup label="Personal" items={NAV_ITEMS.slice(4)} />
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 12px 0', borderTop: '1px solid var(--color-border)', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <UserCard user={user} />
            <LogoutBtn onClick={handleLogout} />
          </div>
        </div>
      </aside>

      {/* ══ MOBILE SLIDE-IN DRAWER ══════════════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            />

            {/* drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 51,
                width: 272,
                background: 'var(--sidebar-bg, var(--color-card-bg))',
                display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 40px rgba(0,0,0,0.15)',
                fontFamily: T.font,
              }}>

              {/* Drawer header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={17} color="#fff" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                    Oakridge
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-subtext)', fontFamily: T.font }}>
                  <X size={14} />
                </button>
              </div>

              {/* Drawer nav */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <NavGroup label="Main"          items={NAV_ITEMS.slice(0, 4)} onNavigate={() => setSidebarOpen(false)} />
                <NavGroup label="Personal"      items={NAV_ITEMS.slice(4)}    onNavigate={() => setSidebarOpen(false)} />
              </div>

              {/* Drawer footer */}
              <div style={{ padding: '12px 12px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <UserCard user={user} />
                <LogoutBtn onClick={handleLogout} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MOBILE BOTTOM TAB BAR (< 1024 px) ══════════════ */}
      <nav
        className="mobile-bottom-bar"
        style={{
          display: 'none',            /* shown by media query */
          position: 'fixed',
          bottom: 20, left: 16, right: 16,
          zIndex: 50,
          background: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 20,
          padding: '6px 4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          fontFamily: T.font,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
        {BOTTOM_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
            {({ isActive }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 2px', position: 'relative' }}>
                {/* active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    transition={SPRING}
                    style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'var(--color-primary-lo, rgba(0,122,255,0.10))' }}
                  />
                )}
                <item.icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-subtext)', position: 'relative', zIndex: 1 }}
                />
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-subtext)',
                  letterSpacing: '0.02em',
                  position: 'relative', zIndex: 1,
                  lineHeight: 1,
                }}>
                  {item.name}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── responsive show/hide via <style> ── */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar  { display: flex !important; }
          .mobile-bottom-bar { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar  { display: none !important; }
          .mobile-bottom-bar { display: flex !important; }
        }
        /* hide scrollbars in sidebar nav lists */
        .sidebar-scroll::-webkit-scrollbar { display: none; }
        .sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

/* ─── sub-components ──────────────────────────────────────── */

function NavGroup({ label, items, onNavigate }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtext)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px 10px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => (
          <NavLink key={item.path} to={item.path} onClick={onNavigate} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                background: isActive ? 'var(--color-primary-lo, rgba(0,122,255,0.08))' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-subtext)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-subtext)'; }}}
              >
                {/* left accent bar */}
                <div style={{ width: 3, height: 16, borderRadius: 2, background: isActive ? 'var(--color-primary)' : 'transparent', flexShrink: 0, transition: 'background 0.15s' }} />
                <item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, letterSpacing: '-0.01em', lineHeight: 1 }}>
                  {item.name}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 10,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer', fontFamily: "-apple-system,'SF Pro Display',sans-serif",
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
        {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}

function UserCard({ user }) {
  const initial = user?.name?.charAt(0).toUpperCase() || 'S';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      {/* avatar — matches Dashboard header avatar logic */}
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'U'}&backgroundColor=007AFF`}
        alt={user?.name || 'User'}
        style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--color-border)', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name || 'Scholar'}
        </p>
        <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-subtext)', margin: '1px 0 0', letterSpacing: '0.01em' }}>
          Premium Account
        </p>
      </div>
    </div>
  );
}

function LogoutBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 10,
        background: 'transparent', border: 'none',
        cursor: 'pointer', fontFamily: "-apple-system,'SF Pro Display',sans-serif",
        color: 'var(--color-subtext)',
        transition: 'background 0.15s, color 0.15s',
        textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; e.currentTarget.style.color = '#FF3B30'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-subtext)'; }}>
      <LogOut size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Logout</span>
    </button>
  );
}