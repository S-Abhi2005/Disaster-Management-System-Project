import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { User, Mail, Phone, MapPin, Globe, Heart, Edit3, Save, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getInitials, formatPhone, formatDate } from '../../utils/helpers';

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Other'];

const CitizenProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      first_name:             user?.first_name || '',
      last_name:              user?.last_name  || '',
      phone_number:           user?.phone_number || '',
      city:                   user?.city  || '',
      address:                user?.address || '',
      age:                    user?.age || '',
      emergency_contact_name:  user?.emergency_contact_name || '',
      emergency_contact_phone: user?.emergency_contact_phone || '',
      preferred_language:     user?.preferred_language || 'English',
    },
    validationSchema: Yup.object({
      first_name:   Yup.string().required('Required'),
      last_name:    Yup.string().required('Required'),
      phone_number: Yup.string().matches(/^[6-9]\d{9}$/, 'Invalid phone').required(),
      city:         Yup.string().required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      await new Promise((r) => setTimeout(r, 600));
      updateUser(values);
      toast.success('Profile updated!');
      setEditing(false);
      setSubmitting(false);
    },
    enableReinitialize: true,
  });

  const fld = (n) => ({ ...formik.getFieldProps(n), error: formik.touched[n] && formik.errors[n] });
  const initials = getInitials(user?.first_name, user?.last_name);

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your personal information</p>
        </div>
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

      {/* Avatar + basic */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-5 pb-6 border-b border-white/[0.06]" style={{ marginBottom: '2rem' }}>
          <div className="avatar avatar-xl text-white font-display"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: '1.25rem' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="text-xl font-bold text-white font-display" style={{ marginBottom: '0.5rem' }}>{user?.first_name} {user?.last_name}</h2>
            <p className="text-slate-500 text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Mail className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-all' }}>{user?.email}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary">Citizen</span>
              <span className="text-xs text-slate-600">ID: {user?.id}</span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <Input label="First Name" required disabled={!editing} {...fld('first_name')} />
            <Input label="Last Name"  required disabled={!editing} {...fld('last_name')} />
          </div>

          <Input label="Phone Number" type="tel" disabled={!editing}
            leftIcon={<Phone className="w-4 h-4" style={{ flexShrink: 0 }} />} {...fld('phone_number')} />

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <Input label="City" disabled={!editing} leftIcon={<MapPin className="w-4 h-4" style={{ flexShrink: 0 }} />} {...fld('city')} />
            <Input label="Age"  type="number" disabled={!editing} {...fld('age')} />
          </div>

          <Input label="Address" disabled={!editing} leftIcon={<MapPin className="w-4 h-4" style={{ flexShrink: 0 }} />} {...fld('address')} />
        </div>
      </div>

      {/* Emergency contact */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
          <Heart className="w-4 h-4 text-red-400" />
          <h3 className="text-base font-bold text-white font-display">Emergency Contact</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Contact Name" disabled={!editing} leftIcon={<User className="w-4 h-4" style={{ flexShrink: 0 }} />}
            {...fld('emergency_contact_name')} />
          <Input label="Contact Phone" type="tel" disabled={!editing} leftIcon={<Phone className="w-4 h-4" style={{ flexShrink: 0 }} />}
            {...fld('emergency_contact_phone')} />
        </div>
      </div>

      {/* Preferences */}
      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white font-display">Preferences</h3>
        </div>
        <Select label="Preferred Language" disabled={!editing} {...fld('preferred_language')}>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
      </div>
    </div>
  );
};

export default CitizenProfile;
