import React, { useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar,
  BrainCircuit, Settings, LogOut, GraduationCap,
  X, Target, BarChart3, Sun, Moon, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import useStore from '../store/useStore';

/* ─── nav config ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { name: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard'  },
  { name: 'Schedule',   icon: Calendar,        path: '/timetable'  },
  { name: 'Exams',      icon: Target,          path: '/exams'      },
  { name: 'AI Planner', icon: BrainCircuit,    path: '/ai-planner' },
  { name: 'Analytics',  icon: BarChart3,       path: '/analytics'  },
  { name: 'Subjects',   icon: BookOpen,        path: '/subjects'   },
  { name: 'Settings',   icon: Settings,        path: '/settings'   },
];

/* Mobile bottom bar items — keep compact */
const BOTTOM_ITEMS = [
  { name: 'Home',     icon: LayoutDashboard, path: '/dashboard'  },
  { name: 'Schedule', icon: Calendar,        path: '/timetable'  },
  { name: 'AI',       icon: BrainCircuit,    path: '/ai-planner' },
  { name: 'Stats',    icon: BarChart3,       path: '/analytics'  },
  { name: 'Courses',  icon: BookOpen,        path: '/subjects'   },
  { name: 'Settings', icon: Settings,        path: '/settings'   },
];

const SPRING = { type: 'spring', stiffness: 500, damping: 35 };
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif";

/* ════════════════════════════════════════════════════════════ */

export default function Sidebar() {
  const { logout, user, theme, toggleTheme, sidebarOpen, setSidebarOpen } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── Swipe navigation on mobile ── */
  const currentIdx = BOTTOM_ITEMS.findIndex(i => location.pathname === i.path);
  const swipeX = useMotionValue(0);

  const handleSwipeDragEnd = useCallback((_, info) => {
    const threshold = 50;
    const velocity = 300;
    if ((info.offset.x < -threshold || info.velocity.x < -velocity) && currentIdx < BOTTOM_ITEMS.length - 1) {
      navigate(BOTTOM_ITEMS[currentIdx + 1].path);
    } else if ((info.offset.x > threshold || info.velocity.x > velocity) && currentIdx > 0) {
      navigate(BOTTOM_ITEMS[currentIdx - 1].path);
    }
    animate(swipeX, 0, { type: 'spring', stiffness: 500, damping: 40 });
  }, [currentIdx, navigate, swipeX]);

  return (
    <>
      {/* ══ DESKTOP SIDEBAR (≥ 1024 px) ══════════════════════ */}
      <aside style={{
        display: 'none',
        width: 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexDirection: 'column',
        background: 'var(--sidebar-bg, var(--card-bg))',
        borderRight: '1px solid var(--border)',
        zIndex: 50,
        fontFamily: FONT,
        flexShrink: 0,
      }}
        className="desktop-sidebar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 0 24px', overflow: 'hidden' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 36 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 12px var(--color-primary-lo)',
            }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
                OAKRIDGE
              </p>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--subtext)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '3px 0 0' }}>
                Intelligence
              </p>
            </div>
          </div>

          {/* Nav groups */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <NavGroup label="Main"     items={NAV_ITEMS.slice(0, 3)} />
            <NavGroup label="Personal" items={NAV_ITEMS.slice(3)} />
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 12px 0', borderTop: '1px solid var(--border)', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(var(--bg-rgb), 0.4)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              }}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 51,
                width: 272,
                background: 'var(--sidebar-bg, var(--card-bg))',
                display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 40px rgba(0,0,0,0.15)',
                fontFamily: FONT,
              }}>

              {/* Drawer header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={17} color="white" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                    Oakridge
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--subtext)', fontFamily: FONT,
                  }}>
                  <X size={14} />
                </button>
              </div>

              {/* Drawer nav */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <NavGroup label="Main"     items={NAV_ITEMS.slice(0, 3)} onNavigate={() => setSidebarOpen(false)} />
                <NavGroup label="Personal" items={NAV_ITEMS.slice(3)}    onNavigate={() => setSidebarOpen(false)} />
              </div>

              {/* Drawer footer */}
              <div style={{ padding: '12px 12px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <UserCard user={user} />
                <LogoutBtn onClick={handleLogout} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MOBILE BOTTOM TAB BAR — Frosted Glass ══════════════ */}
      <nav
        className="mobile-bottom-bar"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 12, left: 12, right: 12,
          zIndex: 50,
          background: 'rgba(var(--bg-rgb), 0.7)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--color-border)',
          borderRadius: 22,
          padding: '4px 2px',
          boxShadow: 'var(--shadow-lg), 0 0 0 0.5px var(--color-border)',
          fontFamily: FONT,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
        {BOTTOM_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={SPRING}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 2, padding: '7px 2px', position: 'relative', borderRadius: 14,
                }}
              >
                {/* Active pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottomBarPill"
                    transition={SPRING}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 14,
                      background: 'var(--primary-lo)',
                    }}
                  />
                )}
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--subtext)',
                    position: 'relative', zIndex: 1,
                    transition: 'color 0.15s',
                  }}
                />
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--subtext)',
                  letterSpacing: '0.02em',
                  position: 'relative', zIndex: 1,
                  lineHeight: 1,
                  transition: 'color 0.15s',
                }}>
                  {item.name}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Swipe area overlay for page swiping (mobile only) ── */}
      <motion.div
        className="mobile-swipe-zone"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleSwipeDragEnd}
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 80,
          zIndex: 1, touchAction: 'pan-y',
          x: swipeX,
        }}
      />

      {/* ── responsive show/hide ── */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar  { display: flex !important; }
          .mobile-bottom-bar { display: none !important; }
          .mobile-swipe-zone { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar  { display: none !important; }
          .mobile-bottom-bar { display: flex !important; }
          .mobile-swipe-zone { display: block !important; }
        }
      `}</style>
    </>
  );
}

/* ─── sub-components ──────────────────────────────────────── */

function NavGroup({ label, items, onNavigate }) {
  return (
    <div>
      <p style={{
        fontSize: 9, fontWeight: 700, color: 'var(--subtext)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        margin: '0 0 8px 10px',
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => (
          <NavLink key={item.path} to={item.path} onClick={onNavigate} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, position: 'relative',
                background: isActive ? 'var(--primary-lo)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--subtext)',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.color = 'var(--text)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--subtext)'; }}}
              >
                {/* Active accent bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    transition={SPRING}
                    style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 16, borderRadius: 2,
                      background: 'var(--primary)',
                    }}
                  />
                )}
                <div style={{ width: 3, height: 16, flexShrink: 0, opacity: isActive ? 0 : 1 }} />
                <item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em', lineHeight: 1,
                }}>
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
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer', fontFamily: FONT,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--bg)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary)', flexShrink: 0,
      }}>
        {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}

function UserCard({ user }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 10,
      background: 'var(--surface)', border: '1px solid var(--border)',
    }}>
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'U'}&backgroundColor=007AFF`}
        alt={user?.name || 'User'}
        style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0,
          letterSpacing: '-0.01em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.name || 'Scholar'}
        </p>
        <p style={{
          fontSize: 10, color: 'var(--subtext)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.email || ''}
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
        background: 'transparent',
        border: '1px solid var(--border)',
        cursor: 'pointer', fontFamily: FONT,
        color: 'var(--danger)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-lo)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <LogOut size={14} />
      <span style={{ fontSize: 12, fontWeight: 600 }}>Sign Out</span>
    </button>
  );
}