import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, MapPin, Globe, Heart, Car,
  Building2, AlertCircle, ChevronRight, ChevronLeft, Check,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { registerCitizen, registerVolunteer, getMockGpsLocation } from '../../api/authService';
import { SKILLS, AVAILABILITY_OPTIONS, VEHICLE_TYPES } from '../../api/volunteerService';
import useAuthStore from '../../store/authStore';
import { getRolePath, getPasswordStrength, strengthLabel, strengthColor } from '../../utils/helpers';
import Input, { PasswordInput } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Other'];

const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
    <div>
      <p className="text-sm font-medium text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <label className="toggle-switch ml-4">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  </div>
);

const PasswordStrengthBar = ({ password }) => {
  const score = getPasswordStrength(password);
  return password ? (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
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

const StepIndicator = ({ steps, current }) => (
  <div className="flex items-center mb-8">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className={`step-dot ${i < current ? 'step-dot-done' : i === current ? 'step-dot-active' : 'step-dot-inactive'}`}>
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          <span className={`text-[10px] font-semibold whitespace-nowrap ${i === current ? 'text-indigo-300' : i < current ? 'text-green-400' : 'text-slate-600'}`}>
            {step}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={`step-line mx-2 ${i < current ? 'step-line-done' : ''}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ── Register Page ───────────────────────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState(null);   // 'citizen' | 'volunteer'
  const [step, setStep] = useState(0);      // 0 = role select
  const [gpsLoading, setGpsLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');

  /* ── Common schema ─────────────────────────────────────────────────────────── */
  const commonShape = {
    first_name: Yup.string().required('First name is required').min(2),
    last_name: Yup.string().required('Last name is required').min(2),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone_number: Yup.string().matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile').required('Phone is required'),
    password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  };

  const citizenSchema = Yup.object({
    ...commonShape,
    address: Yup.string().required('Address is required'),
    city: Yup.string().required('City is required'),
    age: Yup.number().min(0).max(120).required('Age is required').typeError('Must be a number'),
    emergency_contact_name: Yup.string().required('Emergency contact name is required'),
    emergency_contact_phone: Yup.string()
      .matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile')
      .required('Emergency contact phone is required')
      .test('not-same', 'Must differ from your phone', function (val) {
        return val !== this.parent.phone_number;
      }),
    preferred_language: Yup.string().required('Language is required'),
  });

  const volunteerSchema = Yup.object({
    ...commonShape,
    city: Yup.string().required('City is required'),
    skill: Yup.string().oneOf(SKILLS).required('Skill is required'),
    experience_years: Yup.number().min(0, 'Cannot be negative').required('Required').typeError('Must be a number'),
    availability: Yup.string().oneOf(AVAILABILITY_OPTIONS).required('Availability is required'),
    vehicle_type: Yup.string().when('vehicle', {
      is: true,
      then: (s) => s.oneOf(VEHICLE_TYPES).required('Vehicle type is required'),
      otherwise: (s) => s.nullable(),
    }),
  });

  const citizenInitial = {
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', confirm_password: '',
    address: '', city: '', age: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    preferred_language: 'English',
    allow_gps_location: false,
    latitude: '', longitude: '',
  };

  const volunteerInitial = {
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', confirm_password: '',
    city: '', skill: '', experience_years: '',
    availability: '', vehicle: false, vehicle_type: '',
    organization: '',
  };

  const formik = useFormik({
    initialValues: role === 'citizen' ? citizenInitial : volunteerInitial,
    validationSchema: role === 'citizen' ? citizenSchema : volunteerSchema,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      setServerErr('');
      try {
        const payload = { ...values };
        if (role === 'volunteer') {
          payload.vehicle_type = payload.vehicle ? payload.vehicle_type : null;
          payload.experience_years = Number(payload.experience_years);
        }
        if (role === 'citizen') {
          payload.age = Number(payload.age);
        }
        const data = role === 'citizen'
          ? await registerCitizen(payload)
          : await registerVolunteer(payload);
        setAuth(data);
        toast.success('Account created! Welcome aboard 🎉');
        navigate(getRolePath(data.role), { replace: true });
      } catch (err) {
        const msg = err?.response?.data?.message || 'Registration failed.';
        setServerErr(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  /* ── Validate step before advancing ─────────────────────────────────────────── */
  const CITIZEN_STEP_FIELDS = [
    ['first_name', 'last_name', 'email', 'phone_number'],
    ['password', 'confirm_password'],
    ['address', 'city', 'age', 'emergency_contact_name', 'emergency_contact_phone', 'preferred_language'],
  ];
  const VOLUNTEER_STEP_FIELDS = [
    ['first_name', 'last_name', 'email', 'phone_number'],
    ['password', 'confirm_password'],
    ['city', 'skill', 'experience_years', 'availability'],
  ];

  const validateStep = async () => {
    const fields = role === 'citizen' ? CITIZEN_STEP_FIELDS[step - 1] : VOLUNTEER_STEP_FIELDS[step - 1];
    if (!fields) return true;
    const errors = await formik.validateForm();
    const hasStepErrors = fields.some((f) => errors[f]);
    if (hasStepErrors) {
      fields.forEach((f) => formik.setFieldTouched(f, true));
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    if (await validateStep()) setStep((s) => s + 1);
  };

  const handleGps = async () => {
    setGpsLoading(true);
    try {
      const loc = await getMockGpsLocation();
      formik.setFieldValue('latitude', loc.latitude.toFixed(6));
      formik.setFieldValue('longitude', loc.longitude.toFixed(6));
      formik.setFieldValue('address', loc.address);
      toast.success('Location fetched!');
    } catch {
      toast.error('GPS unavailable.');
    } finally {
      setGpsLoading(false);
    }
  };

  const fld = (name) => ({
    ...formik.getFieldProps(name),
    error: formik.touched[name] && formik.errors[name],
  });

  /* ── Role selection ── */
  if (!role) {
    return (
      <AuthLayout title="Create account" subtitle="Choose your role to get started">
        <div className="space-y-3 mb-8">
          {[
            {
              key: 'citizen',
              icon: '🏠',
              label: 'Citizen',
              desc: 'Report incidents, get alerts, stay safe',
              gradient: 'from-blue-500/10 to-blue-600/5',
              border: 'border-blue-500/20',
              hover: 'hover:border-blue-400/40 hover:from-blue-500/15',
              text: 'text-blue-300',
            },
            {
              key: 'volunteer',
              icon: '🦺',
              label: 'Volunteer',
              desc: 'Contribute skills, respond to incidents',
              gradient: 'from-green-500/10 to-green-600/5',
              border: 'border-green-500/20',
              hover: 'hover:border-green-400/40 hover:from-green-500/15',
              text: 'text-green-300',
            },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => { setRole(r.key); setStep(1); }}
              className={`w-full flex items-center p-5 rounded-2xl border bg-gradient-to-br ${r.gradient} ${r.border} ${r.hover} transition-all duration-200 text-left group cursor-pointer`}
            >
              <span className="text-3xl shrink-0">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-bold font-display ${r.text}`}>{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Sign in</Link>
        </p>
      </AuthLayout>
    );
  }

  const STEPS = role === 'citizen'
    ? ['Personal', 'Security', 'Details', 'Review']
    : ['Personal', 'Security', 'Skills', 'Review'];

  /* ── Step forms ── */
  const renderStep = () => {
    /* Step 1 – Personal info (both roles) */
    if (step === 1) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
          <Input label="First Name" placeholder="Arjun" required {...fld('first_name')} />
          <Input label="Last Name" placeholder="Sharma" required {...fld('last_name')} />
        </div>
        <Input label="Email" type="email" placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />} required {...fld('email')} />
        <Input label="Phone Number" type="tel" placeholder="9876543210"
          leftIcon={<Phone className="w-4 h-4" />}
          hint="10-digit Indian mobile number" required {...fld('phone_number')} />
      </div>
    );

    /* Step 2 – Password (both roles) */
    if (step === 2) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <PasswordInput label="Password" placeholder="Min 8 characters" required
            leftIcon={<Lock className="w-4 h-4" />} {...fld('password')} />
          <PasswordStrengthBar password={formik.values.password} />
        </div>
        <PasswordInput label="Confirm Password" placeholder="Re-enter password" required
          leftIcon={<Lock className="w-4 h-4" />} {...fld('confirm_password')} />
      </div>
    );

    /* Step 3 – Citizen details */
    if (step === 3 && role === 'citizen') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Age" type="number" placeholder="25" required {...fld('age')} />
        <Input label="City" placeholder="Mumbai" leftIcon={<MapPin className="w-4 h-4" />} required {...fld('city')} />

        <ToggleSwitch
          checked={formik.values.allow_gps_location}
          onChange={(val) => {
            formik.setFieldValue('allow_gps_location', val);
            if (val) handleGps();
          }}
          label="Enable GPS Location"
          description="Auto-fetch your current location"
        />

        {formik.values.allow_gps_location ? (
          <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
            <Input label="Latitude" placeholder="Auto-fetched" readOnly={gpsLoading} {...fld('latitude')} />
            <Input label="Longitude" placeholder="Auto-fetched" readOnly={gpsLoading} {...fld('longitude')} />
          </div>
        ) : (
          <Input label="Address" placeholder="12 MG Road, Mumbai"
            leftIcon={<MapPin className="w-4 h-4" />} required {...fld('address')} />
        )}

        <Input label="Emergency Contact Name"
          leftIcon={<Heart className="w-4 h-4" />} placeholder="Priya Sharma" required
          {...fld('emergency_contact_name')} />
        <Input label="Emergency Contact Phone" type="tel" placeholder="9876543211"
          hint="Must be a different number" required {...fld('emergency_contact_phone')} />

        <Select label="Preferred Language" required {...fld('preferred_language')}
          placeholder="Select language">
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
      </div>
    );

    /* Step 3 – Volunteer skills */
    if (step === 3 && role === 'volunteer') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="City" placeholder="Mumbai" leftIcon={<MapPin className="w-4 h-4" />} required {...fld('city')} />

        <Select label="Primary Skill" required {...fld('skill')} placeholder="Select skill">
          {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>

        <Input label="Years of Experience" type="number" placeholder="2"
          hint="Enter 0 if you're a fresher" required {...fld('experience_years')} />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Availability <span className="text-red-400">*</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <label key={opt} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${formik.values.availability === opt ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]'}`}>
                <input type="radio" name="availability" value={opt}
                  checked={formik.values.availability === opt}
                  onChange={() => formik.setFieldValue('availability', opt)}
                  className="accent-indigo-500" />
                <span className="text-sm text-slate-200 font-medium">{opt}</span>
              </label>
            ))}
          </div>
          {formik.touched.availability && formik.errors.availability && (
            <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{formik.errors.availability}</p>
          )}
        </div>

        <ToggleSwitch
          checked={formik.values.vehicle}
          onChange={(val) => { formik.setFieldValue('vehicle', val); if (!val) formik.setFieldValue('vehicle_type', ''); }}
          label="Do you have a vehicle?"
          description="For rapid deployment to incidents"
        />

        {formik.values.vehicle && (
          <Select label="Vehicle Type" required {...fld('vehicle_type')} placeholder="Select type">
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        )}

        <Input label="Organization (optional)" placeholder="e.g. RedCross, NGO name"
          leftIcon={<Building2 className="w-4 h-4" />} {...fld('organization')} />
      </div>
    );

    /* Step 4 – Review */
    if (step === 4) {
      const v = formik.values;
      const reviewFields = role === 'citizen'
        ? [
          { label: 'Name', value: `${v.first_name} ${v.last_name}` },
          { label: 'Email', value: v.email },
          { label: 'Phone', value: v.phone_number },
          { label: 'Age', value: v.age },
          { label: 'City', value: v.city },
          { label: 'Language', value: v.preferred_language },
          { label: 'GPS', value: v.allow_gps_location ? 'Enabled' : 'Disabled' },
          { label: 'Emergency Contact', value: `${v.emergency_contact_name} · ${v.emergency_contact_phone}` },
        ]
        : [
          { label: 'Name', value: `${v.first_name} ${v.last_name}` },
          { label: 'Email', value: v.email },
          { label: 'Phone', value: v.phone_number },
          { label: 'City', value: v.city },
          { label: 'Skill', value: v.skill },
          { label: 'Experience', value: `${v.experience_years} year(s)` },
          { label: 'Availability', value: v.availability },
          { label: 'Vehicle', value: v.vehicle ? `Yes — ${v.vehicle_type}` : 'No' },
          { label: 'Organization', value: v.organization || '—' },
        ];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card card-sm">
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <span className="text-2xl">{role === 'citizen' ? '🏠' : '🦺'}</span>
              <div>
                <p className="text-sm font-bold text-white font-display">
                  {role === 'citizen' ? 'Citizen' : 'Volunteer'} Account
                </p>
                <p className="text-xs text-slate-500">Review your details before submitting</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {reviewFields.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0" style={{ gap: '1rem' }}>
                  <span className="text-xs text-slate-500 shrink-0">{label}</span>
                  <span className="text-xs font-medium text-slate-200 text-right truncate">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          {serverErr && (
            <div className="alert-banner alert-danger animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverErr}</span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <AuthLayout
      title={step === 0 ? 'Create account' : `${role === 'citizen' ? '🏠 Citizen' : '🦺 Volunteer'} Registration`}
      subtitle={step === 0 ? 'Join DisasterShield today' : STEPS[step - 1]}
    >
      <StepIndicator steps={STEPS} current={step - 1} />

      {renderStep()}

      {/* ── Navigation buttons ── */}
      <div className={`${step > 1 ? 'justify-between' : 'justify-end'}`} style={{ gap: '0.75rem', marginTop: '1.5rem' }}>
        {step > 1 && (
          <Button variant="secondary" leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => setStep((s) => s - 1)} type="button">
            Back
          </Button>
        )}
        {step < STEPS.length ? (
          <Button variant="primary" rightIcon={<ChevronRight className="w-4 h-4" />}
            onClick={nextStep} type="button">
            Continue
          </Button>
        ) : (
          <Button variant="success" leftIcon={<Check className="w-4 h-4" />}
            loading={formik.isSubmitting} onClick={formik.handleSubmit} type="button">
            Create Account
          </Button>
        )}
      </div>

      {/* ── Login link ── */}
      {step === 1 && (
        <p className="text-center text-sm text-slate-500 mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300">Sign in</Link>
        </p>
      )}
    </AuthLayout>
  );
};

export default RegisterPage;
