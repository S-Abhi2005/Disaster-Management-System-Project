import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, CheckCircle, Clock, Activity,
  AlertTriangle, MapPin, User, Truck, X, ChevronLeft,
  ChevronRight, Eye, UserCheck,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getIncidents, updateIncidentStatus,
  assignVolunteerToIncident, INCIDENT_TYPES, SEVERITY_LEVELS,
  deleteIncident,
} from '../../api/incidentService';
import { getVolunteers } from '../../api/volunteerService';
import axiosInstance from '../../api/axiosInstance';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/EmptyState';
import { timeAgo, severityColor } from '../../utils/helpers';

const STATUSES = ['pending', 'active', 'resolved'];

/* ── Status action button ──────────────────────────────────────────────────── */
const StatusBtn = ({ label, onClick, color, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all hover:scale-105 active:scale-100"
    style={{ color, borderColor: `${color}40`, background: `${color}12` }}
  >
    {label}
  </button>
);

/* ── Assign volunteer modal ────────────────────────────────────────────────── */
const AssignModal = ({ incident, onClose, onAssign, alreadyAssignedIds = [] }) => {
  const [selected, setSelected] = useState(new Set());
  const [assigning, setAssigning] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['volunteers-all-for-assign'],
    queryFn: () => getVolunteers({ limit: 100 }),
  });

  const incidentCity = incident?.location?.address || '';

  const volunteers = React.useMemo(() => {
    const all = data?.data || [];
    return all
      .filter(v => !alreadyAssignedIds.includes(v.id)) // exclude already-assigned
      .sort((a, b) => {
        // Sort: same city first, then available, then alphabetical
        const aCity = (a.city || '').toLowerCase();
        const bCity = (b.city || '').toLowerCase();
        const incCity = incidentCity.toLowerCase();
        const aMatch = incCity.includes(aCity) || aCity.includes(incCity.split(',')[0]?.trim());
        const bMatch = incCity.includes(bCity) || bCity.includes(incCity.split(',')[0]?.trim());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        if (a.is_available && !b.is_available) return -1;
        if (!a.is_available && b.is_available) return 1;
        return 0;
      });
  }, [data, alreadyAssignedIds, incidentCity]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setAssigning(true);
    const vols = volunteers.filter(v => selected.has(v.id));
    for (const vol of vols) {
      await onAssign(incident.id, vol);
    }
    setAssigning(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Assign Volunteers" size="md">
      <div className="mb-4">
        <p className="text-sm text-slate-400 mb-1">Incident: <span className="text-white font-semibold">{incident.title}</span></p>
        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location?.address}</p>
        {alreadyAssignedIds.length > 0 && (
          <p className="text-xs text-green-400 mt-1">✓ {alreadyAssignedIds.length} volunteer{alreadyAssignedIds.length > 1 ? 's' : ''} already assigned</p>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">Select one or more volunteers</span>
        {selected.size > 0 && (
          <span className="text-xs font-semibold text-indigo-400">{selected.size} selected</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : volunteers.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No available volunteers to assign.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {volunteers.map((v) => {
            const isChecked = selected.has(v.id);
            const vCity = (v.city || '').toLowerCase();
            const incCity = incidentCity.toLowerCase();
            const isNearby = incCity.includes(vCity) || vCity.includes(incCity.split(',')[0]?.trim().toLowerCase());
            return (
              <button
                key={v.id}
                onClick={() => toggleSelect(v.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isChecked
                    ? 'border-indigo-500/50 bg-indigo-500/15'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                  isChecked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                }`}>
                  {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="avatar avatar-sm text-white font-display shrink-0 text-[0.6rem]"
                  style={{ background: isNearby ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  {v.first_name?.[0]}{v.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{v.first_name} {v.last_name}</p>
                  <p className="text-xs text-slate-500">{v.skill} · {v.city}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isNearby && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Nearby</span>
                  )}
                  {v.is_available
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Available</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Busy</span>
                  }
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/[0.05]">
        <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
        <button
          onClick={handleAssign}
          disabled={selected.size === 0 || assigning}
          className="btn btn-primary btn-sm"
        >
          <UserCheck className="w-3.5 h-3.5" />
          {assigning ? 'Assigning…' : `Assign ${selected.size > 0 ? `(${selected.size})` : ''}`}
        </button>
      </div>
    </Modal>
  );
};

/* ── Main page ─────────────────────────────────────────────────────────────── */
const IncidentManagement = () => {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [type, setType]       = useState('');
  const [page, setPage]       = useState(1);
  const [assignTarget, setAssignTarget] = useState(null); // incident to assign
  const LIMIT = 8;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-incidents', status, type, page],
    queryFn: () => getIncidents({ status: status || undefined, type: type || undefined, page, limit: LIMIT }),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['all-assignments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/assignments/');
      return Array.isArray(res) ? res : (res?.data || []);
    },
  });

  const { data: allVolunteersData } = useQuery({
    queryKey: ['all-volunteers'],
    queryFn: () => getVolunteers({ limit: 100 }),
  });

  const rawIncidents   = (data?.data || []).filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || String(i.id).includes(search)
  );

  const incidents = rawIncidents.map(inc => {
    const incId = Number(inc.id);
    const volsAssignments = (assignmentsData || [])
      .filter(a => a.incident_id === incId && a.assignment_type === 'VOLUNTEER')
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const activeVol = volsAssignments.length > 0 ? volsAssignments[0] : null;
    if (activeVol && activeVol.action === 'ASSIGNED') {
      const volInfo = (allVolunteersData?.data || []).find(v => v.id === activeVol.subject_id);
      if (volInfo) {
        return {
          ...inc,
          assigned_volunteer: { id: volInfo.id, name: `${volInfo.first_name} ${volInfo.last_name}`, skill: volInfo.skill }
        };
      }
    }
    return inc;
  });

  const totalPages  = data?.pages || 1;

  const statusMut = useMutation({
    mutationFn: ({ id, s }) => updateIncidentStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-incidents'] }); toast.success('Status updated'); },
    onError: () => toast.error('Update failed'),
  });

  const assignMut = useMutation({
    mutationFn: ({ incidentId, volunteer }) => assignVolunteerToIncident(incidentId, { id: volunteer.id, name: `${volunteer.first_name} ${volunteer.last_name}`, skill: volunteer.skill }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
      qc.invalidateQueries({ queryKey: ['all-assignments'] });
      qc.invalidateQueries({ queryKey: ['volunteers-all-for-assign'] });
      qc.invalidateQueries({ queryKey: ['all-volunteers'] });
      toast.success('Volunteer assigned!');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Assignment failed'),
  });

  // IDs of volunteers already assigned to the assignTarget incident
  const alreadyAssignedIds = React.useMemo(() => {
    if (!assignTarget) return [];
    const incId = Number(assignTarget.id);
    return (assignmentsData || [])
      .filter(a => a.incident_id === incId && a.assignment_type === 'VOLUNTEER' && a.action === 'ASSIGNED')
      .map(a => a.subject_id);
  }, [assignTarget, assignmentsData]);

  const deleteMut = useMutation({
    mutationFn: (id) => deleteIncident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
      qc.invalidateQueries({ queryKey: ['all-assignments'] });
      toast.success('Incident deleted');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'Delete failed');
    },
  });

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Incident Management</h1>
          <p className="text-slate-500 text-sm mt-2">Monitor and manage all reported incidents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="relative flex-1" style={{ minWidth: '350px' }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search by title or ID…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-base pl-12 search-input-large" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-base sm:w-32">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="input-base sm:w-36">
          <option value="">All Types</option>
          {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(status || type || search) && (
          <button onClick={() => { setStatus(''); setType(''); setSearch(''); setPage(1); }}
            className="btn btn-ghost btn-sm shrink-0"><X className="w-4 h-4" /> Clear</button>
        )}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem' }}>
              <div className="skeleton h-4 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded mb-4" />
              <div className="skeleton h-3 w-full rounded mb-2" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No incidents found" description="Try adjusting your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem' }}>
          {incidents.map(inc => {
            const sev = severityColor(inc.severity);
            return (
              <div key={inc.id}
                   className="card hover:border-indigo-500/30 transition-all hover:translate-y-[-2px] duration-200 cursor-pointer"
                   style={{ padding: '2rem' }}
                   onClick={() => window.location.href = `/admin/incidents/${inc.id}`}>
                {/* Header - Title and Status */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                    <Badge.Status value={inc.status} />
                    <span className="text-xs font-mono text-slate-600">{inc.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-display leading-snug line-clamp-2">
                    {inc.title}
                  </h3>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <AlertTriangle className="w-4 h-4 text-slate-500" />
                    <span>{inc.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{inc.location?.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      {inc.assigned_volunteer ? (
                        <span className="text-green-400">{inc.assigned_volunteer.name}</span>
                      ) : (
                        <span className="text-slate-600">Unassigned</span>
                      )}
                    </div>
                    {!inc.assigned_volunteer && (
                      <button onClick={(e) => { e.stopPropagation(); setAssignTarget(inc); }}
                        className="text-xs font-semibold px-2 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all">
                        Assign
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer - Severity, Time and Activate */}
                <div className="flex items-center justify-between" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${sev.text} ${sev.bg} ${sev.border}`}>
                      {inc.severity}
                    </span>
                    {inc.status === 'pending' && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusBtn label="Activate" color="#22d3ee"
                          loading={statusMut.isPending}
                          onClick={() => statusMut.mutate({ id: inc.id, s: 'active' })} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-500">{timeAgo(inc.created_at)}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={deleteMut.isPending}
                      onClick={() => {
                        const ok = window.confirm('Delete this incident permanently?');
                        if (ok) deleteMut.mutate(inc.id);
                      }}
                      title="Delete incident"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn btn-ghost btn-sm"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({length: totalPages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} className={`btn btn-sm ${p===page?'btn-primary':'btn-ghost'}`} style={{minWidth:'2rem',padding:'0 0.5rem'}}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="btn btn-ghost btn-sm"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignTarget && (
        <AssignModal
          incident={assignTarget}
          onClose={() => setAssignTarget(null)}
          alreadyAssignedIds={alreadyAssignedIds}
          onAssign={(incidentId, volunteer) => assignMut.mutate({ incidentId, volunteer })}
        />
      )}
    </div>
  );
};

export default IncidentManagement;
