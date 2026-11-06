import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { loginUser } from '../../api/authService';
import useAuthStore from '../../store/authStore';
import { getRolePath } from '../../utils/helpers';
import { PasswordInput } from '../../components/ui/Input';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const DEMO_ACCOUNTS = [
  {
    key: 'citizen',
    label: 'Citizen',
    email: 'citizen@demo.com',
    icon: '🏠',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.25)',
    activeBorder: 'rgba(96,165,250,0.4)',
    activeBg: 'rgba(96,165,250,0.08)',
  },
  {
    key: 'volunteer',
    label: 'Volunteer',
    email: 'volunteer@demo.com',
    icon: '🦺',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
    activeBorder: 'rgba(52,211,153,0.4)',
    activeBg: 'rgba(52,211,153,0.08)',
  },
  {
    key: 'admin',
    label: 'Admin',
    email: 'admin@demo.com',
    icon: '🛡️',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.25)',
    activeBorder: 'rgba(192,132,252,0.4)',
    activeBg: 'rgba(192,132,252,0.08)',
  },
];

const LoginPage = () => {
  const [demoRole, setDemoRole] = useState('citizen');
  const navigate    = useNavigate();
  const setAuth     = useAuthStore((s) => s.setAuth);
  const [serverErr, setServerErr] = useState('');

  const formik = useFormik({
    initialValues: { email: '', password: '', remember: true },
    validationSchema: Yup.object({
      email:    Yup.string().email('Enter a valid email').required('Email is required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
      remember: Yup.boolean(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setServerErr('');
      try {
        const data = await loginUser(values);
        setAuth(data);
        toast.success(`Welcome back, ${data.first_name}! 👋`);
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

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your DisasterShield account">

      {/* ── Server error ── */}
      {serverErr && (
        <div className="alert-banner alert-danger animate-fade-in" style={{ marginBottom: '0' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverErr}</span>
        </div>
      )}

      {/* ── Login Form ── */}
      <form onSubmit={formik.handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={formik.touched.email && formik.errors.email}
          {...formik.getFieldProps('email')}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="text-sm font-medium text-slate-300">Password</label>
            <Link
              to="/reset-password"
              style={{
                fontSize: '0.75rem',
                color: '#818cf8',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = '#a5b4fc'}
              onMouseLeave={e => e.target.style.color = '#818cf8'}
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={formik.touched.password && formik.errors.password}
            {...formik.getFieldProps('password')}
          />
        </div>

        {/* Remember me row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              className="accent-indigo-500"
              checked={!!formik.values.remember}
              onChange={(e) => formik.setFieldValue('remember', e.target.checked)}
              style={{ width: '15px', height: '15px', borderRadius: '4px' }}
            />
            <span className="text-sm text-slate-400">Keep me signed in</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }} className="text-xs text-slate-600">
            <Shield className="w-3 h-3" />
            Secure login
          </div>
        </div>

        <Button
          id="login-submit"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={formik.isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          style={{ marginTop: '0.25rem' }}
        >
          Sign In
        </Button>
      </form>

      {/* ── Divider ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
        <span style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          try a demo
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
      </div>

      {/* ── Demo Section ── */}
      <div
        style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '1.125rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Role selector pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
          {DEMO_ACCOUNTS.map((acc) => {
            const active = acc.key === demoRole;
            return (
              <button
                key={acc.key}
                type="button"
                onClick={() => setDemoRole(acc.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                  padding: '0.875rem 0.5rem',
                  borderRadius: '0.875rem',
                  border: active ? `1px solid ${acc.activeBorder}` : '1px solid rgba(255,255,255,0.05)',
                  background: active ? acc.activeBg : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? `0 0 16px ${acc.glow}` : 'none',
                }}
              >
                <span style={{ fontSize: '1.375rem', lineHeight: 1 }}>{acc.icon}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: active ? acc.color : '#64748b',
                    transition: 'color 0.2s',
                  }}
                >
                  {acc.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Credentials row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ fontSize: '0.625rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>Email</span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#cbd5e1' }}>{activeDemo.email}</span>
          </div>
          <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', textAlign: 'right' }}>
            <span style={{ fontSize: '0.625rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>Password</span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#cbd5e1' }}>Demo@1234</span>
          </div>
        </div>

        {/* Fill button */}
        <button
          type="button"
          onClick={() => fillDemo(activeDemo.email)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '0.625rem',
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#a5b4fc',
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Auto-fill {activeDemo.label} credentials
        </button>
      </div>

      {/* ── Register link ── */}
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
        New to DisasterShield?{' '}
        <Link
          to="/register"
          style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = '#a5b4fc'}
          onMouseLeave={e => e.target.style.color = '#818cf8'}
        >
          Create account →
        </Link>
      </p>

      {/* ── Hint ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#334155' }}>
        <Zap className="w-3 h-3" />
        Use the demo selector above to autofill credentials
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
