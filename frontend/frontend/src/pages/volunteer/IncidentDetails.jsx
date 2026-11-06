import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, AlertTriangle, Users, MessageSquare, ArrowLeft, CheckCircle2, Activity, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getIncidentById } from '../../api/incidentService';
import { getMyAssignments, completeAssignment, getIncidentAssignments } from '../../api/volunteerService';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, severityColor, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reverseGeocode } from '../../api/geocodeService';

const IncidentDetails = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [resolvedLocation, setResolvedLocation] = useState(null);

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id),
    enabled: !!id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: () => getMyAssignments(user?.id),
    enabled: !!user?.id,
  });

  const { data: incidentVolunteers = [], isLoading: volunteersLoading } = useQuery({
    queryKey: ['incident-volunteers', id],
    queryFn: () => getIncidentAssignments(id),
    enabled: !!id,
    retry: false,
    onError: (err) => {
      console.error('Failed to load volunteer count:', err);
    },
  });

  const complete = useMutation({
    mutationFn: ({ incidentId }) => completeAssignment(incidentId, user?.id),
    onSuccess: () => {
      toast.success('Incident marked as completed!');
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      qc.invalidateQueries({ queryKey: ['incident', id] });
    },
    onError: () => {
      toast.error('Could not complete incident.');
    },
  });

  const myAssignment = assignments.find(a => String(a.incident_id) === String(id));
  const canComplete = myAssignment && myAssignment.status === 'in_progress';

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!incident?.latitude || !incident?.longitude) return;
      const addr = String(incident?.location?.address || '');
      const looksLikeCoords = addr.startsWith('(') && addr.includes(',') && addr.endsWith(')');
      if (!looksLikeCoords) return;
      try {
        const geo = await reverseGeocode(incident.latitude, incident.longitude);
        if (!active) return;
        setResolvedLocation(geo?.displayName || null);
      } catch {
        // ignore
      }
    };
    run();
    return () => { active = false; };
  }, [incident?.latitude, incident?.longitude, incident?.location?.address]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <AlertTriangle className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Incident Not Found</h1>
        <p className="text-slate-500 mb-6">The incident you're looking for doesn't exist.</p>
        <Link to="/volunteer/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  // Safe render to prevent blank page on data issues
  if (!incident || typeof incident !== 'object') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <AlertTriangle className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Incident Data Error</h1>
        <p className="text-slate-500 mb-6">Unable to load incident details. Please try again.</p>
        <Link to="/volunteer/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  }

  const sev = severityColor(incident.severity);

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/volunteer/assignments" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '3rem' }}>
        {/* Main Content */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Incident Card */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <div className="flex items-start justify-between" style={{ marginBottom: '2rem' }}>
              <div className="flex-1">
                <div className="flex items-center gap-3" style={{ marginBottom: '0.75rem' }}>
                  <span className="text-xs font-mono text-slate-600">{incident.id}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${sev.text} ${sev.bg} ${sev.border}`}>
                    {incident.severity}
                  </span>
                  <Badge.Status value={incident.status} />
                </div>
                <h1 className="text-2xl font-bold text-white font-display" style={{ marginBottom: '0.75rem' }}>{incident.title}</h1>
                <p className="text-slate-300 leading-relaxed">{incident.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1rem' }}>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{resolvedLocation || incident.location?.address || 'Location not specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{incident.type}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Reported {timeAgo(incident.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">{incidentVolunteers.length || 0} volunteer{incidentVolunteers.length === 1 ? '' : 's'} assigned</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <User className="w-4 h-4" />
                <span className="text-sm">Reported by: {incident.reported_by?.name || 'Anonymous'}</span>
              </div>
            </div>
          </div>

          {/* Assignment Status */}
          {myAssignment && (
            <div className="card" style={{ padding: '2.5rem' }}>
              <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Your Assignment</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm" style={{ marginBottom: '0.25rem' }}>Status</p>
                  <Badge.Status value={myAssignment.status} />
                </div>
                <div>
                  <p className="text-slate-300 text-sm" style={{ marginBottom: '0.25rem' }}>Assigned</p>
                  <p className="text-white text-sm">{timeAgo(myAssignment.assigned_at)}</p>
                </div>
                {canComplete && (
                  <button
                    onClick={() => complete.mutate({ incidentId: myAssignment.incident_id })}
                    disabled={complete.isPending}
                    className="btn btn-primary"
                  >
                    {complete.isPending ? <Spinner size="sm" /> : <><CheckCircle2 className="w-4 h-4" /> Mark Complete</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Actions */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myAssignment ? (
                <>
                  {canComplete && (
                    <button
                      onClick={() => complete.mutate({ incidentId: myAssignment.incident_id })}
                      disabled={complete.isPending}
                      className="btn btn-primary w-full"
                    >
                      {complete.isPending ? <Spinner size="sm" /> : <><CheckCircle2 className="w-4 h-4" /> Complete Assignment</>}
                    </button>
                  )}
                  <Link to={`/volunteer/assignments`} className="btn btn-outline w-full">
                    View All Assignments
                  </Link>
                </>
              ) : (
                <Link to={`/volunteer/available`} className="btn btn-primary w-full">
                  Browse Available Incidents
                </Link>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2"></div>
                <div>
                  <p className="text-sm text-white">Incident Reported</p>
                  <p className="text-xs text-slate-500">{formatDateTime(incident.created_at)}</p>
                </div>
              </div>
              {myAssignment && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Assignment Accepted</p>
                    <p className="text-xs text-slate-500">{formatDateTime(myAssignment.assigned_at)}</p>
                  </div>
                </div>
              )}
              {myAssignment?.status === 'completed' && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Completed</p>
                    <p className="text-xs text-slate-500">{formatDateTime(myAssignment.completed_at || myAssignment.assigned_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;
