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
    <div style={pg.root}>
      <div style={pg.split}>

        {/* ── LEFT brand panel ── */}
        <div style={pg.brand}>
          <div style={pg.brandInner}>
            <div style={pg.brandLogo}>
              <GraduationCap size={28} color="#fff" />
            </div>
            <h1 style={pg.brandName}>Oakridge</h1>
            <p style={pg.brandTagline}>
              Join thousands of students who track smarter and stress less about attendance.
            </p>

            {/* Steps */}
            <div style={pg.steps}>
              {[
                { n: '1', text: 'Create your account'       },
                { n: '2', text: 'Add your subjects'         },
                { n: '3', text: 'Upload or build timetable' },
                { n: '4', text: 'Mark and track attendance' },
              ].map((step, i) => (
                <div key={i} style={pg.step}>
                  <div style={pg.stepNum}>{step.n}</div>
                  <span style={pg.stepText}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT form ── */}
        <div style={pg.formSide}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={pg.formCard}
          >
            {/* Mobile logo */}
            <div style={pg.mobileLogo}>
              <div style={pg.mobileLogoIcon}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <span style={pg.mobileLogoText}>Oakridge</span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={pg.formTitle}>Create an account</h2>
              <p style={pg.formSub}>It's free and takes less than a minute.</p>
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

              <FormField label="Full name">
                <div style={pg.inputWrap}>
                  <User size={14} style={pg.inputIcon} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={set('name')}
                    placeholder="Your name"
                    style={pg.input}
                    className="focus:border-primary/40"
                  />
                </div>
              </FormField>

              <FormField label="Email address">
                <div style={pg.inputWrap}>
                  <Mail size={14} style={pg.inputIcon} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={set('email')}
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
                    value={formData.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
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
                  'Creating account…'
                ) : (
                  <>
                    <UserPlus size={15} />
                    Create account
                  </>
                )}
              </button>
            </form>

            <p style={pg.footerText}>
              Already have an account?{' '}
              <Link to="/login" style={pg.footerLink}>Sign in</Link>
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
    minHeight:  '100vh',
    background: '#faf9f7',
    display:    'flex',
    alignItems: 'stretch',
  },
  split: {
    display: 'flex',
    width:   '100%',
  },

  // ── Left brand panel ──
  brand: {
    flex:           '0 0 42%',
    background:     'linear-gradient(160deg, #0F6E56 0%, #007aff 100%)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '48px 40px',
  },
  brandInner: { maxWidth: 320 },
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
  brandName:    { fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: -0.5 },
  brandTagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 36px' },

  steps: { display: 'flex', flexDirection: 'column', gap: 14 },
  step:  { display: 'flex', alignItems: 'center', gap: 12 },
  stepNum: {
    width:          28,
    height:         28,
    borderRadius:   '50%',
    background:     'rgba(255,255,255,0.15)',
    border:         '1px solid rgba(255,255,255,0.25)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       12,
    fontWeight:     700,
    color:          '#fff',
    flexShrink:     0,
  },
  stepText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  // ── Right form ──
  formSide: {
    flex:           1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '32px 24px',
    minHeight:      '100vh',
  },
  formCard: { width: '100%', maxWidth: 400 },

  mobileLogo: {
    display:     'flex',
    alignItems:  'center',
    gap:         10,
    marginBottom:28,
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
  mobileLogoText: { fontSize: 17, fontWeight: 800, color: '#0f0e0d' },

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

  fieldLabel: { fontSize: 11, color: '#8c8a87', letterSpacing: '0.04em' },
  inputWrap:  { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon:  { position: 'absolute', left: 12, stroke: '#b0ada8', pointerEvents: 'none', flexShrink: 0 },
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

  footerText: { marginTop: 24, fontSize: 13, color: '#8c8a87', textAlign: 'center' },
  footerLink: { color: 'var(--primary, #007aff)', fontWeight: 600, textDecoration: 'none' },
};

export default Signup;