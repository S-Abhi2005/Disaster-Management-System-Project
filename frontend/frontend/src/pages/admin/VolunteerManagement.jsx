import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, X, Users, MapPin, Zap, Eye, Star, Phone, Mail, Calendar, Briefcase, Car, Building2, Award, Clock, CheckCircle2 } from 'lucide-react';
import { getVolunteers, SKILLS } from '../../api/volunteerService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { formatDate, getInitials, formatPhone } from '../../utils/helpers';

/* ── Volunteer detail modal ────────────────────────────────────────────────── */
const VolunteerModal = ({ volunteer: v, onClose }) => (
  <Modal open onClose={onClose} title="Volunteer Profile" size="md" closable={true}>
    {/* Header with Avatar */}
    <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/[0.06]">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display text-2xl font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.25)' }}>
        {getInitials(v.first_name, v.last_name)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold text-white font-display mb-1">{v.first_name} {v.last_name}</h3>
        <p className="text-green-400 text-sm font-medium mb-2">{v.skill}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mail className="w-3.5 h-3.5" />
          <span className="truncate">{v.email}</span>
        </div>
      </div>
    </div>

    {/* Info Grid with Icons */}
    <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
      {/* Contact Info */}
      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Phone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Phone</p>
          <p className="text-sm text-slate-200 font-medium">{formatPhone(v.phone_number)}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">City</p>
          <p className="text-sm text-slate-200 font-medium">{v.city}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Briefcase className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Experience</p>
          <p className="text-sm text-slate-200 font-medium">{v.experience_years} years</p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Availability</p>
          <p className="text-sm text-slate-200 font-medium">{v.availability}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Car className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Vehicle</p>
          <p className="text-sm text-slate-200 font-medium">{v.vehicle ? v.vehicle_type : 'None'}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Organization</p>
          <p className="text-sm text-slate-200 font-medium">{v.organization || '—'}</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-green-500 uppercase tracking-wider font-semibold mb-1">Tasks Completed</p>
          <p className="text-lg font-bold text-green-400">{v.assignments_completed}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
        <Award className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-yellow-500 uppercase tracking-wider font-semibold mb-1">Rating</p>
          <p className="text-lg font-bold text-yellow-400">{v.rating ? `${v.rating}/5` : '—'}</p>
        </div>
      </div>
    </div>

    {/* Joined Date */}
    <div className="mt-8 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
      <div className="flex-1">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Joined</p>
        <p className="text-sm text-slate-300">{formatDate(v.joined_at)}</p>
      </div>
    </div>

    {/* Current Assignment */}
    {v.current_assignment && (
      <div className="mt-8 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
        <div className="w-3 h-3 rounded-full bg-orange-400 shrink-0"></div>
        <div className="flex-1">
          <p className="text-[11px] text-orange-400 uppercase tracking-wider font-semibold">Currently Assigned To</p>
          <p className="text-sm text-orange-300 font-medium">{v.current_assignment}</p>
        </div>
      </div>
    )}

    {/* Footer */}
    <div className="flex justify-end mt-12 pt-8 border-t border-white/[0.05]">
      <button onClick={onClose} className="btn btn-secondary btn-sm px-6 py-3">Close</button>
    </div>
  </Modal>
);

/* ── Volunteer card ────────────────────────────────────────────────────────── */
const VolunteerCard = ({ v, onView }) => {
  const initials = getInitials(v.first_name, v.last_name);
  return (
    <div className="card hover:border-green-500/30 transition-all hover:translate-y-[-2px] duration-200" style={{ padding: '2rem' }}>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display shrink-0 text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            {initials}
          </div>
          <div className="min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p className="text-base font-bold text-white font-display truncate">{v.first_name} {v.last_name}</p>
            <p className="text-sm text-green-400 font-medium">{v.skill}</p>
          </div>
        </div>
        <Badge.Status value={v.is_available ? 'available' : 'unavailable'} />
      </div>

      <div className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="flex items-center gap-3 text-sm text-slate-400 mt-4">
          <MapPin className="w-5 h-5 shrink-0 text-slate-500" />
          <span>{v.city}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Star className="w-5 h-5 shrink-0 text-yellow-500" />
          <span>{v.rating ?? '—'}/5 rating · {v.assignments_completed} tasks completed</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Zap className="w-5 h-5 shrink-0 text-slate-500" />
          <span>{v.experience_years} years experience · {v.availability}</span>
        </div>
      </div>

      {v.current_assignment && (
        <div className="p-4 rounded-xl flex items-center gap-3 mt-4"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <div className="w-3 h-3 rounded-full bg-orange-400"></div>
          <span className="text-sm font-medium text-orange-300">On Assignment: {v.current_assignment}</span>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <button onClick={() => onView(v)} className="btn btn-outline btn-sm w-full hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all py-3">
          <Eye className="w-4 h-4 mr-2" /> View Profile
        </button>
      </div>
    </div>
  );
};

/* ── Main page ─────────────────────────────────────────────────────────────── */
const VolunteerManagement = () => {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [skillFilter, setSkill] = useState('');
  const [availFilter, setAvail] = useState('');
  const [viewTarget, setViewTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-volunteers', skillFilter, availFilter],
    queryFn: () => getVolunteers({
      skill: skillFilter || undefined,
      available: availFilter === 'true' ? true : availFilter === 'false' ? false : undefined,
    }),
    refetchInterval: 30000,
  });

  const volunteers = (data?.data || []).filter(v =>
    !search ||
    `${v.first_name} ${v.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  );

  const total     = data?.total || 0;
  const available = (data?.data || []).filter(v => v.is_available).length;

  return (
    <div className="animate-fade-in-up pb-6" style={{ padding: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap" style={{ gap: '0.75rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Volunteer Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} volunteers · <span className="text-green-400">{available} available</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="relative flex-1" style={{ minWidth: '350px' }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-base pl-12 search-input-large" />
        </div>
        <select value={skillFilter} onChange={e => setSkill(e.target.value)} className="input-base sm:w-36">
          <option value="">All Skills</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={availFilter} onChange={e => setAvail(e.target.value)} className="input-base sm:w-32">
          <option value="">All Status</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
        {(search || skillFilter || availFilter) && (
          <button onClick={() => { setSearch(''); setSkill(''); setAvail(''); }}
            className="btn btn-ghost btn-sm shrink-0"><X className="w-4 h-4" /></button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '2rem' }}>
              <div className="skeleton h-4 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded mb-4" />
              <div className="skeleton h-3 w-full rounded mb-2" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : volunteers.length === 0 ? (
        <EmptyState icon={Users} title="No volunteers found" description="Try adjusting your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem' }}>
          {volunteers.map(v => (
            <VolunteerCard
              key={v.id} v={v}
              onView={setViewTarget}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewTarget && <VolunteerModal volunteer={viewTarget} onClose={() => setViewTarget(null)} />}
    </div>
  );
};

export default VolunteerManagement;
