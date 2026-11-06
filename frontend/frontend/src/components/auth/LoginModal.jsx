import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Shield, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../../api/authService';
import useAuthStore from '../../store/authStore';
import { getRolePath } from '../../utils/helpers';
import { PasswordInput } from '../../components/ui/Input';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const DEMO_ACCOUNTS = [
  { key: 'citizen', label: 'Citizen', email: 'citizen@demo.com', icon: '🏠', color: '#60a5fa', glow: 'rgba(96,165,250,0.25)', activeBorder: 'rgba(96,165,250,0.4)', activeBg: 'rgba(96,165,250,0.08)' },
  { key: 'volunteer', label: 'Volunteer', email: 'volunteer@demo.com', icon: '🦺', color: '#34d399', glow: 'rgba(52,211,153,0.25)', activeBorder: 'rgba(52,211,153,0.4)', activeBg: 'rgba(52,211,153,0.08)' },
  { key: 'admin', label: 'Admin', email: 'admin@demo.com', icon: '🛡️', color: '#c084fc', glow: 'rgba(192,132,252,0.25)', activeBorder: 'rgba(192,132,252,0.4)', activeBg: 'rgba(192,132,252,0.08)' },
];

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [demoRole, setDemoRole] = useState('citizen');
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverErr, setServerErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const formik = useFormik({
    initialValues: { email: '', password: '', remember: true },
    validationSchema: Yup.object({
      email: Yup.string().email('Enter a valid email').required('Email is required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
      remember: Yup.boolean(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setServerErr('');
      try {
        const data = await loginUser(values);
        setAuth(data);
        toast.success(`Welcome back, ${data.first_name}! 👋`);
        handleClose();
        navigate(getRolePath(data.role), { replace: true });
      } catch (err) {
        const msg = err?.response?.data?.message || 'Login failed. Please try again.';
        setServerErr(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fillDemo = (email) => {
    formik.setFieldValue('email', email);
    formik.setFieldValue('password', 'Demo@1234');
  };

  const activeDemo = DEMO_ACCOUNTS.find((a) => a.key === demoRole) || DEMO_ACCOUNTS[0];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        background: visible ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        transition: 'all 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
          background: 'linear-gradient(160deg, rgba(15,23,42,0.88) 0%, rgba(5,10,24,0.9) 100%)',
          backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.75rem',
          padding: '2rem',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 25px 80px rgba(0,0,0,0.7), 0 0 120px rgba(99,102,241,0.08)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="modal-scrollbar"
      >
        {/* Decorative top line */}
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(6,182,212,0.4), transparent)', pointerEvents: 'none' }} />
        {/* Corner glow */}
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 65%)', pointerEvents: 'none' }} />

        {/* Close button */}
        <button onClick={handleClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.75rem', width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', zIndex: 2,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 48, height: 48, borderRadius: '1rem', background: 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <Shield style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', margin: 0 }}>Welcome back</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>Sign in to your DisasterShield account</p>
        </div>

        {/* Server error */}
        {serverErr && (
          <div className="alert-banner alert-danger animate-fade-in" style={{ marginBottom: '0.75rem' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverErr}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={formik.handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', position: 'relative', zIndex: 1 }}>
          <Input
            id="modal-email" label="Email address" type="email" placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={formik.touched.email && formik.errors.email}
            {...formik.getFieldProps('email')}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="text-sm font-medium text-slate-300">Password</label>
              <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}>Forgot?</span>
            </div>
            <PasswordInput
              id="modal-password" placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={formik.touched.password && formik.errors.password}
              {...formik.getFieldProps('password')}
            />
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" className="accent-indigo-500" checked={!!formik.values.remember}
                onChange={(e) => formik.setFieldValue('remember', e.target.checked)}
                style={{ width: '14px', height: '14px', borderRadius: '3px' }} />
              <span className="text-xs text-slate-400">Keep me signed in</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="text-xs text-slate-600">
              <Shield className="w-3 h-3" /> Secure
            </div>
          </div>

          <Button id="login-submit" type="submit" variant="primary" size="lg" fullWidth
            loading={formik.isSubmitting} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
          <span style={{ fontSize: '0.625rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>quick demo</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
        </div>

        {/* Demo Section - Compact */}
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', position: 'relative', zIndex: 1 }}>
          {/* Role pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.375rem' }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const active = acc.key === demoRole;
              return (
                <button key={acc.key} type="button" onClick={() => setDemoRole(acc.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '0.25rem', padding: '0.5rem 0.35rem', borderRadius: '0.75rem',
                    border: active ? `1px solid ${acc.activeBorder}` : '1px solid rgba(255,255,255,0.05)',
                    background: active ? acc.activeBg : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: active ? `0 0 12px ${acc.glow}` : 'none',
                  }}>
                  <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>{acc.icon}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: active ? acc.color : '#64748b' }}>{acc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fill button */}
          <button type="button" onClick={() => fillDemo(activeDemo.email)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
              border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)',
              cursor: 'pointer', transition: 'all 0.2s ease', color: '#a5b4fc',
              fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}>
            <Sparkles className="w-3 h-3" /> Auto-fill {activeDemo.label}
          </button>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#64748b', marginTop: '1rem', position: 'relative', zIndex: 1 }}>
          New here?{' '}
          <span onClick={() => { handleClose(); setTimeout(onSwitchToRegister, 350); }}
            style={{ color: '#818cf8', fontWeight: 700, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = '#a5b4fc'}
            onMouseLeave={e => e.target.style.color = '#818cf8'}>
            Create account →
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
