import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { requestPasswordReset, verifyOtp, resetPassword } from '../../api/authService';
import Input, { PasswordInput } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getPasswordStrength, strengthLabel, strengthColor } from '../../utils/helpers';

const STEPS = ['Email', 'Verify OTP', 'New Password'];

const PasswordStrengthBar = ({ password }) => {
  const score = getPasswordStrength(password);
  return password ? (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? strengthColor(score) : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <p className="text-[11px] font-semibold" style={{ color: strengthColor(score) }}>
        {strengthLabel(score)}
      </p>
    </div>
  ) : null;
};

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const [step, setStep]             = useState(0);
  const [email, setEmail]           = useState('');
  const [resetToken, setResetToken] = useState('');
  const [serverErr, setServerErr]   = useState('');

  /* Step 0 – Email */
  const emailForm = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({ email: Yup.string().email('Invalid email').required('Email is required') }),
    onSubmit: async (values, { setSubmitting }) => {
      setServerErr('');
      try {
        await requestPasswordReset({ email: values.email });
        setEmail(values.email);
        toast.success('OTP sent! Check your email. (Demo OTP: 123456)');
        setStep(1);
      } catch (err) {
        const msg = err?.response?.data?.message || 'Request failed.';
        setServerErr(msg);
        toast.error(msg);
      } finally { setSubmitting(false); }
    },
  });

  /* Step 1 – OTP */
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleOtpChange = (val, idx) => {
    const n = [...otp];
    n[idx] = val.replace(/\D/, '').slice(-1);
    setOtp(n);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const verifyOtpHandler = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter full 6-digit OTP'); return; }
    setOtpLoading(true);
    setServerErr('');
    try {
      const { reset_token } = await verifyOtp({ email, otp: code });
      setResetToken(reset_token);
      toast.success('OTP verified!');
      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || 'OTP verification failed.';
      setServerErr(msg);
      toast.error(msg);
    } finally { setOtpLoading(false); }
  };

  /* Step 2 – New password */
  const resetForm = useFormik({
    initialValues: { password: '', confirm_password: '' },
    validationSchema: Yup.object({
      password:         Yup.string().min(8, 'Min 8 characters').required('Required'),
      confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setServerErr('');
      try {
        await resetPassword({ reset_token: resetToken, password: values.password });
        toast.success('Password reset successful!');
        navigate('/login');
      } catch (err) {
        const msg = err?.response?.data?.message || 'Reset failed.';
        setServerErr(msg);
        toast.error(msg);
      } finally { setSubmitting(false); }
    },
  });

  const StepDot = ({ i }) => (
    <div className={`step-dot ${i < step ? 'step-dot-done' : i === step ? 'step-dot-active' : 'step-dot-inactive'}`}>
      {i < step ? <CheckCircle className="w-3 h-3" /> : i + 1}
    </div>
  );

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={['Verify your email address', 'Enter the OTP we sent you', 'Set your new password'][step]}
    >
      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <StepDot i={i} />
              <span className={`text-[10px] font-semibold whitespace-nowrap ${i === step ? 'text-indigo-300' : i < step ? 'text-green-400' : 'text-slate-600'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line mx-2 ${i < step ? 'step-line-done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Server error */}
      {serverErr && (
        <div className="alert-banner alert-danger mb-5 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverErr}</span>
        </div>
      )}

      {/* ── Step 0 ── */}
      {step === 0 && (
        <form onSubmit={emailForm.handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Email address" type="email" placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={emailForm.touched.email && emailForm.errors.email}
            {...emailForm.getFieldProps('email')}
          />
          <Button type="submit" fullWidth loading={emailForm.isSubmitting}
            rightIcon={<ChevronRight className="w-4 h-4" />} size="lg">
            Send OTP
          </Button>
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Login
          </Link>
        </form>
      )}

      {/* ── Step 1 – OTP ── */}
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500 text-center">
            Sent to <span className="text-slate-300 font-medium">{email}</span>
            <br/><span className="text-indigo-400 text-xs">Demo OTP: 123456</span>
          </p>

          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[i] && i > 0)
                    document.getElementById(`otp-${i - 1}`)?.focus();
                }}
                className="w-11 h-14 text-center text-xl font-bold font-display input-base rounded-xl"
                style={{ padding: 0 }}
              />
            ))}
          </div>

          <Button fullWidth loading={otpLoading} onClick={verifyOtpHandler} size="lg"
            leftIcon={<KeyRound className="w-4 h-4" />}>
            Verify OTP
          </Button>
          <button onClick={() => setStep(0)} className="w-full text-sm text-slate-600 hover:text-slate-400 transition-colors text-center">
            ← Change email
          </button>
        </div>
      )}

      {/* ── Step 2 – New password ── */}
      {step === 2 && (
        <form onSubmit={resetForm.handleSubmit} className="space-y-4" noValidate>
          <div>
            <PasswordInput
              label="New Password" placeholder="Min 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              error={resetForm.touched.password && resetForm.errors.password}
              {...resetForm.getFieldProps('password')}
            />
            <PasswordStrengthBar password={resetForm.values.password} />
          </div>
          <PasswordInput
            label="Confirm Password" placeholder="Re-enter password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={resetForm.touched.confirm_password && resetForm.errors.confirm_password}
            {...resetForm.getFieldProps('confirm_password')}
          />
          <Button type="submit" fullWidth size="lg" loading={resetForm.isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4" />} variant="success">
            Reset Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default PasswordResetPage;
