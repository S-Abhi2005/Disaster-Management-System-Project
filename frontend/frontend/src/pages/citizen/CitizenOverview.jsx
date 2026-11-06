import React from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, MapPin, Bell,
  ArrowRight, ShieldAlert, Activity, Navigation, Zap,
  TrendingUp, FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { SkeletonCard } from '../../components/ui/EmptyState';
import { getMyIncidents } from '../../api/incidentService';
import { getAlerts } from '../../api/alertService';
import { timeAgo, alertTypeConfig } from '../../utils/helpers';

const CitizenOverview = () => {
  const user = useAuthStore((s) => s.user);

  const address = user?.address;
  const showAddress = address && !String(address).toLowerCase().startsWith('mock location');

  const { data: incData, isLoading: incLoading } = useQuery({
    queryKey: ['my-incidents', user?.id],
    queryFn: () => getMyIncidents(user?.id),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const { data: alerts = [], isLoading: alertLoading } = useQuery({
    queryKey: ['alerts-citizen'],
    queryFn: () => getAlerts({ target: 'citizen' }),
  });

  const incidents  = incData?.data || [];
  const total      = incData?.total || 0;
  const active     = incidents.filter((i) => i.status === 'active' || i.status === 'pending').length;
  const resolved   = incidents.filter((i) => i.status === 'resolved').length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* ── Welcome header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Welcome back, <span className="gradient-text">{user?.first_name || 'Citizen'}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-2">Stay informed and safe. Here's your emergency overview.</p>
        </div>
        <Link to="/citizen/report"
          className="btn btn-primary shrink-0"
          style={{ marginRight: '1rem' }}
        >
          <AlertTriangle className="w-4 h-4" />
          Report Incident
        </Link>
      </div>

      {/* ── Stats ── */}
      <div style={{ marginBottom: '3rem' }}>
        {incLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 stagger">
            <StatCard title="My Incidents"    value={total}        icon={FileText}      accent="primary"   subtitle="total reported" />
            <StatCard title="Active / Pending" value={active}      icon={Activity}      accent="warning"   subtitle="needs attention" />
            <StatCard title="Resolved"         value={resolved}    icon={CheckCircle2}  accent="success"   subtitle="successfully closed" />
            <StatCard title="Live Alerts"      value={unreadAlerts} icon={Bell}         accent="danger"    dot subtitle="in your area" />
          </div>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" style={{ gap: '2.5rem' }}>

        {/* Left – Recent incidents */}
        <div className="xl:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white font-display">My Recent Reports</h3>
                <p className="text-xs text-slate-500 mt-1">Track status of incidents you've reported</p>
              </div>
              <Link to="/citizen/incidents" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {incLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1,2,3].map((i) => (
                  <div key={i} className="flex gap-3 items-center" style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="skeleton w-9 h-9 rounded-lg shrink-0" />
                    <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="skeleton h-3.5 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem 0' }}>
                <FileText className="w-10 h-10 text-slate-700 mx-auto" style={{ marginBottom: '1rem' }} />
                <p className="text-slate-500 text-sm">No incidents reported yet.</p>
                <Link to="/citizen/report" className="btn btn-outline btn-sm" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                  Report your first incident
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {incidents.slice(0, 4).map((inc) => (
                  <Link
                    key={inc.id}
                    to={`/citizen/incidents/${inc.id}`}
                    className="flex items-center gap-4 group"
                    style={{ 
                      padding: '1rem 0.75rem',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '0.5rem',
                      margin: '0 -0.75rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      inc.status === 'resolved'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-orange-500/10 border border-orange-500/20'
                    }`}>
                      {inc.status === 'resolved'
                        ? <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
                        : <AlertTriangle className="w-4.5 h-4.5 text-orange-400" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors" style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{inc.title}</p>
                      <div className="flex items-center gap-2" style={{ marginTop: '0.25rem' }}>
                        <span className="text-xs text-slate-500 font-mono">{inc.id}</span>
                        <span className="text-slate-700">·</span>
                        <div className="flex items-center gap-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="text-xs text-slate-500" style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>{inc.location?.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge.Status value={inc.status} />
                      <span className="text-xs text-slate-600">{timeAgo(inc.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white font-display">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '1.5rem' }}>
              {[
                {
                  to: '/citizen/report', icon: ShieldAlert,
                  title: 'Report Emergency', desc: 'Submit a new hazardous incident',
                  from: '#6366f1', to2: '#4f46e5', light: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)',
                },
                {
                  to: '/citizen/nearby', icon: Navigation,
                  title: 'Nearby Map', desc: 'View incidents near you on a map',
                  from: '#06b6d4', to2: '#0891b2', light: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)',
                },
                {
                  to: '/citizen/alerts', icon: Bell,
                  title: 'Live Alerts', desc: 'Check active safety alerts',
                  from: '#f43f5e', to2: '#e11d48', light: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)',
                },
                {
                  to: '/citizen/incidents', icon: TrendingUp,
                  title: 'My History', desc: 'View all reported incidents',
                  from: '#22c55e', to2: '#16a34a', light: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)',
                },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-start gap-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-100 cursor-pointer"
                  style={{ background: action.light, border: `1px solid ${action.border}`, padding: '1.25rem' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${action.from}, ${action.to2})`, opacity: 0.85 }}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{action.title}</p>
                    <p className="text-xs text-slate-500" style={{ marginTop: '0.25rem' }}>{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right – Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <h3 className="text-base font-bold text-white font-display">Live Alerts</h3>
              </div>
              <Link to="/citizen/alerts" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View all</Link>
            </div>

            {alertLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1,2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center" style={{ padding: '2rem 0' }}>No active alerts</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.slice(0, 4).map((alert) => {
                  const cfg = alertTypeConfig(alert.type);
                  return (
                    <div key={alert.id} className="rounded-xl relative overflow-hidden"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '1rem' }}>
                      <div className="flex items-start justify-between gap-3" style={{ marginBottom: '0.5rem' }}>
                        <div className="flex items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                          <span className="text-sm shrink-0">{cfg.icon}</span>
                          <p className="text-sm font-semibold text-white" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</p>
                        </div>
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" style={{ marginTop: '0.25rem' }} />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed" style={{ 
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

          {/* Location */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.15)', padding: '1.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <MapPin className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-display">Your Location</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p className="text-sm text-slate-300 font-medium">{user?.city || 'Location not set'}</p>
              <p className="text-xs text-slate-500">{showAddress ? address : 'Update your profile location'}</p>
            </div>
            <div className="flex" style={{ gap: '0.5rem', marginTop: '1rem' }}>
              <Link to="/citizen/profile" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Update location
              </Link>
              <span className="text-xs text-slate-600">·</span>
              <Link to="/citizen/nearby" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View nearby
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenOverview;
