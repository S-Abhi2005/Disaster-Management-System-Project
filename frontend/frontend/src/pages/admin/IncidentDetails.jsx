import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, AlertTriangle, Users, ArrowLeft, MessageSquare, User, CheckCircle, UserCheck } from 'lucide-react';
import { getIncidentById, assignVolunteerToIncident, getIncidentAssignments } from '../../api/incidentService';
import { getVolunteers } from '../../api/volunteerService';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, severityColor, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AssignModal = ({ incident, onClose, onAssign }) => {
  const [selected, setSelected] = React.useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['volunteers-available'],
    queryFn: () => getVolunteers({ available: true }),
  });
  const volunteers = data?.data || [];

  return (
    <Modal open onClose={onClose} title="Assign Volunteer" size="md">
      <div className="mb-4">
        <p className="text-sm text-slate-400 mb-1">Incident: <span className="text-white font-semibold">{incident.title}</span></p>
        <p className="text-xs text-slate-600">{incident.id}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
      ) : volunteers.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No available volunteers right now.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {volunteers.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selected?.id === v.id
                  ? 'border-indigo-500/40 bg-indigo-500/10'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]'
              }`}
            >
              <div className="avatar avatar-sm text-white font-display shrink-0"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', fontSize: '0.6rem' }}>
                {v.first_name[0]}{v.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{v.first_name} {v.last_name}</p>
                <p className="text-xs text-slate-500">{v.skill} · {v.city}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">Available</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/[0.05]">
        <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
        <button
          onClick={() => selected && onAssign(incident.id, selected)}
          disabled={!selected}
          className="btn btn-primary btn-sm"
        >
          <UserCheck className="w-3.5 h-3.5" /> Assign
        </button>
      </div>
    </Modal>
  );
};

const AdminIncidentDetails = () => {
  const { id } = useParams();
  const qc = useQueryClient();
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);

  const { data: incident, isLoading: incLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id),
    enabled: !!id,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ['incident-assignments', id],
    queryFn: () => getIncidentAssignments(id),
    enabled: !!id,
  });

  const { data: allVolunteersData } = useQuery({
    queryKey: ['all-volunteers'],
    queryFn: () => getVolunteers({ limit: 100 }),
  });

  const assignMut = useMutation({
    mutationFn: ({ incidentId, volunteer }) => assignVolunteerToIncident(incidentId, volunteer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incident', id] });
      qc.invalidateQueries({ queryKey: ['incident-assignments', id] });
      qc.invalidateQueries({ queryKey: ['all-volunteers'] });
      setAssignModalOpen(false);
      toast.success('Volunteer assigned successfully!');
    },
    onError: () => toast.error('Failed to assign volunteer.'),
  });

  if (incLoading) {
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
        <Link to="/admin/incidents" className="btn btn-primary">
          Back to Incidents
        </Link>
      </div>
    );
  }

  const sev = severityColor(incident.severity);

  // Parse assignment history
  const activeVolAssignment = (assignmentsData || [])
    .filter(a => a.assignment_type === 'VOLUNTEER')
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  
  const isAssigned = activeVolAssignment?.action === 'ASSIGNED';
  const assignedVolunteerDetails = isAssigned
    ? (allVolunteersData?.data || []).find(v => v.id === activeVolAssignment.subject_id)
    : null;

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/incidents" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
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
                <span className="text-sm">{incident.location?.address || 'Location not specified'}</span>
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
                <span className="text-sm">{incident.upvotes || 0} citizen reports</span>
              </div>
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
              {incident.status === 'active' && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Activated</p>
                    <p className="text-xs text-slate-500">Incident is being handled</p>
                  </div>
                </div>
              )}
              {incident.status === 'resolved' && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                  <div>
                    <p className="text-sm text-white">Resolved</p>
                    <p className="text-xs text-slate-500">Incident has been completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Assignment Info */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Assignment</h3>
            {assignedVolunteerDetails ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{assignedVolunteerDetails.first_name} {assignedVolunteerDetails.last_name}</p>
                    <p className="text-xs text-slate-500">Volunteer Assigned</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-4">No volunteer assigned yet</p>
                <button onClick={() => setAssignModalOpen(true)} className="btn btn-primary w-full">
                  Assign Volunteer
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/admin/incidents" className="btn btn-outline w-full">
                Manage Incidents
              </Link>
              <Link to="/admin/volunteers" className="btn btn-outline w-full">
                View Volunteers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      {assignModalOpen && (
        <AssignModal
          incident={incident}
          onClose={() => setAssignModalOpen(false)}
          onAssign={(incidentId, volunteer) => assignMut.mutate({ incidentId, volunteer })}
        />
      )}
    </div>
  );
};

export default AdminIncidentDetails;
