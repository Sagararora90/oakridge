import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Sidebar from './components/Sidebar';
import TheOracle from './components/TheOracle';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-bg">
    <div className="w-16 h-16 mb-6 text-danger bg-danger/10 rounded-2xl flex items-center justify-center">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-text mb-2">Something went wrong</h1>
    <p className="text-subtext mb-8 max-w-md">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
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

function App() {
  const { fetchUser, token, theme } = useStore();

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.href = '/'}>
      <Router>
        <div className="flex bg-bg text-text min-h-screen transition-all duration-500">
          <Toaster 
            position="top-center" 
            toastOptions={{
              className: 'premium-toast',
              style: {
                background: 'var(--card-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(8px)',
              }
            }} 
          />
          {token && <Sidebar />}
          {token && <TheOracle />}
          <main className={`flex-1 transition-all duration-300 ${token ? 'pt-12 lg:pt-0 mb-20 lg:mb-0' : ''}`}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
              <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/ai-planner" element={<ProtectedRoute><AIPlanner /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
