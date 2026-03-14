import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, GraduationCap } from 'lucide-react';
import useStore from '../store/useStore';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { signup, loading, error } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(formData);
      navigate('/');
    } catch {}
  };

  const set = (field) => (e) =>
    setFormData(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-stretch overflow-hidden">
      <div className="flex w-full">

        {/* ── LEFT brand panel (hidden on mall/medium screens) ── */}
        <div className="hidden lg:flex flex-[0_0_42%] bg-gradient-to-br from-[#0F6E56] to-primary items-center justify-center p-12 lg:p-10 relative overflow-hidden">
           {/* Background decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

          <div className="max-w-xs relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 bg-white/15 rounded-[14px] flex items-center justify-center mb-5 border border-white/20 shadow-xl shadow-black/5"
            >
              <GraduationCap size={28} color="#fff" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-white mb-2.5 tracking-tight">Oakridge</h1>
            <p className="text-[15px] text-white/75 leading-relaxed mb-10">
              Join thousands of students who track smarter and stress less about attendance.
            </p>

            {/* Steps */}
            <div className="flex flex-col gap-4">
              {[
                { n: '1', text: 'Create your account'       },
                { n: '2', text: 'Add your subjects'         },
                { n: '3', text: 'Upload or build timetable' },
                { n: '4', text: 'Mark and track attendance' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white group-hover:bg-white/20 transition-all">
                    {step.n}
                  </div>
                  <span className="text-[14px] text-white/80 font-medium">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT form ── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white lg:bg-[#faf9f7]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[380px]"
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 bg-primary rounded-[9px] flex items-center justify-center shadow-lg shadow-primary/20">
                <GraduationCap size={20} color="#fff" />
              </div>
              <span className="text-lg font-extrabold text-[#0f0e0d] tracking-tight">Oakridge</span>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-[#0f0e0d] tracking-tight">Create an account</h2>
              <p className="text-sm text-[#8c8a87] mt-1.5 font-medium">It's free and takes less than a minute.</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-danger/10 border border-danger/20 text-danger rounded-lg p-3 text-[13px] mb-4 text-center font-semibold"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-wider ml-1">Full name</label>
                <div className="relative flex items-center group">
                  <User size={14} className="absolute left-3.5 text-[#b0ada8] group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={set('name')}
                    placeholder="Your name"
                    className="w-full bg-white lg:bg-white border border-[#e3e0da] focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-[10px] py-2.5 pl-10 pr-4 text-sm font-medium text-[#0f0e0d] outline-none transition-all placeholder:text-[#c8c5bf]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-wider ml-1">Email address</label>
                <div className="relative flex items-center group">
                  <Mail size={14} className="absolute left-3.5 text-[#b0ada8] group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={set('email')}
                    placeholder="you@example.com"
                    className="w-full bg-white lg:bg-white border border-[#e3e0da] focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-[10px] py-2.5 pl-10 pr-4 text-sm font-medium text-[#0f0e0d] outline-none transition-all placeholder:text-[#c8c5bf]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#8c8a87] uppercase tracking-wider ml-1">Password</label>
                <div className="relative flex items-center group">
                  <Lock size={14} className="absolute left-3.5 text-[#b0ada8] group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white lg:bg-white border border-[#e3e0da] focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-[10px] py-2.5 pl-10 pr-4 text-sm font-medium text-[#0f0e0d] outline-none transition-all placeholder:text-[#c8c5bf]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Create account
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-[#8c8a87] font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-2 transition-all">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Signup;