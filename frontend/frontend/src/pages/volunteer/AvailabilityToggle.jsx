import React, { useState } from 'react';
import {
  Zap, Clock, AlertTriangle, Calendar, CheckCircle,
  Activity, MapPin, Info,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { updateAvailability } from '../../api/volunteerService';
import { AVAILABILITY_OPTIONS } from '../../api/volunteerService';
import Button from '../../components/ui/Button';

const AVAIL_CONFIG = {
  'Available Anytime': {
    icon: CheckCircle,
    color: '#4ade80',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
    desc: 'You can be deployed at any time — day or night.',
    badge: 'badge-success',
  },
  'Weekends Only': {
    icon: Calendar,
    color: '#facc15',
    bg: 'rgba(234,179,8,0.1)',
    border: 'rgba(234,179,8,0.25)',
    desc: 'Available for assignments on Saturdays and Sundays only.',
    badge: 'badge-warning',
  },
  'Emergency Only': {
    icon: AlertTriangle,
    color: '#f87171',
    bg: 'rgba(244,63,94,0.1)',
    border: 'rgba(244,63,94,0.25)',
    desc: 'Only available for critical/emergency incidents.',
    badge: 'badge-danger',
  },
};

const StatusCard = ({ active, label, count, color }) => (
  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white font-display">{count}</p>
  </div>
);

const AvailabilityToggle = () => {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();

  const isOnline        = user?.is_available ?? true;
  const currentSchedule = user?.availability || 'Available Anytime';
  const [schedule, setSchedule] = useState(currentSchedule);

  /* ── Toggle online/offline ── */
  const toggleMutation = useMutation({
    mutationFn: (newVal) => updateAvailability(user?.id, newVal),
    onSuccess: (_, newVal) => {
      updateUser({ is_available: newVal });
      qc.invalidateQueries({ queryKey: ['volunteers'] });
      toast.success(newVal ? '🟢 You are now Available' : '🔴 You are now Unavailable');
    },
    onError: () => toast.error('Could not update. Try again.'),
  });

  /* ── Save schedule ── */
  const saveMutation = useMutation({
    mutationFn: async (sched) => {
      await new Promise((r) => setTimeout(r, 600));
      return sched;
    },
    onSuccess: (sched) => {
      updateUser({ availability: sched });
      toast.success('Availability schedule updated!');
    },
  });

  const cfg = AVAIL_CONFIG[schedule] || AVAIL_CONFIG['Available Anytime'];
  const CfgIcon = cfg.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Availability</h1>
        <p className="text-slate-500 text-sm mt-1">
          Control when you're reachable for incident deployment
        </p>
      </div>

      {/* Main toggle card */}
      <div
        className="card relative overflow-hidden"
        style={{
          borderColor: isOnline ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.2)',
          background:  isOnline ? 'rgba(34,197,94,0.04)' : 'rgba(15,23,42,0.5)',
        }}
      >
        {/* Top glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: isOnline
              ? 'radial-gradient(ellipse at 30% 0%, rgba(34,197,94,0.2), transparent 60%)'
              : 'none',
          }}
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
              <span
                className="w-3.5 h-3.5 rounded-full transition-all duration-300"
                style={{
                  background: isOnline ? '#4ade80' : '#475569',
                  boxShadow: isOnline ? '0 0 0 4px rgba(74,222,128,0.2)' : 'none',
                  animation:  isOnline ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              />
              <h2 className="text-xl font-bold text-white font-display">
                {isOnline ? 'You are Available' : 'You are Unavailable'}
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              {isOnline
                ? 'Responders can assign incidents to you. You will receive assignment notifications.'
                : 'You will not receive any new incident assignments while unavailable.'}
            </p>
          </div>

          <button
            onClick={() => toggleMutation.mutate(!isOnline)}
            disabled={toggleMutation.isPending}
            className={`relative flex items-center px-6 py-3.5 rounded-2xl font-bold text-sm font-display transition-all duration-300 shrink-0 ${
              isOnline
                ? 'text-green-300 border border-green-500/30 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
                : 'text-slate-400 border border-slate-700 hover:bg-green-500/10 hover:text-green-300 hover:border-green-500/30'
            }`}
          >
            {toggleMutation.isPending ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Activity className="w-4 h-4" />
            )}
            {isOnline ? 'Go Unavailable' : 'Go Available'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
        <StatusCard label="Completed" count={user?.assignments_completed ?? 0} color="#4ade80" />
        <StatusCard label="Experience" count={`${user?.experience_years ?? 0}y`} color="#818cf8" />
        <StatusCard label="Rating" count={user?.rating ? `${user.rating}/5` : '—'} color="#facc15" />
      </div>

      {/* Schedule selector */}
      <div className="card">
        <div className="flex items-center gap-2" style={{ marginBottom: '1.25rem' }}>
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white font-display">Availability Schedule</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {AVAILABILITY_OPTIONS.map((opt) => {
            const c    = AVAIL_CONFIG[opt];
            const Icon = c.icon;
            const sel  = schedule === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSchedule(opt)}
                className="w-full flex items-start p-4 rounded-xl border text-left transition-all duration-200"
                style={{
                  background:   sel ? c.bg : 'rgba(255,255,255,0.02)',
                  borderColor:  sel ? c.border : 'rgba(255,255,255,0.07)',
                  boxShadow:    sel ? `0 0 0 1px ${c.border}` : 'none',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: sel ? `${c.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${c.border}` }}
                >
                  <Icon className="w-5 h-5" style={{ color: sel ? c.color : '#64748b' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white font-display">{opt}</p>
                    {sel && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-all ${
                  sel ? '' : 'border-white/20'
                }`}
                  style={sel ? { borderColor: c.color, background: c.color } : {}}>
                  {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {schedule !== currentSchedule && (
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Unsaved change
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSchedule(currentSchedule)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm"
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate(schedule)}>
                Save Schedule
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="alert-banner alert-info">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold mb-0.5">How availability works</p>
          <p>When you're available, the admin can assign incidents based on your location, skills, and schedule. Going unavailable pauses new assignments — your ongoing ones remain active.</p>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityToggle;
