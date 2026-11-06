import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, CheckCircle, Activity, Clipboard, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getMyAssignments, completeAssignment } from '../../api/volunteerService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, formatDateTime } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['assigned', 'in_progress', 'completed'];

const MyAssignments = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [completingId, setCompletingId] = useState(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: () => getMyAssignments(user?.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const complete = useMutation({
    mutationFn: ({ assignmentId }) => {
      setCompletingId(assignmentId);
      const a = assignments.find((x) => String(x.id) === String(assignmentId));
      return completeAssignment(a?.incident_id, user?.id);
    },
    onSuccess: () => {
      toast.success('Assignment marked as completed!');
      setCompletingId(null);
      qc.invalidateQueries({ queryKey: ['my-assignments'] });
    },
    onError: () => {
      toast.error('Could not complete assignment.');
      setCompletingId(null);
    },
  });

  const active    = assignments.filter((a) => a.status !== 'completed');
  const completed = assignments.filter((a) => a.status === 'completed');

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const AssignmentCard = ({ a, onComplete, completingId }) => (
    <div className="card hover:border-indigo-500/15 transition-all duration-200">
      {/* Status progress */}
      <div className="flex items-center" style={{ marginBottom: '1.5rem' }}>
        {STATUS_STEPS.map((s, i) => {
          const idx = STATUS_STEPS.indexOf(a.status);
          const done   = i <= idx;
          const active = i === idx;
          return (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done && !active ? 'border-green-500 bg-green-500/15' :
                active ? 'border-indigo-500 bg-indigo-500/15' :
                'border-white/10 bg-transparent'
              }`}>
                {done && !active
                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : <span className={`text-[10px] font-bold ${active ? 'text-indigo-300' : 'text-slate-600'}`}>{i+1}</span>
                }
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < idx ? 'bg-green-500' : 'bg-white/[0.06]'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-start justify-between" style={{ gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <p className="text-xs font-mono text-slate-600" style={{ marginBottom: '0.5rem' }}>{a.incident_id}</p>
          <h3 className="text-base font-bold text-white font-display">{a.incident_title}</h3>
        </div>
        <Badge.Status value={a.status} />
      </div>

      <div className="flex flex-wrap text-xs text-slate-500" style={{ gap: '0.75rem 1.5rem', marginBottom: '1.5rem' }}>
        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{a.location}</span>
        <span className="flex items-center gap-2"><Clock className="w-4 h-4" />Assigned {timeAgo(a.assigned_at)}</span>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
          a.incident_severity === 'critical' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
          a.incident_severity === 'high' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
          'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
        }`}>
          {a.incident_severity}
        </span>
        <div className="flex items-center gap-2">
          {a.status === 'in_progress' && (
            <button
              onClick={() => onComplete({ assignmentId: a.id })}
              disabled={completingId === a.id}
              className="btn btn-primary btn-sm text-xs"
              style={{ minWidth: '100px' }}>
              {completingId === a.id ? <Spinner size="sm" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Complete</>}
            </button>
          )}
          <Link to={`/volunteer/assignments/${a.incident_id}`} className="btn btn-ghost btn-sm text-xs">
            View
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">My Assignments</h1>
          <p className="text-slate-500 text-sm mt-2">{active.length} active, {completed.length} completed</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon={Clipboard} title="No assignments yet"
          description="Accept an incident to start your first assignment."
          action={<Link to="/volunteer/available" className="btn btn-primary btn-sm">Browse Incidents</Link>}
        />
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div className="section-label">Active</div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '3rem' }}>
                {active.map((a) => <AssignmentCard key={a.id} a={a} onComplete={complete.mutate} completingId={completingId} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <div className="section-label">Completed</div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '3rem' }}>
                {completed.map((a) => <AssignmentCard key={a.id} a={a} onComplete={complete.mutate} completingId={completingId} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyAssignments;
