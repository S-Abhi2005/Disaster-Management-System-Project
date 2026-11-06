import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Lock, MapPin, Heart, Building2,
  AlertCircle, ChevronRight, ChevronLeft, Check, X, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { registerCitizen, registerVolunteer, getMockGpsLocation } from '../../api/authService';
import { SKILLS, AVAILABILITY_OPTIONS, VEHICLE_TYPES } from '../../api/volunteerService';
import useAuthStore from '../../store/authStore';
import { getRolePath, getPasswordStrength, strengthLabel, strengthColor } from '../../utils/helpers';
import Input, { PasswordInput } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Other'];

const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
    <div>
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{label}</p>
      {description && <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: '0.125rem 0 0' }}>{description}</p>}
    </div>
    <label className="toggle-switch" style={{ marginLeft: '0.75rem' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  </div>
);

const PasswordStrengthBar = ({ password }) => {
  const score = getPasswordStrength(password);
  return password ? (
    <div style={{ marginTop: '0.375rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '3px', flex: 1, borderRadius: '2px', transition: 'all 0.3s', background: i <= score ? strengthColor(score) : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <p style={{ fontSize: '0.625rem', fontWeight: 600, color: strengthColor(score), margin: 0 }}>
        {strengthLabel(score)}
      </p>
    </div>
  ) : null;
};

const MiniStepIndicator = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '1.25rem' }}>
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div style={{
          width: i === current ? 28 : 24, height: i === current ? 28 : 24,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.625rem', fontWeight: 800, fontFamily: 'var(--font-display)',
          transition: 'all 0.3s ease',
          background: i < current ? 'linear-gradient(135deg,#22c55e,#16a34a)' : i === current ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'rgba(255,255,255,0.05)',
          color: i <= current ? '#fff' : '#475569',
          border: i === current ? '2px solid rgba(99,102,241,0.4)' : i < current ? '2px solid rgba(34,197,94,0.3)' : '2px solid rgba(255,255,255,0.06)',
          boxShadow: i === current ? '0 0 16px rgba(99,102,241,0.3)' : 'none',
        }}>
          {i < current ? <Check style={{ width: 12, height: 12 }} /> : i + 1}
        </div>
        {i < steps.length - 1 && (
          <div style={{ width: 20, height: 2, borderRadius: 1, background: i < current ? '#22c55e' : 'rgba(255,255,255,0.06)', transition: 'all 0.3s' }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState(null);
  const [step, setStep] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
      setRole(null);
      setStep(0);
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

  const commonShape = {
    first_name: Yup.string().required('First name is required').min(2),
    last_name: Yup.string().required('Last name is required').min(2),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone_number: Yup.string().matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile').required('Phone is required'),
    password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
    confirm_password: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Please confirm'),
  };

  const citizenSchema = Yup.object({
    ...commonShape,
    address: Yup.string().required('Address is required'),
    city: Yup.string().required('City is required'),
    age: Yup.number().min(0).max(120).required('Age is required').typeError('Must be a number'),
    emergency_contact_name: Yup.string().required('Emergency contact name is required'),
    emergency_contact_phone: Yup.string().matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile').required('Emergency contact phone is required')
      .test('not-same', 'Must differ from your phone', function (val) { return val !== this.parent.phone_number; }),
    preferred_language: Yup.string().required('Language is required'),
  });

  const volunteerSchema = Yup.object({
    ...commonShape,
    city: Yup.string().required('City is required'),
    skill: Yup.string().oneOf(SKILLS).required('Skill is required'),
    experience_years: Yup.number().min(0).required('Required').typeError('Must be a number'),
    availability: Yup.string().oneOf(AVAILABILITY_OPTIONS).required('Availability is required'),
    vehicle_type: Yup.string().when('vehicle', { is: true, then: (s) => s.oneOf(VEHICLE_TYPES).required('Vehicle type is required'), otherwise: (s) => s.nullable() }),
  });

  const citizenInitial = {
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', confirm_password: '',
    address: '', city: '', age: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    preferred_language: 'English',
    allow_gps_location: false, latitude: '', longitude: '',
  };

  const volunteerInitial = {
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', confirm_password: '',
    city: '', skill: '', experience_years: '',
    availability: '', vehicle: false, vehicle_type: '', organization: '',
  };

  const formik = useFormik({
    initialValues: role === 'citizen' ? citizenInitial : volunteerInitial,
    validationSchema: role === 'citizen' ? citizenSchema : volunteerSchema,
    enableReinitialize: true, validateOnChange: false, validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      setServerErr('');
      try {
        const payload = { ...values };
        if (role === 'volunteer') { payload.vehicle_type = payload.vehicle ? payload.vehicle_type : null; payload.experience_years = Number(payload.experience_years); }
        if (role === 'citizen') { payload.age = Number(payload.age); }
        const data = role === 'citizen' ? await registerCitizen(payload) : await registerVolunteer(payload);
        setAuth(data);
        toast.success('Account created! Welcome aboard 🎉');
        handleClose();
        navigate(getRolePath(data.role), { replace: true });
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Registration failed.';
        setServerErr(msg);
        toast.error(msg);
      } finally { setSubmitting(false); }
    },
  });

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
    if (hasStepErrors) { fields.forEach((f) => formik.setFieldTouched(f, true)); return false; }
    return true;
  };

  const nextStep = async () => { if (await validateStep()) setStep((s) => s + 1); };

  const handleGps = async () => {
    setGpsLoading(true);
    try {
      const loc = await getMockGpsLocation();
      formik.setFieldValue('latitude', loc.latitude.toFixed(6));
      formik.setFieldValue('longitude', loc.longitude.toFixed(6));
      formik.setFieldValue('address', loc.address);
      toast.success('Location fetched!');
    } catch { toast.error('GPS unavailable.'); }
    finally { setGpsLoading(false); }
  };

  const fld = (name) => ({ ...formik.getFieldProps(name), error: formik.touched[name] && formik.errors[name] });

  const STEPS = role === 'citizen'
    ? ['Personal', 'Security', 'Details', 'Review']
    : ['Personal', 'Security', 'Skills', 'Review'];

  if (!isOpen) return null;

  const renderStep = () => {
    if (step === 1) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          <Input label="First Name" placeholder="Arjun" required {...fld('first_name')} />
          <Input label="Last Name" placeholder="Sharma" required {...fld('last_name')} />
        </div>
        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={<Mail className="w-4 h-4" />} required {...fld('email')} />
        <Input label="Phone" type="tel" placeholder="9876543210" leftIcon={<Phone className="w-4 h-4" />} required {...fld('phone_number')} />
      </div>
    );
    if (step === 2) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <PasswordInput label="Password" placeholder="Min 8 characters" required leftIcon={<Lock className="w-4 h-4" />} {...fld('password')} />
          <PasswordStrengthBar password={formik.values.password} />
        </div>
        <PasswordInput label="Confirm Password" placeholder="Re-enter password" required leftIcon={<Lock className="w-4 h-4" />} {...fld('confirm_password')} />
      </div>
    );
    if (step === 3 && role === 'citizen') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          <Input label="Age" type="number" placeholder="25" required {...fld('age')} />
          <Input label="City" placeholder="Mumbai" required {...fld('city')} />
        </div>
        <ToggleSwitch checked={formik.values.allow_gps_location}
          onChange={(val) => { formik.setFieldValue('allow_gps_location', val); if (val) handleGps(); }}
          label="Enable GPS Location" description="Auto-fetch your location" />
        {formik.values.allow_gps_location ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            <Input label="Latitude" placeholder="Auto" readOnly={gpsLoading} {...fld('latitude')} />
            <Input label="Longitude" placeholder="Auto" readOnly={gpsLoading} {...fld('longitude')} />
          </div>
        ) : (
          <Input label="Address" placeholder="12 MG Road, Mumbai" leftIcon={<MapPin className="w-4 h-4" />} required {...fld('address')} />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          <Input label="Emergency Name" leftIcon={<Heart className="w-4 h-4" />} placeholder="Priya" required {...fld('emergency_contact_name')} />
          <Input label="Emergency Phone" type="tel" placeholder="9876543211" required {...fld('emergency_contact_phone')} />
        </div>
        <Select label="Language" required {...fld('preferred_language')} placeholder="Select">
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
      </div>
    );
    if (step === 3 && role === 'volunteer') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Input label="City" placeholder="Mumbai" leftIcon={<MapPin className="w-4 h-4" />} required {...fld('city')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          <Select label="Skill" required {...fld('skill')} placeholder="Select">
            {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Experience (yrs)" type="number" placeholder="2" required {...fld('experience_years')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e2e8f0' }}>Availability <span style={{ color: '#f87171' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.625rem', borderRadius: '0.625rem', cursor: 'pointer',
                transition: 'all 0.2s',
                border: formik.values.availability === opt ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                background: formik.values.availability === opt ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
              }}>
                <input type="radio" name="availability" value={opt}
                  checked={formik.values.availability === opt}
                  onChange={() => formik.setFieldValue('availability', opt)}
                  className="accent-indigo-500" style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#e2e8f0' }}>{opt}</span>
              </label>
            ))}
          </div>
          {formik.touched.availability && formik.errors.availability && (
            <p style={{ fontSize: '0.6875rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
              <AlertCircle style={{ width: 12, height: 12 }} />{formik.errors.availability}
            </p>
          )}
        </div>
        <ToggleSwitch checked={formik.values.vehicle}
          onChange={(val) => { formik.setFieldValue('vehicle', val); if (!val) formik.setFieldValue('vehicle_type', ''); }}
          label="Have a vehicle?" description="For rapid deployment" />
        {formik.values.vehicle && (
          <Select label="Vehicle Type" required {...fld('vehicle_type')} placeholder="Select">
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        )}
        <Input label="Organization (optional)" placeholder="RedCross, NGO" leftIcon={<Building2 className="w-4 h-4" />} {...fld('organization')} />
      </div>
    );
    if (step === 4) {
      const v = formik.values;
      const fields = role === 'citizen'
        ? [{ l: 'Name', v: `${v.first_name} ${v.last_name}` }, { l: 'Email', v: v.email }, { l: 'Phone', v: v.phone_number }, { l: 'Age', v: v.age }, { l: 'City', v: v.city }, { l: 'Language', v: v.preferred_language }, { l: 'Emergency', v: `${v.emergency_contact_name} · ${v.emergency_contact_phone}` }]
        : [{ l: 'Name', v: `${v.first_name} ${v.last_name}` }, { l: 'Email', v: v.email }, { l: 'Phone', v: v.phone_number }, { l: 'City', v: v.city }, { l: 'Skill', v: v.skill }, { l: 'Experience', v: `${v.experience_years}yr` }, { l: 'Availability', v: v.availability }, { l: 'Vehicle', v: v.vehicle ? `${v.vehicle_type}` : 'No' }];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.875rem', borderRadius: '0.875rem', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{role === 'citizen' ? '🏠' : '🦺'}</span>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)', margin: 0 }}>{role === 'citizen' ? 'Citizen' : 'Volunteer'} Account</p>
                <p style={{ fontSize: '0.625rem', color: '#64748b', margin: 0 }}>Review your details</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {fields.map(({ l, v }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{l}</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#e2e8f0', textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          {serverErr && (
            <div className="alert-banner alert-danger animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{serverErr}</span>
            </div>
          )}
        </div>
      );
    }
  };

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
          width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto',
          background: 'linear-gradient(160deg, rgba(15,23,42,0.88) 0%, rgba(5,10,24,0.9) 100%)',
          backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.75rem', padding: '2rem',
          position: 'relative', overflowX: 'hidden', overflowY: 'auto',
          boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 25px 80px rgba(0,0,0,0.7), 0 0 120px rgba(99,102,241,0.08)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="modal-scrollbar"
      >
        {/* Top line */}
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.5), rgba(6,182,212,0.4), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 65%)', pointerEvents: 'none' }} />

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
        <div style={{ textAlign: 'center', marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 48, height: 48, borderRadius: '1rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 0 30px rgba(34,197,94,0.35)' }}>
            <Shield style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', margin: 0 }}>
            {!role ? 'Create account' : `${role === 'citizen' ? '🏠' : '🦺'} ${role === 'citizen' ? 'Citizen' : 'Volunteer'} Registration`}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {!role ? 'Choose your role to get started' : STEPS[step - 1]}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Role selection */}
          {!role ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { key: 'citizen', icon: '🏠', label: 'Citizen', desc: 'Report incidents, get alerts, stay safe', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
                { key: 'volunteer', icon: '🦺', label: 'Volunteer', desc: 'Contribute skills, respond to incidents', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
              ].map((r) => (
                <button key={r.key} onClick={() => { setRole(r.key); setStep(1); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '1rem 1.25rem', borderRadius: '1rem', border: `1px solid ${r.border}`,
                    background: r.bg, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: r.color, fontFamily: 'var(--font-display)', fontSize: '0.9375rem', margin: 0 }}>{r.label}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0' }}>{r.desc}</p>
                  </div>
                  <ChevronRight style={{ width: 18, height: 18, color: '#475569', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          ) : (
            <>
              <MiniStepIndicator steps={STEPS} current={step - 1} />
              {renderStep()}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: step > 1 ? 'space-between' : 'flex-end', gap: '0.625rem', marginTop: '1.25rem' }}>
                {step > 1 && (
                  <Button variant="secondary" leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setStep((s) => s - 1)} type="button">Back</Button>
                )}
                {step < STEPS.length ? (
                  <Button variant="primary" rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={nextStep} type="button">Continue</Button>
                ) : (
                  <Button variant="success" leftIcon={<Check className="w-4 h-4" />}
                    loading={formik.isSubmitting} onClick={formik.handleSubmit} type="button">
                    Create Account
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#64748b', marginTop: '1rem' }}>
            Already have an account?{' '}
            <span onClick={() => { handleClose(); setTimeout(onSwitchToLogin, 350); }}
              style={{ color: '#818cf8', fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = '#a5b4fc'}
              onMouseLeave={e => e.target.style.color = '#818cf8'}>
              Sign in →
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
