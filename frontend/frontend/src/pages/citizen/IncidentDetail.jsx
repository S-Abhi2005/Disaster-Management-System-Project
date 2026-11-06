import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Clock, User, Truck, AlertTriangle,
  CheckCircle2, Activity, Image as ImageIcon,
} from 'lucide-react';
import { getIncidentById, updateIncidentStatus } from '../../api/incidentService';
import { reverseGeocode } from '../../api/geocodeService';
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/EmptyState';
import { formatDateTime, timeAgo, severityColor } from '../../utils/helpers';

const STATUS_TIMELINE = [
  { key: 'pending',  label: 'Reported',   icon: AlertTriangle },
  { key: 'active',   label: 'In Progress', icon: Activity },
  { key: 'resolved', label: 'Resolved',    icon: CheckCircle2 },
  { key: 'closed',   label: 'Closed',      icon: CheckCircle2 },
];

const IncidentDetail = () => {
  const { id } = useParams();
  const qc     = useQueryClient();

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn:  () => getIncidentById(id),
    refetchInterval: 10000,
  });

  const [resolvedLocation, setResolvedLocation] = useState(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!incident?.latitude || !incident?.longitude) return;

      const currentAddress = String(incident?.location?.address || '');
      const looksLikeCoords = currentAddress.startsWith('(') && currentAddress.includes(',') && currentAddress.endsWith(')');
      if (!looksLikeCoords) return;

      try {
        const geo = await reverseGeocode(incident.latitude, incident.longitude);
        if (!active) return;
        setResolvedLocation(geo);
      } catch (e) {
        // ignore
      }
    };

    run();
    return () => { active = false; };
  }, [incident?.latitude, incident?.longitude, incident?.location?.address]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );

  if (!incident) return (
    <div className="text-center py-24">
      <p className="text-slate-500">Incident not found.</p>
      <Link to="/citizen/incidents" className="btn btn-secondary btn-sm mt-4 inline-flex">← Back</Link>
    </div>
  );

  const sev        = severityColor(incident.severity);
  const statusIdx  = STATUS_TIMELINE.findIndex((s) => s.key === incident.status);
  const currentIdx = statusIdx === -1 ? 0 : statusIdx;

  const locationLabel = resolvedLocation?.displayName || incident.location?.address;

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link to="/citizen/incidents"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors" style={{ marginBottom: '1rem' }}>
          <ChevronLeft className="w-4 h-4" /> Back to Incidents
        </Link>
        <div className="flex items-start justify-between flex-wrap" style={{ gap: '1rem' }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <span className="text-xs font-mono text-slate-600">{incident.id}</span>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${sev.text} ${sev.bg} ${sev.border}`}>
                {incident.severity}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white font-display">{incident.title}</h1>
          </div>
          <Badge.Status value={incident.status} />
        </div>
      </div>

      {/* Status timeline */}
      <div className="card">
        <h3 className="text-sm font-bold text-white font-display" style={{ marginBottom: '1.25rem' }}>Progress</h3>
        <div className="flex items-center">
          {STATUS_TIMELINE.slice(0, 3).map((s, i) => {
            const done    = i <= currentIdx;
            const active  = i === currentIdx;
            const Icon    = s.icon;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    done && !active ? 'border-green-500 bg-green-500/10' :
                    active ? 'border-indigo-500 bg-indigo-500/15' :
                    'border-white/10 bg-white/[0.02]'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      done && !active ? 'text-green-400' :
                      active ? 'text-indigo-400' : 'text-slate-600'
                    }`} />
                  </div>
                  <span className={`text-[10px] font-semibold whitespace-nowrap ${
                    active ? 'text-indigo-300' : done ? 'text-green-400' : 'text-slate-600'
                  }`}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${i < currentIdx ? 'bg-green-500' : 'bg-white/[0.07]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main content card */}
      <div className="card" style={{ padding: '2rem', marginTop: '3rem' }}>
        {/* Description section */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="text-base font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Incident Description</h3>
          <p className="text-sm text-slate-300 leading-relaxed" style={{ marginBottom: '1.5rem' }}>{incident.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-info">{incident.type}</span>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ marginBottom: '3rem' }}>
          <h4 className="text-sm font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Incident Details</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.5rem' }}>
            {[
              { icon: MapPin,  label: 'Location',  value: locationLabel, color: '#3b82f6' },
              { icon: Clock,   label: 'Reported',  value: formatDateTime(incident.created_at), color: '#8b5cf6' },
              { icon: Clock,   label: 'Updated',   value: timeAgo(incident.updated_at), color: '#10b981' },
              { icon: User,    label: 'Reported By', value: incident.reported_by?.name, color: '#f59e0b' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', 
                  borderColor: `${color}20`,
                  borderWidth: '1px'
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ 
                    background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)` 
                  }} />
                <div className="relative p-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110" 
                      style={{ 
                        background: `${color}25`, 
                        border: `1px solid ${color}40`,
                        color: color
                      }}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                      <p className="text-sm font-semibold uppercase tracking-wider mb-3 transition-colors duration-300 group-hover:text-white" 
                        style={{ color: `${color}aa` }}>
                        {label}
                      </p>
                      <p className="text-base font-medium text-slate-200 leading-relaxed transition-colors duration-300 group-hover:text-white">
                        {value || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volunteer Assignment */}
        <div style={{ marginBottom: '3rem' }}>
          <h4 className="text-sm font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Volunteer Assignment</h4>
          <div className="card" style={{ padding: '2rem', background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' }}>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" 
                style={{ 
                  background: 'rgba(59,130,246,0.2)', 
                  border: '1px solid rgba(59,130,246,0.3)'
                }}>
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <div style={{ paddingLeft: '1rem' }}>
                <h3 className="text-3xl font-bold text-white font-display mb-2">
                  {incident.assigned_volunteers_count || 0}
                </h3>
                <p className="text-sm text-slate-400" style={{ letterSpacing: '0.01em' }}>
                  Volunteers have accepted this incident
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        {Array.isArray(incident.images) && incident.images.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h4 className="text-sm font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Uploaded Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1.5rem' }}>
              {incident.images.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-800">
                  <img src={src} alt={`Incident ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetail;
