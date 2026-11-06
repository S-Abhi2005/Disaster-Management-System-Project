import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, AlertTriangle, CheckCircle, Zap, Filter, Search, X, CheckCircle2, User } from 'lucide-react';
import { getAvailableIncidents, acceptIncident, completeAssignment, getMyAssignments, getIncidentAssignments } from '../../api/volunteerService';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/EmptyState';
import { INCIDENT_TYPES } from '../../api/incidentService';
import { reverseGeocode } from '../../api/geocodeService';
import { timeAgo, severityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AvailableIncidents = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [resolvedLocations, setResolvedLocations] = useState({});
  const [locallyAccepted, setLocallyAccepted] = useState({});

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['available-incidents'],
    queryFn: getAvailableIncidents,
    refetchInterval: 60000,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: () => getMyAssignments(user?.id),
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const isAccepted =
        locallyAccepted[String(i.id)] === true ||
        assignments.some((a) => String(a.incident_id) === String(i.id) && a.status !== 'completed');
      if (isAccepted) return false;
      const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
      const matchType   = !typeFilter || i.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [incidents, assignments, search, typeFilter]);

  // Fetch volunteer counts for all visible incidents
  const { data: volunteerCounts = {} } = useQuery({
    queryKey: ['volunteer-counts', filtered.map(i => i.id).join(',')],
    queryFn: async () => {
      const counts = {};
      await Promise.all(
        filtered.slice(0, 10).map(async (inc) => {
          const vols = await getIncidentAssignments(inc.id);
          counts[inc.id] = vols.length;
        })
      );
      return counts;
    },
    enabled: filtered.length > 0,
  });

  const accept = useMutation({
    mutationFn: ({ incidentId }) => {
      setAcceptingId(incidentId);
      return acceptIncident(incidentId, user?.id);
    },
    onSuccess: (_, { title, incidentId }) => {
      toast.success(`You've accepted the incident!`);
      setAcceptingId(null);
      setLocallyAccepted((prev) => ({ ...prev, [String(incidentId)]: true }));
      qc.invalidateQueries({ queryKey: ['available-incidents'] });
      qc.invalidateQueries({ queryKey: ['my-assignments', user?.id] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || err?.message || 'Could not accept incident.';
      toast.error(msg);
      setAcceptingId(null);
    },
  });

  const complete = useMutation({
    mutationFn: ({ incidentId }) => {
      setAcceptingId(incidentId);
      return completeAssignment(incidentId, user?.id);
    },
    onSuccess: () => {
      toast.success('Incident marked as completed!');
      setAcceptingId(null);
      qc.invalidateQueries({ queryKey: ['available-incidents'] });
      qc.invalidateQueries({ queryKey: ['my-assignments', user?.id] });
    },
    onError: () => {
      toast.error('Could not complete incident.');
      setAcceptingId(null);
    },
  });

  const isIncidentAccepted = (incidentId) => {
    return assignments.some(a => String(a.incident_id) === String(incidentId));
  };

  const getAssignmentForIncident = (incidentId) => {
    return assignments.find(a => String(a.incident_id) === String(incidentId));
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      const need = filtered
        .filter((inc) => {
          const addr = String(inc?.location?.address || '');
          const looksLikeCoords = addr.startsWith('(') && addr.includes(',') && addr.endsWith(')');
          return looksLikeCoords && !resolvedLocations[inc.id] && inc?.latitude && inc?.longitude;
        })
        .slice(0, 10);

      if (need.length === 0) return;

      try {
        const results = await Promise.all(
          need.map(async (inc) => {
            const geo = await reverseGeocode(inc.latitude, inc.longitude);
            return [inc.id, geo?.displayName || ''];
          })
        );

        if (!active) return;
        setResolvedLocations((prev) => {
          const next = { ...prev };
          for (const [id, name] of results) next[id] = name;
          return next;
        });
      } catch {
        // ignore
      }
    };

    run();
    return () => { active = false; };
  }, [filtered]);

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: '0.75rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Available Incidents</h1>
          <p className="text-slate-500 text-sm mt-2">{filtered.length} incident{filtered.length !== 1 ? 's' : ''} awaiting volunteers</p>
        </div>
        {user?.is_available === false && (
          <div className="badge badge-warning">You are currently unavailable (backend-controlled). If this is incorrect, try accepting/releasing an incident to resync.</div>
        )}
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="relative flex-1" style={{ minWidth: '350px' }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search incidents…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-12 pr-12 search-input-large" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="relative sm:w-36">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="input-base w-full pr-10">
            <option value="">All Types</option>
            {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      <div style={{ marginTop: '2.5rem' }}>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CheckCircle} title="No incidents available"
          description="All incidents are assigned or there are none matching your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2.5rem' }}>
          {filtered.map((inc) => {
            const sev = severityColor(inc.severity);
            const isAccepted = isIncidentAccepted(inc.id);
            const assignment = getAssignmentForIncident(inc.id);
            const isCompleted = assignment?.status === 'completed';

            return (
              <div key={inc.id}
                   className="card hover:border-indigo-500/30 transition-all hover:translate-y-[-2px] duration-200 cursor-pointer"
                   style={{ padding: '1.5rem' }}
                   onClick={() => window.location.href = `/volunteer/incidents/${inc.id}`}>
                {/* Header - Title and Status */}
                <div className="flex items-start justify-between" style={{ marginBottom: '1rem' }}>
                  <h3 className="text-sm font-bold text-white font-display leading-snug flex-1 min-w-0 pr-3">
                    {inc.title}
                  </h3>
                  <Badge.Status value={isCompleted ? 'completed' : isAccepted ? 'active' : inc.status} />
                </div>

                {/* ID */}
                <p className="text-xs font-mono text-slate-600" style={{ marginBottom: '1rem' }}>{inc.id}</p>

                {/* Info - Type */}
                <div className="flex items-center gap-2 text-xs text-slate-400" style={{ marginBottom: '0.5rem' }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                  <span>{inc.type}</span>
                </div>

                {/* Info - Location */}
                <div className="flex items-center gap-2 text-xs text-slate-400" style={{ marginBottom: '0.5rem' }}>
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{resolvedLocations[inc.id] || inc.location?.address}</span>
                </div>

                {/* Info - Reported By */}
                <div className="flex items-center gap-2 text-xs text-slate-400" style={{ marginBottom: '1rem' }}>
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{inc.reported_by?.name || 'Anonymous'}</span>
                </div>

                {/* Footer - Severity, Volunteers, Time */}
                <div className="flex items-center justify-between" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${sev.text} ${sev.bg} ${sev.border}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs text-slate-400">
                      {volunteerCounts[inc.id] || 0} volunteer{(volunteerCounts[inc.id] || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo(inc.created_at)}</span>
                  </div>
                </div>

                {/* Accept Button (only for not accepted) */}
                {!isAccepted && !isCompleted && (inc.status === 'pending' || inc.status === 'active') && (
                  <div style={{ marginTop: '1rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => accept.mutate({ incidentId: inc.id, title: inc.title })}
                      disabled={acceptingId === inc.id}
                      className="btn btn-success btn-sm w-full">
                      {acceptingId === inc.id ? <Spinner size="sm" /> : <><Zap className="w-3.5 h-3.5 mr-1" /> Accept</>}
                    </button>
                  </div>
                )}
                {(isAccepted || isCompleted) && (
                  <div style={{ marginTop: '1rem' }} className="flex items-center justify-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">
                      {isCompleted ? 'Completed' : 'Accepted'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
};

export default AvailableIncidents;
