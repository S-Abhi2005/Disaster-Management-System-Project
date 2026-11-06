import React from 'react';
import {
  Activity, CheckCircle2, Clock, MapPin, Zap,
  TrendingUp, ArrowRight, Clipboard, ToggleLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/EmptyState';
import { getMyAssignments, updateAvailability } from '../../api/volunteerService';
import { getAlerts } from '../../api/alertService';
import { timeAgo, alertTypeConfig } from '../../utils/helpers';
import toast from 'react-hot-toast';

const VolunteerOverview = () => {
  const { user, updateUser } = useAuthStore();

  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ['my-assignments', user?.id],
    queryFn: () => getMyAssignments(user?.id),
    enabled: !!user?.id,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-volunteer'],
    queryFn: () => getAlerts({ target: 'volunteer' }),
    refetchInterval: 30000,
  });

  const isAvailable = user?.is_available ?? true;

  const handleToggleAvailability = async () => {
    const newVal = !isAvailable;
    try {
      await updateAvailability(user?.id, newVal);
      updateUser({ is_available: newVal });
      toast.success(newVal ? '🟢 You are now Available' : '🔴 You are now Unavailable');
    } catch {
      toast.error('Could not update availability.');
    }
  };

  const completed = assignments.filter((a) => a.status === 'completed').length;
  const active    = assignments.filter((a) => a.status === 'in_progress').length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  let totalResponseMs = 0;
  let responseCount = 0;
  let totalAssignmentMs = 0;
  let assignmentCount = 0;

  assignments.forEach((a) => {
    if (a.incident_created_at && a.assigned_at) {
      const diff = new Date(a.assigned_at).getTime() - new Date(a.incident_created_at).getTime();
      if (diff >= 0) {
        totalResponseMs += diff;
        responseCount++;
      }
    }
    if (a.completed_at && a.assigned_at) {
      const diff = new Date(a.completed_at).getTime() - new Date(a.assigned_at).getTime();
      if (diff >= 0) {
        totalAssignmentMs += diff;
        assignmentCount++;
      }
    }
  });

  const avgResponseMin = responseCount > 0 ? (totalResponseMs / responseCount / 60000).toFixed(1) : '--';
  const avgAssignmentHrs = assignmentCount > 0 ? (totalAssignmentMs / assignmentCount / 3600000).toFixed(1) : '--';
  const completionRate = assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : '--';

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Welcome, <span className="gradient-text">{user?.first_name}</span> 🦺
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {user?.skill} · {user?.city}
          </p>
        </div>

        {/* Availability toggle */}
        <button
          onClick={handleToggleAvailability}
          className="flex items-center justify-center gap-3 px-5 py-3 rounded-xl border font-semibold text-sm transition-all duration-300 min-w-[160px]"
          style={{
            background: isAvailable ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: isAvailable ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
            color: isAvailable ? '#4ade80' : '#f87171'
          }}
        >
          <span>{isAvailable ? 'Online' : 'Offline'}</span>
          <div className="relative w-10 h-5 rounded-full transition-colors duration-300"
            style={{ background: isAvailable ? '#22c55e' : '#ef4444' }}>
            <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300"
              style={{ transform: isAvailable ? 'translateX(20px)' : 'translateX(2px)' }} />
          </div>
        </button>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '3rem' }}>
        {assignLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '1.5rem' }}>
            {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 lg:grid-cols-4 stagger" style={{ gap: '2rem' }}>
          <StatCard title="Active Assignments" value={active}     icon={Activity}    accent="warning" subtitle="in progress" />
          <StatCard title="Completed"          value={user?.assignments_completed ?? completed} icon={CheckCircle2} accent="success" trend={5} trendLabel="this month" />
          <StatCard title="Experience"         value={`${user?.experience_years ?? 0}y`} icon={TrendingUp} accent="primary" subtitle={user?.skill} />
          <StatCard title="Live Alerts"        value={unreadAlerts} icon={Zap}       accent="danger"  subtitle="for volunteers" />
          </div>
          </>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3" style={{ gap: '3.5rem' }}>
        {/* Assignments */}
        <div className="xl:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h3 className="text-base font-bold text-white font-display" style={{ marginBottom: '0.75rem' }}>My Assignments</h3>
                <p className="text-xs text-slate-500">Current & recent task assignments</p>
              </div>
              <Link to="/volunteer/assignments" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {assignLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[1,2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
            ) : assignments.length === 0 ? (
              <div className="text-center" style={{ padding: '2.5rem 0' }}>
                <Clipboard className="w-10 h-10 text-slate-700 mx-auto" style={{ marginBottom: '1rem' }} />
                <p className="text-slate-500 text-sm">No assignments yet. Check available incidents to get started.</p>
                <Link to="/volunteer/available" className="btn btn-outline btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  Browse Available Incidents
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {assignments.slice(0, 2).map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: '1.5rem', padding: '2rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }} className="hover:bg-white/[0.04] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      a.status === 'in_progress' ? 'bg-indigo-500/15 border border-indigo-500/25' : 'bg-green-500/10 border border-green-500/20'
                    }`}>
                      {a.status === 'in_progress'
                        ? <Activity className="w-4 h-4 text-indigo-400" />
                        : <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p className="text-sm font-semibold text-slate-200 truncate">{a.incident_title}</p>
                      <div className="flex flex-wrap items-center gap-6">
                        <span className="text-xs text-slate-500 font-mono">{a.incident_id}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-xs text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" />{a.location}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, alignItems: 'center' }}>
                      <Badge.Status value={a.status} className="text-[10px] px-2 py-1" />
                      <span className="text-[10px] text-slate-600">{timeAgo(a.assigned_at)}</span>
                    </div>
                  </div>
                ))}
                              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white font-display">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '1.5rem' }}>
              {[
                { to: '/volunteer/available', label: 'Browse Available Incidents', desc: 'Find incidents to respond to', from: '#6366f1', to2: '#4f46e5', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: Activity },
                { to: '/volunteer/assignments', label: 'My Assignments', desc: 'View all your tasks', from: '#22c55e', to2: '#16a34a', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: Clipboard },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="flex items-start gap-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: a.bg, border: `1px solid ${a.border}`, padding: '1.25rem' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to2})` }}>
                    <a.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{a.label}</p>
                    <p className="text-xs text-slate-500" style={{ marginTop: '0.25rem' }}>{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white font-display">Recent Activity</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignments.slice(0, 3).map((a) => (
                <div key={`${a.id}-activity`} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    a.status === 'completed' ? 'bg-green-500/15 border border-green-500/20' : 'bg-indigo-500/15 border border-indigo-500/25'
                  }`}>
                    {a.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Activity className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">
                      {a.status === 'completed' ? `Completed ${a.incident_title || 'incident'}` : `Accepted ${a.incident_title || 'incident'}`}
                    </p>
                    <p className="text-xs text-slate-500" style={{ marginTop: '0.25rem' }}>
                      {timeAgo(a.status === 'completed' ? a.completed_at : a.assigned_at)}
                    </p>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Volunteer Profile Card & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          {/* Profile card */}
          <div className="card" style={{ borderColor: 'rgba(34,197,94,0.15)', background: 'rgba(34,197,94,0.05)', padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-bold text-white font-display">Performance Stats</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Response Time</span>
                <span className="text-xs font-semibold text-green-400">{avgResponseMin !== '--' ? `${avgResponseMin} min avg` : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Completion Rate</span>
                <span className="text-xs font-semibold text-green-400">{completionRate !== '--' ? `${completionRate}%` : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Avg Assignment</span>
                <span className="text-xs font-semibold text-green-400">{avgAssignmentHrs !== '--' ? `${avgAssignmentHrs} hrs` : '--'}</span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <h3 className="text-base font-bold text-white font-display">Live Alerts</h3>
              </div>
              {alerts.length > 0 && (
                <Link to="/volunteer/alerts" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center" style={{ padding: '2rem 0' }}>No active alerts</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.slice(0, 3).map((alert) => {
                  const cfg = alertTypeConfig(alert.type);
                  return (
                    <div key={alert.id} className="rounded-xl"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '1rem' }}>
                      <p className="text-sm font-semibold text-white" style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '0.5rem'
                      }}>{cfg.icon} {alert.title}</p>
                      <p className="text-xs text-slate-500" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '0.5rem'
                      }}>{alert.message}</p>
                      <p className="text-[10px] text-slate-600">{timeAgo(alert.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerOverview;
