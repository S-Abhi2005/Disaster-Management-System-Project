import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User, Phone, MapPin, Building2, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { updateVolunteerProfile } from '../../api/volunteerService';
import { SKILLS, AVAILABILITY_OPTIONS, VEHICLE_TYPES } from '../../api/volunteerService';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getInitials } from '../../utils/helpers';

const VolunteerProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      first_name:       user?.first_name || '',
      last_name:        user?.last_name  || '',
      phone_number:     user?.phone_number || '',
      city:             user?.city  || '',
      skill:            user?.skill || '',
      experience_years: user?.experience_years || 0,
      availability:     user?.availability || '',
      vehicle:          user?.vehicle ?? false,
      vehicle_type:     user?.vehicle_type || '',
      organization:     user?.organization || '',
    },
    validationSchema: Yup.object({
      first_name:       Yup.string().required('Required'),
      last_name:        Yup.string().required('Required'),
      phone_number:     Yup.string().matches(/^[6-9]\d{9}$/, 'Invalid phone').required(),
      city:             Yup.string().required('Required'),
      skill:            Yup.string().oneOf(SKILLS).required('Required'),
      experience_years: Yup.number().min(0).required('Required'),
      availability:     Yup.string().oneOf(AVAILABILITY_OPTIONS).required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const updated = await updateVolunteerProfile(user?.id, values);
        updateUser(values);
        toast.success('Profile updated!');
        setEditing(false);
      } catch { toast.error('Update failed.'); }
      finally { setSubmitting(false); }
    },
    enableReinitialize: true,
  });

  const fld = (n) => ({ ...formik.getFieldProps(n), error: formik.touched[n] && formik.errors[n] });
  const initials = getInitials(user?.first_name, user?.last_name);

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Volunteer profile & skills</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-4 h-4" />} onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leftIcon={<X className="w-4 h-4" />}
                onClick={() => { setEditing(false); formik.resetForm(); }}>
                Cancel
              </Button>
              <Button variant="success" size="sm" leftIcon={<Save className="w-4 h-4" />}
                loading={formik.isSubmitting} onClick={formik.handleSubmit}>
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div className="flex items-start gap-4" style={{ marginBottom: '2rem' }}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl font-display">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">{user?.first_name} {user?.last_name}</h2>
              <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-3" style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-success">Volunteer</span>
                {user?.rating && <span className="text-xs text-yellow-400">No rating yet</span>}
                <span className="text-xs text-slate-500">{user?.assignments_completed ?? 0} completed</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <Input label="First Name" required disabled={!editing} {...fld('first_name')} />
              <Input label="Last Name"  required disabled={!editing} {...fld('last_name')} />
            </div>
            <Input label="Phone" type="tel" disabled={!editing} leftIcon={<Phone className="w-4 h-4" style={{ flexShrink: 0 }} />} {...fld('phone_number')} />
            <Input label="City"  disabled={!editing} leftIcon={<MapPin className="w-4 h-4" style={{ flexShrink: 0 }} />} {...fld('city')} />
          </div>
        </div>

        {/* Skills Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 className="text-base font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Skills & Availability</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Select label="Primary Skill" required disabled={!editing} {...fld('skill')}>
              {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Years of Experience" type="number" disabled={!editing} {...fld('experience_years')} />
            <Select label="Availability" required disabled={!editing} {...fld('availability')}>
              {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
        </div>

        {/* Vehicle Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 className="text-base font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Vehicle & Organization</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {editing ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <span className="text-sm text-slate-300 font-medium">Have a vehicle?</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formik.values.vehicle}
                      onChange={(e) => { formik.setFieldValue('vehicle', e.target.checked); if (!e.target.checked) formik.setFieldValue('vehicle_type', ''); }} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {formik.values.vehicle && (
                  <Select label="Vehicle Type" {...fld('vehicle_type')}>
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </Select>
                )}
              </>
            ) : (
              <div className="text-sm text-slate-300">
                {user?.vehicle ? `Yes - ${user?.vehicle_type}` : 'No vehicle'}
              </div>
            )}
            <Input label="Organization (optional)" disabled={!editing}
              leftIcon={<Building2 className="w-4 h-4" />} {...fld('organization')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;
