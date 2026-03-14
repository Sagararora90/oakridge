import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';
import useStore from '../store/useStore';

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {}
  };

  return (
    <div style={pg.root}>

      {/* ── SPLIT: left brand panel + right form ── */}
      <div style={pg.split}>

        {/* LEFT — brand panel (hidden on mobile) */}
        <div style={pg.brand}>
          <div style={pg.brandInner}>
            <div style={pg.brandLogo}>
              <GraduationCap size={28} color="#fff" />
            </div>
            <h1 style={pg.brandName}>Oakridge</h1>
            <p style={pg.brandTagline}>
              Your smart attendance companion — track, plan, and stay ahead.
            </p>

            {/* Decorative stats */}
            <div style={pg.statList}>
              {[
                { label: 'Students',      value: '2,400+' },
                { label: 'Classes logged',value: '180k+'  },
                { label: 'Avg accuracy',  value: '98%'    },
              ].map((s, i) => (
                <div key={i} style={pg.stat}>
                  <span style={pg.statVal}>{s.value}</span>
                  <span style={pg.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div style={pg.formSide}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={pg.formCard}
          >
            {/* Mobile logo (shown only on small screens) */}
            <div style={pg.mobileLogo}>
              <div style={pg.mobileLogoIcon}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <span style={pg.mobileLogoText}>Oakridge</span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={pg.formTitle}>Welcome back</h2>
              <p style={pg.formSub}>Sign in to your account to continue.</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={pg.errorBox}
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <FormField label="Email address">
                <div style={pg.inputWrap}>
                  <Mail size={14} style={pg.inputIcon} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={pg.input}
                    className="focus:border-primary/40"
                  />
                </div>
              </FormField>

              <FormField label="Password">
                <div style={pg.inputWrap}>
                  <Lock size={14} style={pg.inputIcon} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={pg.input}
                    className="focus:border-primary/40"
                  />
                </div>
              </FormField>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...pg.submitBtn,
                  opacity: loading ? 0.7 : 1,
                  cursor:  loading ? 'not-allowed' : 'pointer',
                }}
                className="active:scale-98 transition-all"
              >
                {loading ? (
                  'Signing in…'
                ) : (
                  <>
                    <LogIn size={15} />
                    Sign in
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p style={pg.footerText}>
              Don't have an account?{' '}
              <Link to="/signup" style={pg.footerLink}>
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={pg.fieldLabel}>{label}</label>
    {children}
  </div>
);

const pg = {
  root: {
    minHeight:      '100vh',
    background:     '#faf9f7',
    display:        'flex',
    alignItems:     'stretch',
  },

  split: {
    display: 'flex',
    width:   '100%',
  },

  // ── Left brand panel ──
  brand: {
    flex:           '0 0 42%',
    background:     'var(--primary, #007aff)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '48px 40px',
    // Hidden on mobile via media query workaround — we use a min-width check
    // On truly small screens, this collapses. Use @media if you add a CSS file.
  },
  brandInner: {
    maxWidth: 320,
  },
  brandLogo: {
    width:          56,
    height:         56,
    background:     'rgba(255,255,255,0.15)',
    borderRadius:   14,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   20,
    border:         '1px solid rgba(255,255,255,0.2)',
  },
  brandName: {
    fontSize:     28,
    fontWeight:   800,
    color:        '#fff',
    margin:       '0 0 10px',
    letterSpacing:-0.5,
  },
  brandTagline: {
    fontSize:   15,
    color:      'rgba(255,255,255,0.75)',
    lineHeight: 1.6,
    margin:     '0 0 40px',
  },
  statList: {
    display:             'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap:                 16,
    borderTop:           '1px solid rgba(255,255,255,0.15)',
    paddingTop:          32,
  },
  stat:      { display: 'flex', flexDirection: 'column', gap: 4 },
  statVal:   { fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' },

  // ── Right form side ──
  formSide: {
    flex:           1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '32px 24px',
    minHeight:      '100vh',
  },
  formCard: {
    width:    '100%',
    maxWidth: 400,
  },

  // Mobile logo — shown when brand panel is hidden
  mobileLogo: {
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    marginBottom:   28,
    // On desktop with brand panel visible, hide this
    // Since we can't do @media here, it's always shown but harmless on desktop
  },
  mobileLogoIcon: {
    width:          36,
    height:         36,
    background:     'var(--primary, #007aff)',
    borderRadius:   9,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  mobileLogoText: {
    fontSize:   17,
    fontWeight: 800,
    color:      '#0f0e0d',
  },

  formTitle: { fontSize: 24, fontWeight: 800, color: '#0f0e0d', margin: 0, letterSpacing: -0.5 },
  formSub:   { fontSize: 14, color: '#8c8a87', marginTop: 6 },

  errorBox: {
    background:   '#FCEBEB',
    border:       '0.5px solid #F7C1C1',
    color:        '#A32D2D',
    borderRadius: 8,
    padding:      '10px 14px',
    fontSize:     13,
    marginBottom: 16,
    textAlign:    'center',
  },

  fieldLabel: {
    fontSize:      11,
    color:         '#8c8a87',
    letterSpacing: '0.04em',
  },
  inputWrap: {
    position:    'relative',
    display:     'flex',
    alignItems:  'center',
  },
  inputIcon: {
    position:      'absolute',
    left:          12,
    stroke:        '#b0ada8',
    pointerEvents: 'none',
    flexShrink:    0,
  },
  input: {
    width:        '100%',
    background:   '#fff',
    border:       '0.5px solid #e3e0da',
    borderRadius: 9,
    padding:      '11px 12px 11px 36px',
    fontSize:     14,
    color:        '#0f0e0d',
    outline:      'none',
    fontWeight:   500,
    transition:   'border-color 0.15s',
    boxSizing:    'border-box',
  },

  submitBtn: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    width:          '100%',
    padding:        '12px',
    borderRadius:   10,
    border:         'none',
    background:     'var(--primary, #007aff)',
    color:          '#fff',
    fontSize:       14,
    fontWeight:     700,
    marginTop:      4,
  },

  footerText: {
    marginTop:  24,
    fontSize:   13,
    color:      '#8c8a87',
    textAlign:  'center',
  },
  footerLink: {
    color:          'var(--primary, #007aff)',
    fontWeight:     600,
    textDecoration: 'none',
  },
};

export default Login;