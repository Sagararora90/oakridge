import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, LayoutDashboard, BookOpen, Calendar,
  BrainCircuit, Settings, LogOut, GraduationCap,
  X, Menu, Target, BarChart3, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

const navItems = [
  { name: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard'  },
  { name: 'Timetable',  icon: Calendar,         path: '/timetable'  },
  { name: 'Exams',      icon: Target,           path: '/exams'      },
  { name: 'AI Planner', icon: BrainCircuit,     path: '/ai-planner' },
  { name: 'Analytics',  icon: BarChart3,        path: '/analytics'  },
  { name: 'Subjects',   icon: BookOpen,         path: '/subjects'   },
  { name: 'Settings',   icon: Settings,         path: '/settings'   },
];

const bottomBarItems = [
  { name: 'Home',      icon: LayoutDashboard, path: '/dashboard'  },
  { name: 'Schedule',  icon: Calendar,        path: '/timetable'  },
  { name: 'Ask AI',    icon: BrainCircuit,    path: '/ai-planner' },
  { name: 'Analysis',  icon: BarChart3,       path: '/analytics'  },
  { name: 'Subjects',  icon: BookOpen,        path: '/subjects'   },
  { name: 'Settings',  icon: Settings,        path: '/settings'   },
];

const Sidebar = () => {
  const { logout, user, theme, toggleTheme, sidebarOpen, setSidebarOpen } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ══════════════════════════════
          DESKTOP SIDEBAR  (lg+)
      ══════════════════════════════ */}
      <div className="hidden lg:flex w-64 h-screen sticky top-0 flex-col bg-sidebar-bg border-r border-border z-50 shadow-sm">
        <div className="flex flex-col h-full py-8">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 px-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text">Oakridge</h1>
          </div>

          {/* Nav */}
          <div className="px-4 space-y-8 flex-1 overflow-y-auto">
            <NavGroup label="Main Menu"        items={navItems.slice(0, 4)} />
            <NavGroup label="Social & Personal" items={navItems.slice(4)}   />
          </div>

          {/* User + Logout */}
          <div className="mt-auto px-4 pt-6 border-t border-border">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 mb-3 bg-bg rounded-2xl hover:bg-bg/80 transition-all border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="text-sm font-bold text-text">
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
            </button>
            <UserCard user={user} />
            <LogoutButton onClick={handleLogout} />
          </div>
        </div>
      </div>

      {/* MOBILE TOP BAR REMOVED because we have bottom bar and redundant theme icons */}

      {/* ══════════════════════════════
          MOBILE SLIDE-IN DRAWER
      ══════════════════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-sidebar-bg flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                    <GraduationCap className="text-white w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-text">Oakridge</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-subtext hover:bg-bg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer nav */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar">
                <NavGroup label="Main Menu"        items={navItems.slice(0, 4)} onNavigate={() => setSidebarOpen(false)} />
                <NavGroup label="Social & Personal" items={navItems.slice(4)}   onNavigate={() => setSidebarOpen(false)} />
              </div>

              {/* Drawer footer */}
              <div className="px-4 pb-8 pt-4 border-t border-border">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 mb-4 bg-bg rounded-2xl border border-border/50 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                    <span className="text-sm font-bold text-text">
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-1 transition-colors relative ${theme === 'dark' ? 'bg-primary' : 'bg-subtext/20'}`}>
                    <motion.div 
                      animate={{ x: theme === 'dark' ? 20 : 0 }}
                      className="w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </div>
                </button>
                <UserCard user={user} />
                <LogoutButton onClick={handleLogout} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          MOBILE BOTTOM TAB BAR  (below lg)
      ══════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar-bg/95 backdrop-blur-xl border-t border-border/50 flex items-center justify-between px-1 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-bottom">
        {bottomBarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1.5 flex-1 py-2.5 transition-all duration-200 min-w-0 ${
                isActive ? 'text-primary' : 'text-subtext/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                  <item.icon className={`${isActive ? 'w-5 h-5' : 'w-5 h-5 opacity-70'}`} />
                </div>
                <span className={`text-[9px] font-bold tracking-tight leading-none transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabMobile"
                    className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" 
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

// ── Shared components ──

const NavGroup = ({ label, items, onNavigate }) => (
  <div>
    <p className="text-[10px] font-bold text-subtext uppercase tracking-widest mb-4 px-4">
      {label}
    </p>
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
              isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-sidebar-text hover:bg-bg'
            }`
          }
        >
          {/* ✅ use item.name not item.label */}
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

const UserCard = ({ user }) => (
  <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-bg rounded-2xl">
    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
      {user?.name?.charAt(0).toUpperCase() || 'S'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-text truncate">{user?.name || 'Scholar'}</p>
      <p className="text-[10px] text-subtext font-medium uppercase tracking-widest">Premium Student</p>
    </div>
  </div>
);

const LogoutButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-subtext hover:text-danger hover:bg-danger/5 transition-all duration-200 font-bold text-[10px] uppercase tracking-widest"
  >
    <LogOut className="w-4 h-4" />
    Logout
  </button>
);

export default Sidebar;