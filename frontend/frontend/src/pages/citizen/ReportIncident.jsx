import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  MapPin, AlertTriangle, Camera, FileText,
  ChevronRight, ChevronLeft, Check, X, Upload, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createIncident, INCIDENT_TYPES, SEVERITY_LEVELS } from '../../api/incidentService';
// Real browser geolocation API used instead of mock
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const STEPS = ['Location', 'Type & Severity', 'Details', 'Media', 'Review'];

const StepIndicator = ({ steps, current }) => (
  <div className="flex items-center mb-8 overflow-x-auto hide-scrollbar pb-2">
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={`step-dot ${i < current ? 'step-dot-done' : i === current ? 'step-dot-active' : 'step-dot-inactive'}`}>
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          <span className={`text-[10px] font-semibold whitespace-nowrap ${i === current ? 'text-indigo-300' : i < current ? 'text-green-400' : 'text-slate-600'}`}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`step-line mx-1.5 ${i < current ? 'step-line-done' : ''}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const ReportIncident = () => {
  const navigate   = useNavigate();
  const user       = useAuthStore((s) => s.user);
  const [step, setStep]         = useState(0);
  const [gpsLoading, setGPSLoading] = useState(false);
  const [images, setImages]     = useState([]);   // { file, preview }

  const validationSchema = Yup.object({
    location_address: Yup.string().required('Address is required'),
    city:             Yup.string().required('City is required'),
    type:             Yup.string().oneOf(INCIDENT_TYPES).required('Type is required'),
    severity:         Yup.string().oneOf(SEVERITY_LEVELS).required('Severity is required'),
    title:            Yup.string().min(10, 'Min 10 characters').max(120).required('Title is required'),
    description:      Yup.string().min(20, 'Min 20 characters').required('Description is required'),
  });

  const formik = useFormik({
    initialValues: {
      location_address: '',
      city:             '',
      latitude:  '',
      longitude: '',
      type:      '',
      severity:  '',
      title:     '',
      description: '',
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...values,
          location: {
            lat:     parseFloat(values.latitude)  || 19.076,
            lng:     parseFloat(values.longitude) || 72.877,
            address: values.location_address,
          },
          city:      values.city,
          images,
          reported_by: { id: user?.id, name: `${user?.first_name} ${user?.last_name}`, role: 'citizen' },
        };
        const result = await createIncident(payload);
        toast.success(`Incident ${result.id} reported successfully!`);
        navigate(`/citizen/incidents/${result.id}`);
      } catch (err) {
        toast.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to report incident.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const STEP_FIELDS = [
    ['location_address', 'city'],
    ['type', 'severity'],
    ['title', 'description'],
    [],
  ];

  const nextStep = async () => {
    const fields = STEP_FIELDS[step];
    if (fields?.length) {
      const errors = await formik.validateForm();
      const hasErr = fields.some((f) => errors[f]);
      if (hasErr) { fields.forEach((f) => formik.setFieldTouched(f, true)); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const isStepValid = () => {
    const fields = STEP_FIELDS[step];
    if (!fields?.length) return true;
    return fields.every((field) => {
      const value = formik.values[field];
      if (field === 'description') return value && value.length >= 20;
      if (field === 'title') return value && value.length >= 10;
      return value && value.trim() !== '';
    });
  };

  const canProceed = isStepValid();

  const handleGPS = async () => {
    setGPSLoading(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      setGPSLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        formik.setFieldValue('latitude', latitude.toFixed(6));
        formik.setFieldValue('longitude', longitude.toFixed(6));
        toast.success('Location fetched! Please verify the address below.');
        setGPSLoading(false);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve your location.';
        if (error.code === 1) errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
        if (error.code === 2) errorMsg = 'Location unavailable. Please try again.';
        if (error.code === 3) errorMsg = 'Location request timed out. Please try again.';
        toast.error(errorMsg);
        setGPSLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => [...prev, { file, preview: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const fld = (name) => ({
    ...formik.getFieldProps(name),
    error: formik.touched[name] && formik.errors[name],
  });

  const SEVERITY_CONFIG = {
    low:      { label: 'Low',      color: '#4ade80', desc: 'Minor inconvenience, no immediate danger' },
    medium:   { label: 'Medium',   color: '#facc15', desc: 'Moderate impact, attention needed soon' },
    high:     { label: 'High',     color: '#fb923c', desc: 'Serious situation requiring quick response' },
    critical: { label: 'Critical', color: '#f87171', desc: 'Life-threatening, immediate action needed' },
  };

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="text-2xl font-bold text-white font-display">Report Incident</h1>
        <p className="text-slate-500 text-sm mt-2">Help us respond quickly by providing accurate information</p>
      </div>

      {/* Step indicator */}
      <div style={{ marginBottom: '2.5rem' }}>
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {/* Form container */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* ── Step 0: Location ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
              <p className="text-xs text-slate-500" style={{ marginBottom: '1rem' }}>Provide the incident location as accurately as possible.</p>
              <Button type="button" variant="outline" size="sm" loading={gpsLoading}
                leftIcon={<MapPin className="w-4 h-4" />} onClick={handleGPS}
                style={{ marginBottom: '0.5rem' }}>
                {gpsLoading ? 'Fetching…' : 'Use My GPS Location'}
              </Button>
              <Input label="Location Address" placeholder="Enter the exact address"
                leftIcon={<MapPin className="w-4 h-4" />} required {...fld('location_address')} />
              <Input label="City" placeholder="Enter city name" required {...fld('city')} />
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <Input label="Latitude (optional)"  placeholder="e.g. 19.0760" {...fld('latitude')} />
                <Input label="Longitude (optional)" placeholder="e.g. 72.8777" {...fld('longitude')} />
              </div>
            </div>
          )}

        {/* Step 1: Type & Severity */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
            <Select label="Incident Type" required placeholder="Select type" {...fld('type')}>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="block text-sm font-medium text-slate-300">Severity Level <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                {SEVERITY_LEVELS.map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  const selected = formik.values.severity === sev;
                  return (
                    <button
                      key={sev} type="button"
                      onClick={() => formik.setFieldValue('severity', sev)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                      style={{
                        borderColor: selected ? cfg.color : 'rgba(255,255,255,0.07)',
                        background:  selected ? `${cfg.color}15` : 'rgba(255,255,255,0.02)',
                        boxShadow:   selected ? `0 0 0 1px ${cfg.color}40` : 'none',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                        <span className="text-sm font-bold text-white font-display">{cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{cfg.desc}</p>
                    </button>
                  );
                })}
              </div>
              {formik.touched.severity && formik.errors.severity && (
                <p className="text-xs text-red-400 mt-1">{formik.errors.severity}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
            <Input label="Incident Title" placeholder="Short, clear title (e.g. 'Severe flooding near subway')"
              required {...fld('title')}
              hint={`${formik.values.title.length}/120 characters`} />
            <Textarea label="Description" placeholder="Describe the incident in detail — what happened, how many people affected, what help is needed..."
              rows={6} required {...fld('description')}
              hint={`${formik.values.description.length} characters (min 20)`} />
            </div>
          )}

        {/* ── Step 3: Media ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
            <p className="text-xs text-slate-500">Upload up to 5 photos. Images help responders understand the situation.</p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/[0.1] rounded-2xl p-8 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/[0.03] transition-all duration-200 text-center">
              <Upload className="w-8 h-8 text-slate-600" style={{ marginBottom: '0.75rem' }} />
              <p className="text-sm font-medium text-slate-300">Click to upload images</p>
              <p className="text-xs text-slate-600 mt-1">JPG, PNG, WEBP · Max 5MB each</p>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4" style={{ gap: '0.75rem' }}>
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button"
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-600 text-center">{images.length}/5 images selected</p>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto" style={{ marginBottom: '1rem' }}>
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '0.5rem' }}>Review & Submit</h3>
              <p className="text-slate-500 text-sm">Please review all information before submitting</p>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
              <h4 className="text-sm font-bold text-white" style={{ marginBottom: '1rem' }}>Incident Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Type',        value: formik.values.type },
                  { label: 'Severity',    value: formik.values.severity },
                  { label: 'Title',       value: formik.values.title },
                  { label: 'Location',    value: formik.values.location_address },
                  { label: 'City',        value: formik.values.city },
                  { label: 'Description', value: formik.values.description?.slice(0, 100) + (formik.values.description?.length > 100 ? '…' : '') },
                  { label: 'Images',      value: `${images.length} uploaded` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex text-xs py-2 border-b border-white/[0.04] last:border-0" style={{ gap: '0.75rem' }}>
                    <span className="text-slate-500 w-24 shrink-0">{label}</span>
                    <span className="text-slate-200 font-medium">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="alert-banner alert-warning" style={{ padding: '1rem' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-xs">Ensure all information is accurate. False reports may attract penalties.</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex pt-6 border-t border-white/[0.05] ${step > 0 ? 'justify-between' : 'justify-end'}`} style={{ gap: '0.75rem', marginTop: '2rem', marginBottom: '2rem' }}>
          {step > 0 && (
            <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}
              type="button" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}
              type="button" onClick={nextStep} disabled={!canProceed}>
              Continue
            </Button>
          ) : (
            <Button variant="danger" size="sm" leftIcon={<AlertTriangle className="w-4 h-4" />}
              loading={formik.isSubmitting} type="button" onClick={formik.handleSubmit} disabled={!canProceed}>
              Submit Report
            </Button>
          )}
        </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;
