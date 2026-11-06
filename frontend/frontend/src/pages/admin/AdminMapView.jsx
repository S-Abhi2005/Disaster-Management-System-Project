import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCw, Filter, MapPin, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { getIncidents } from '../../api/incidentService';
import { getVolunteers } from '../../api/volunteerService';
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, severityColor } from '../../utils/helpers';

/* ── Fix Leaflet icons ─────────────────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makePin = (color, size = 30) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid rgba(255,255,255,0.9);
    transform:rotate(-45deg);
    box-shadow:0 3px 14px ${color}88;
  "></div>`,
  iconSize:   [size, size],
  iconAnchor: [size/2, size],
  popupAnchor:[0, -size],
});

const INCIDENT_PINS = {
  critical: makePin('#f43f5e'),
  high:     makePin('#f97316'),
  medium:   makePin('#facc15'),
  low:      makePin('#4ade80'),
};

const VOLUNTEER_PIN = makePin('#818cf8', 22);
const ADMIN_PIN = makePin('#4ade80');

// Default center: Yadgir, Karnataka
const DEFAULT_CENTER = [16.7666, 77.1376];
const DEFAULT_ZOOM = 13;

/* ── Legend item ───────────────────────────────────────────────────────────── */
const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2 text-xs text-slate-400">
    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
    {label}
  </div>
);

/* ── Side panel stat ───────────────────────────────────────────────────────── */
const MapStat = ({ value, label, color }) => (
  <div className="text-center">
    <p className="text-xl font-bold font-display" style={{ color }}>{value}</p>
    <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
  </div>
);

const AdminMapView = () => {
  const [showVolunteers, setShowVolunteers] = useState(false);
  const [statusFilter,   setStatus]        = useState('');
  const [selected,       setSelected]      = useState(null);

  const { data: incData,  isLoading: incLoading,  refetch: refetchInc  } = useQuery({
    queryKey: ['admin-map-incidents', statusFilter],
    queryFn:  () => getIncidents({ status: statusFilter || undefined, limit: 100 }),
    refetchInterval: 60000,
  });

  const { data: volData, isLoading: volLoading } = useQuery({
    queryKey: ['admin-map-volunteers'],
    queryFn:  () => getVolunteers({ limit: 100 }),
    enabled:  showVolunteers,
  });

  const incidents  = incData?.data  || [];
  const volunteers = volData?.data  || [];
  const isLoading  = incLoading || (showVolunteers && volLoading);

  // Map markers — only incidents with valid coordinates
  const validIncidents = incidents.filter(i => i.location?.lat && i.location?.lng);

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Map View</h1>
          <p className="text-slate-500 text-sm mt-1">
            {validIncidents.length} incidents plotted · Map View
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetchInc()} className="btn btn-ghost btn-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card card-sm flex flex-wrap items-center" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'active', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`filter-pill capitalize ${statusFilter === s ? 'filter-pill-active' : ''}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Volunteer toggle */}
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showVolunteers}
            onChange={e => setShowVolunteers(e.target.checked)}
            className="sr-only"
          />
          <div className="relative">
            <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${showVolunteers ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${showVolunteers ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs text-slate-400 font-medium">Show Volunteers</span>
        </label>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 ml-0">
          <LegendItem color="#f43f5e" label="Critical" />
          <LegendItem color="#f97316" label="High" />
          <LegendItem color="#facc15" label="Medium" />
          <LegendItem color="#4ade80" label="Low / Resolved" />
          {showVolunteers && <LegendItem color="#818cf8" label="Volunteer" />}
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-white/[0.08]"
          style={{ height: 520 }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center" style={{ background: '#0c1220' }}>
              <Spinner size="lg" />
            </div>
          ) : (
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Admin / Default Location marker */}
              <Marker position={DEFAULT_CENTER} icon={ADMIN_PIN}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <p className="font-bold text-sm text-gray-900 mb-1">Admin Location</p>
                    <p className="text-xs text-gray-500 mb-2">Yadgir, Karnataka</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                        style={{ background: '#ecfdf5', color: '#059669' }}>
                        Admin Center
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Incident markers */}
              {validIncidents.map(inc => (
                <Marker
                  key={inc.id}
                  position={[inc.location.lat, inc.location.lng]}
                  icon={
                    inc.status === 'resolved'
                      ? INCIDENT_PINS.low
                      : INCIDENT_PINS[inc.severity] || INCIDENT_PINS.medium
                  }
                  eventHandlers={{ click: () => setSelected(inc) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <p className="font-bold text-sm text-gray-900 mb-1">{inc.title}</p>
                      <p className="text-xs text-gray-500 mb-2">{inc.location.address}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                          style={{
                            background: inc.severity === 'critical' ? '#fef2f2' : '#fef9c3',
                            color: inc.severity === 'critical' ? '#dc2626' : '#854d0e'
                          }}>
                          {inc.severity}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                          {inc.status}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Volunteer markers (mocked coordinates near default center) */}
              {showVolunteers && volunteers.map((v, i) => {
                const lat = DEFAULT_CENTER[0] + (Math.sin(i * 1.7) * 0.04);
                const lng = DEFAULT_CENTER[1] + (Math.cos(i * 1.3) * 0.05);
                return (
                  <Marker key={v.id} position={[lat, lng]} icon={VOLUNTEER_PIN}>
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        <p className="font-bold text-sm text-gray-900">{v.first_name} {v.last_name}</p>
                        <p className="text-xs text-gray-500">{v.skill}</p>
                        <p className={`text-xs font-bold mt-1 ${v.is_available ? 'text-green-600' : 'text-red-500'}`}>
                          {v.is_available ? '● Available' : '● Unavailable'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Stats */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Map Stats</p>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <MapStat value={incidents.filter(i=>i.severity==='critical').length} label="Critical" color="#f43f5e" />
              <MapStat value={incidents.filter(i=>i.status==='active').length}     label="Active"   color="#22d3ee" />
              <MapStat value={incidents.filter(i=>i.status==='resolved').length}   label="Resolved" color="#4ade80" />
              <MapStat value={incidents.filter(i=>i.status==='pending').length}    label="Pending"  color="#facc15" />
            </div>
          </div>

          {/* Selected incident */}
          {selected ? (
            <div className="card" style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)', padding: '1.5rem', marginBottom: '2rem' }}>
              <div className="flex items-start justify-between gap-2 mb-4">
                <p className="text-sm font-bold text-white font-display leading-tight">{selected.title}</p>
                <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-white shrink-0">×</button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3" />{selected.location?.address}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{selected.description}</p>
              <div className="flex items-center gap-2 mb-4">
                <Badge.Status value={selected.status} />
                <span className="text-xs text-slate-600">{timeAgo(selected.created_at)}</span>
              </div>
              {selected.assigned_volunteer && (
                <p className="text-xs text-green-400">
                  👤 {selected.assigned_volunteer.name}
                </p>
              )}
            </div>
          ) : (
            <div className="card" style={{ borderColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', marginBottom: '2rem' }}>
              <p className="text-xs text-slate-600 text-center py-6">Click a marker to view details</p>
            </div>
          )}

          {/* Recent list */}
          <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Incidents</p>
            <div className="space-y-4 mb-4">
              {incidents.slice(0, 3).map(inc => {
                const sev = severityColor(inc.severity);
                return (
                  <button key={inc.id} onClick={() => setSelected(inc)}
                    className="w-full flex items-center gap-3 text-left hover:bg-white/[0.02] rounded-lg p-3 transition-colors">
                    <span className="w-1.5 h-6 rounded-full shrink-0"
                      style={{ background: inc.severity === 'critical' ? '#f43f5e' : inc.severity === 'high' ? '#f97316' : '#facc15' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate">{inc.title}</p>
                      <p className="text-[10px] text-slate-600">{timeAgo(inc.created_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {incidents.length > 3 && (
              <Link to="/admin/incidents" className="btn btn-outline btn-sm w-full">
                View All ({incidents.length})
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMapView;
