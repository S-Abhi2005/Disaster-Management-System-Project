import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Clock, CheckCircle, Activity, Clipboard, CheckCircle2,
  AlertTriangle, AlertCircle, RefreshCw, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { getMyAssignments, completeAssignment } from '../../api/volunteerService';
import Badge from '../../components/ui/Badge';
import EmptyState, { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, formatDateTime } from '../../utils/helpers';

const STATUS_STEPS = ['assigned', 'in_progress', 'completed'];

/* ── Individual Assignment Card Component ───────────────────────────────────── */
const AssignmentCard = ({ a, onComplete, completingId }) => {
  const isCompleted = a.status === 'completed';
  const isCritical = a.incident_severity === 'critical';
  const isHigh = a.incident_severity === 'high';

  return (
    <div className="card hover:border-indigo-500/25 transition-all duration-200" style={{ padding: '2rem' }}>
      {/* Status Progress Stepper */}
      <div className="flex items-center" style={{ marginBottom: '1.5rem' }}>
        {STATUS_STEPS.map((s, i) => {
          const idx = STATUS_STEPS.indexOf(a.status);
          const done = i <= idx;
          const active = i === idx;
          return (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done && !active
                    ? 'border-green-500 bg-green-500/15'
                    : active
                    ? 'border-indigo-500 bg-indigo-500/15'
                    : 'border-white/10 bg-transparent'
                }`}
              >
                {done && !active ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <span className={`text-[10px] font-bold ${active ? 'text-indigo-300' : 'text-slate-600'}`}>
                    {i + 1}
                  </span>
                )}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < idx ? 'bg-green-500' : 'bg-white/[0.06]'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Header: Title and Status */}
      <div className="flex items-start justify-between" style={{ gap: '1rem', marginBottom: '1rem' }}>
        <div className="min-w-0">
          <p className="text-xs font-mono text-slate-500" style={{ marginBottom: '0.25rem' }}>
            INC-{a.incident_id}
          </p>
          <h3 className="text-base font-bold text-white font-display truncate">
            {a.incident_title || `Incident #${a.incident_id}`}
          </h3>
        </div>
        <Badge.Status value={a.status} />
      </div>

      {/* Meta details: Type, Location, Date */}
      <div className="flex flex-wrap text-xs text-slate-400" style={{ gap: '0.75rem 1.5rem', marginBottom: '1.5rem' }}>
        {a.incident_type && (
          <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
            <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
            {a.incident_type}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="truncate">{a.location || 'Location unavailable'}</span>
        </span>
        <span className="flex items-center gap-1.5" title={a.assigned_at ? formatDateTime(a.assigned_at) : undefined}>
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Assigned {a.assigned_at ? timeAgo(a.assigned_at) : 'recently'}</span>
        </span>
      </div>

      {/* Footer: Severity and Actions */}
      <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
        <span
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
            isCritical
              ? 'text-red-400 bg-red-400/10 border-red-400/20'
              : isHigh
              ? 'text-orange-400 bg-orange-400/10 border-orange-400/20'
              : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
          }`}
        >
          {a.incident_severity || 'medium'}
        </span>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button
              onClick={() => onComplete({ assignmentId: a.id })}
              disabled={completingId === a.id}
              className="btn btn-primary btn-sm text-xs"
              style={{ minWidth: '100px' }}
            >
              {completingId === a.id ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </>
              )}
            </button>
          )}
          <Link
            to={`/volunteer/assignments/${a.incident_id}`}
            className="btn btn-ghost btn-sm text-xs inline-flex items-center gap-1"
          >
            Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ── Main MyAssignments Page ────────────────────────────────────────────────── */
const MyAssignments = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [completingId, setCompletingId] = useState(null);

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: () => getMyAssignments(user?.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const complete = useMutation({
    mutationFn: ({ assignmentId }) => {
      setCompletingId(assignmentId);
      const a = (assignments || []).find((x) => String(x.id) === String(assignmentId));
      return completeAssignment(a?.incident_id, user?.id);
    },
    onSuccess: () => {
      toast.success('Assignment marked as completed!');
      setCompletingId(null);
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
      qc.invalidateQueries({ queryKey: ['available-incidents'] });
      qc.invalidateQueries({ queryKey: ['admin-volunteers'] });
      qc.invalidateQueries({ queryKey: ['volunteers-all'] });
      qc.invalidateQueries({ queryKey: ['assignments-all'] });
      if (user) {
        useAuthStore.getState().updateUser({
          assignments_completed: (user.assignments_completed || 0) + 1,
          is_available: true,
        });
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || err?.message || 'Could not complete assignment.');
      setCompletingId(null);
    },
  });

  // Ensure safe array handling
  const assignmentList = Array.isArray(assignments) ? assignments : [];
  const active = assignmentList.filter((a) => a.status !== 'completed');
  const completed = assignmentList.filter((a) => a.status === 'completed');

  /* 1. Loading State */
  if (isLoading) {
    return (
      <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">My Assignments</h1>
            <p className="text-slate-500 text-sm mt-2">Loading your assignments...</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm">Fetching assignment records...</p>
        </div>
      </div>
    );
  }

  /* 2. Error State */
  if (isError) {
    return (
      <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">My Assignments</h1>
            <p className="text-slate-500 text-sm mt-2">Could not load assignments</p>
          </div>
        </div>
        <div className="card border-red-500/20 bg-red-500/5 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-2">Failed to load assignments</h3>
          <p className="text-sm text-slate-400 mb-4">
            {error?.message || 'An error occurred while fetching your assignment data.'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  /* 3. Main Content / Empty State */
  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">My Assignments</h1>
          <p className="text-slate-500 text-sm mt-2">
            {active.length} active, {completed.length} completed
          </p>
        </div>
        <Link to="/volunteer/available" className="btn btn-secondary btn-sm">
          Browse Incidents
        </Link>
      </div>

      {assignmentList.length === 0 ? (
        <EmptyState
          icon={Clipboard}
          title="No assignments available"
          description="You currently have no active or completed assignments. Accept an incident from the available list to start assisting."
          action={
            <Link to="/volunteer/available" className="btn btn-primary btn-sm">
              Browse Available Incidents
            </Link>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div className="section-label mb-4">Active Assignments ({active.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '2rem' }}>
                {active.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    a={a}
                    onComplete={complete.mutate}
                    completingId={completingId}
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="section-label mb-4">Completed Assignments ({completed.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '2rem' }}>
                {completed.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    a={a}
                    onComplete={complete.mutate}
                    completingId={completingId}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyAssignments;
