import React from 'react';
import {
  AlertTriangle, Users, Package, Bell, TrendingUp,
  Clock, CheckCircle, MapPin, Activity, Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/EmptyState';
import { getIncidents } from '../../api/incidentService';
import { getVolunteers } from '../../api/volunteerService';
import { getResources } from '../../api/resourceService';
import axiosInstance from '../../api/axiosInstance';
import { timeAgo, truncate } from '../../utils/helpers';

/* ── Mini activity feed item ─────────────────────────────────────────────────── */
const ActivityItem = ({ icon: Icon, iconBg, title, subtitle, time }) => (
  <div className="flex items-start gap-3 py-3.5 border-b border-white/[0.04] last:border-0">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: iconBg }}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-200 truncate">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
    </div>
    <span className="text-xs text-slate-600 shrink-0">{time}</span>
  </div>
);

/* ── Recent incident row ─────────────────────────────────────────────────────── */
const IncidentRow = ({ incident }) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2">
    <div className="w-1.5 h-8 rounded-full shrink-0"
      style={{
        background: incident.severity === 'critical' ? '#f43f5e' :
                    incident.severity === 'high' ? '#f97316' :
                    incident.severity === 'medium' ? '#facc15' : '#4ade80',
      }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-200 truncate">{incident.title}</p>
      <p className="text-xs text-slate-500 mt-0.5"><MapPin className="inline w-3 h-3 mr-1" />{incident.location?.address}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Badge.Status value={incident.status} />
    </div>
    <span className="text-xs text-slate-600 shrink-0">{timeAgo(incident.created_at)}</span>
  </div>
);

const AdminOverview = () => {
  const incidentsQ  = useQuery({ queryKey: ['incidents-all'],  queryFn: () => getIncidents() });
  const volunteersQ = useQuery({ queryKey: ['volunteers-all'], queryFn: () => getVolunteers() });
  const resourcesQ  = useQuery({ queryKey: ['resources-all'],  queryFn: () => getResources() });
  const assignmentsQ = useQuery({ 
    queryKey: ['assignments-all'], 
    queryFn: async () => {
      const res = await axiosInstance.get('/assignments/');
      return Array.isArray(res) ? res : (res?.data || []);
    },
    retry: 2,
    refetchInterval: 30000,
  });

  const incidents  = incidentsQ.data?.data  || [];
  const volunteers = volunteersQ.data?.data || [];
  const resources  = resourcesQ.data?.data  || [];
  const assignments = assignmentsQ.data || [];
  const isLoading  = incidentsQ.isLoading || volunteersQ.isLoading || resourcesQ.isLoading || assignmentsQ.isLoading;

  const stats = {
    total:     incidentsQ.data?.total    || 0,
    active:    incidents.filter((i) => i.status === 'active').length,
    resolved:  incidents.filter((i) => i.status === 'resolved').length,
    pending:   incidents.filter((i) => i.status === 'pending').length,
    volunteers: volunteersQ.data?.total  || 0,
    volAvail:  volunteers.filter((v) => v.is_available).length,
    resources:  resourcesQ.data?.total   || 0,
    resAvail:  resources.filter((r) => r.status === 'available').length,
  };

  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const recentActivities = [...assignments]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3)
    .map(event => {
      let title, subtitle, icon, iconBg;
      if (event.assignment_type === 'VOLUNTEER') {
        const vol = volunteers.find(v => v.id === event.subject_id);
        const name = vol ? `${vol.first_name} ${vol.last_name}` : `Volunteer #${event.subject_id}`;
        if (event.action === 'ASSIGNED') {
          title = "Volunteer deployed"; subtitle = `${name} -> INC-${event.incident_id}`;
          icon = Users; iconBg = "rgba(34,197,94,0.2)";
        } else {
          title = "Volunteer released"; subtitle = `${name} from INC-${event.incident_id}`;
          icon = CheckCircle; iconBg = "rgba(168,85,247,0.2)";
        }
      } else {
        const res = resources.find(r => r.id === event.subject_id);
        const name = res ? res.name : `Resource #${event.subject_id}`;
        if (event.action === 'ASSIGNED') {
          title = "Resource dispatched"; subtitle = `${name} -> INC-${event.incident_id}`;
          icon = Package; iconBg = "rgba(234,179,8,0.2)";
        } else {
          title = "Resource returned"; subtitle = `${name} from INC-${event.incident_id}`;
          icon = Package; iconBg = "rgba(59,130,246,0.2)";
        }
      }
      return { id: event.id || Math.random(), title, subtitle, icon, iconBg, time: timeAgo(event.timestamp) };
    });

  let totalResponseMs = 0;
  let responseCount = 0;
  incidents.forEach(inc => {
    const incAssignments = assignments.filter(a => String(a.incident_id) === String(inc.id) && a.action === 'ASSIGNED');
    if (incAssignments.length > 0) {
      incAssignments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const diff = new Date(incAssignments[0].timestamp).getTime() - new Date(inc.created_at).getTime();
      if (diff >= 0) { totalResponseMs += diff; responseCount++; }
    }
  });

  const avgResponseMin = responseCount > 0 ? (totalResponseMs / responseCount / 60000).toFixed(1) : '--';
  const assignRate = stats.total > 0 ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0;
  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Page header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-2">Real-time platform monitoring and management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live Dashboard
        </div>
      </div>

      {/* Stats cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 stagger" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
          <StatCard title="Total Incidents" value={stats.total} icon={AlertTriangle} accent="danger"
            trend={12} trendLabel="this week" />
          <StatCard title="Active Incidents" value={stats.active} icon={Activity} accent="warning"
            trend={5} trendLabel="in progress" />
          <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} accent="success"
            trend={8} trendLabel="this month" />
          <StatCard title="Pending Review" value={stats.pending} icon={Clock} accent="info"
            subtitle="awaiting assignment" />
          <StatCard title="Volunteers" value={stats.volunteers} icon={Users} accent="primary"
            trend={3} trendLabel="new this week" />
          <StatCard title="Available Now" value={stats.volAvail} icon={Zap} accent="success"
            subtitle="ready to deploy" />
          <StatCard title="Resources" value={stats.resources} icon={Package} accent="warning"
            subtitle="in inventory" />
          <StatCard title="Available Stock" value={stats.resAvail} icon={TrendingUp} accent="success"
            subtitle="ready to assign" />
        </div>
      )}

      {/* Two column section */}
      <div className="grid grid-cols-1 xl:grid-cols-3" style={{ gap: '2.5rem' }}>

        {/* Recent incidents */}
        <div className="xl:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h3 className="text-base font-bold text-white font-display">Recent Incidents</h3>
                <p className="text-xs text-slate-500" style={{ marginTop: '0.25rem' }}>Latest reported incidents requiring attention</p>
              </div>
              <a href="/admin/incidents" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                View all
              </a>
            </div>
            <div>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="py-3 border-b border-white/[0.04] flex gap-3 items-center">
                      <div className="skeleton w-1.5 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {recentIncidents.map((incident) => (
                      <IncidentRow key={incident.id} incident={incident} />
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h3 className="text-base font-bold text-white font-display">Volunteer Status</h3>
                <p className="text-xs text-slate-500" style={{ marginTop: '0.25rem' }}>Active volunteer availability</p>
              </div>
              <a href="/admin/volunteers" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                View all
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentActivities.map((act) => (
                <ActivityItem
                  key={act.id}
                  icon={act.icon} iconBg={act.iconBg}
                  title={act.title}
                  subtitle={act.subtitle}
                  time={act.time}
                />
              ))}
              {recentActivities.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No recent activity</p>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { label: 'Response Time', value: avgResponseMin !== '--' ? `${avgResponseMin} min` : '--', color: '#4ade80' },
                { label: 'Assign Rate', value: `${assignRate}%`, color: '#60a5fa' },
                { label: 'Resolution Rate', value: `${resolutionRate}%`, color: '#a5b4fc' },
                { label: 'Volunteer Util.', value: `${stats.volunteers ? Math.round(((stats.volunteers - stats.volAvail) / stats.volunteers) * 100) : 0}%`, color: '#facc15' },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-lg font-bold font-display" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card" style={{ marginBottom: '2.5rem', padding: '2rem', marginTop: '2.5rem' }}>
        <h3 className="text-base font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Incident Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1rem' }}>
          {[
            { label: 'Active',   count: stats.active,   color: '#22d3ee',  pct: stats.total ? Math.round((stats.active / stats.total) * 100) : 0 },
            { label: 'Pending',  count: stats.pending,  color: '#facc15',  pct: stats.total ? Math.round((stats.pending / stats.total) * 100) : 0 },
            { label: 'Resolved', count: stats.resolved, color: '#4ade80', pct: stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0 },
            { label: 'Critical', count: incidents.filter((i) => i.severity === 'critical').length, color: '#f87171', pct: stats.total ? Math.round((incidents.filter((i) => i.severity === 'critical').length / stats.total) * 100) : 0 },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.pct}%</span>
              </div>
              <div className="text-2xl font-bold font-display text-white mb-2">{s.count}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
