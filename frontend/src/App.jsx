import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from './store/useStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Timetable from './pages/Timetable';
import Analytics from './pages/Analytics';
import Exams from './pages/Exams';
import AIPlanner from './pages/AIPlanner';
import Settings from './pages/Settings';
// import DailyAttendance from './pages/DailyAttendance';
import Sidebar from './components/Sidebar';
import TheOracle from './components/TheOracle';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

/* ── Apple-style page transition ── */
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: -8, scale: 0.99 },
};
const PAGE_TRANSITION = { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] };

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
}

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', padding: 24, textAlign: 'center', background: 'var(--bg)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  }}>
    <div style={{
      width: 64, height: 64, borderRadius: 16, marginBottom: 24,
      background: 'var(--danger-lo)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--danger)',
    }}>
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Something went wrong</h1>
    <p style={{ color: 'var(--subtext)', marginBottom: 32, maxWidth: 320 }}>{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      style={{
        padding: '12px 24px', background: 'var(--primary)', color: '#fff',
        fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer',
        fontSize: 14, boxShadow: '0 4px 16px rgba(0,122,255,0.25)',
      }}
    >
      Try again
    </button>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const token = useStore((state) => state.token);
  if (!token) return <Navigate to="/login" />;
  return children;
};

/* ── Animated Routes wrapper ── */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute><PageWrapper><Subjects /></PageWrapper></ProtectedRoute>} />
        <Route path="/timetable" element={<ProtectedRoute><PageWrapper><Timetable /></PageWrapper></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><PageWrapper><Exams /></PageWrapper></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><PageWrapper><Analytics /></PageWrapper></ProtectedRoute>} />
        <Route path="/ai-planner" element={<ProtectedRoute><PageWrapper><AIPlanner /></PageWrapper></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />
        <Route path="/daily" element={<Navigate to="/timetable" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { fetchUser, token, theme } = useStore();

  useEffect(() => {
    if (token) fetchUser();
  }, [token]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.href = '/'}>
      <Router>
        <div style={{
          display: 'flex', background: 'var(--bg)', color: 'var(--text)',
          minHeight: '100vh', position: 'relative',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
          transition: 'background 0.4s ease, color 0.4s ease',
        }}>

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                fontFamily: 'inherit',
              }
            }}
          />

          {token && <Sidebar />}
          {token && <TheOracle />}

          <main style={{
            flex: 1,
            paddingTop: token ? undefined : 0,
            paddingBottom: token ? undefined : 0,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
          }}
            className={token ? 'pt-0 lg:pt-0 mb-20 lg:mb-0' : ''}
          >
            <AnimatedRoutes />
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
