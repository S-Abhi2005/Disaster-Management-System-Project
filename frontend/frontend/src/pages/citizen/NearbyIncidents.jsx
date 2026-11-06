import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Sliders, AlertTriangle, RefreshCw } from 'lucide-react';
import { getNearbyIncidents } from '../../api/incidentService';
// Real browser geolocation API used instead of mock
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, severityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid white;
    transform:rotate(-45deg);
    box-shadow:0 2px 12px ${color}88;
  "></div>`,
  iconSize:   [28, 28],
  iconAnchor: [14, 28],
  popupAnchor:[0, -28],
});

const SEVERITY_ICONS = {
  critical: makeIcon('#f43f5e'),
  high:     makeIcon('#f97316'),
  medium:   makeIcon('#facc15'),
  low:      makeIcon('#4ade80'),
};

const DEFAULT_POS = { lat: 19.076, lng: 72.877 }; // Mumbai

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo([center.lat, center.lng], 13, { duration: 1 }); }, [center]);
  return null;
};

const NearbyIncidents = () => {
  const user = useAuthStore((s) => s.user);
  const [center, setCenter]   = useState(null);
  const [radius, setRadius]   = useState(10);  // km
  const [locating, setLocating] = useState(true);
  const [selected, setSelected] = useState(null);

  // Auto-fetch user location on component mount
  useEffect(() => {
    fetchGPS();
  }, []);

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['nearby', center?.lat, center?.lng, radius],
    queryFn: () => getNearbyIncidents(center.lat, center.lng, radius),
    enabled: !!center, // Only run when we have real location
  });

  const fetchGPS = async () => {
    setLocating(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter({ lat: latitude, lng: longitude });
        toast.success('Location updated!');
        setLocating(false);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve your location.';
        if (error.code === 1) errorMsg = 'Location permission denied. Please enable location access.';
        if (error.code === 2) errorMsg = 'Location unavailable. Please try again.';
        if (error.code === 3) errorMsg = 'Location request timed out. Please try again.';
        toast.error(errorMsg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Nearby Incidents</h1>
          <p className="text-slate-500 text-sm mt-2">
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''} within {radius}km of you
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchGPS} disabled={locating} className="btn btn-outline btn-sm">
            {locating ? <Spinner size="sm" /> : <Navigation className="w-4 h-4" />}
            {locating ? 'Locating…' : 'My Location'}
          </button>
          <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card card-sm" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
            <Sliders className="w-4 h-4" />
            <span className="font-medium">Search radius:</span>
            <span className="font-bold text-indigo-400">{radius} km</span>
          </div>
          <input
            type="range" min={1} max={50} step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="flex-1 accent-indigo-500 min-w-[120px]"
          />
          {/* Legend */}
          <div className="flex flex-wrap gap-3 ml-auto">
            {[
              { label: 'Critical', color: '#f43f5e' },
              { label: 'High',     color: '#f97316' },
              { label: 'Medium',   color: '#facc15' },
              { label: 'Low',      color: '#4ade80' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/[0.07]" style={{ height: 480 }}>
          {locating || !center ? (
            <div className="flex items-center justify-center h-full bg-slate-900/50">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Getting your location...</p>
                <p className="text-slate-500 text-sm mt-2">Please enable location access</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
            <MapUpdater center={center} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* User location marker */}
            <Marker position={[center.lat, center.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="
                  width:14px;height:14px;border-radius:50%;
                  background:#6366f1;border:3px solid white;
                  box-shadow:0 0 0 6px rgba(99,102,241,0.25);
                "></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              })}
            >
              <Popup><div className="text-slate-900 font-semibold text-sm">📍 You are here</div></Popup>
            </Marker>

            {/* Radius circle */}
            <Circle
              center={[center.lat, center.lng]}
              radius={radius * 1000}
              pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.04, weight: 1 }}
            />

            {/* Incident markers */}
            {incidents.map((inc) => (
              <Marker
                key={inc.id}
                position={[inc.location.lat, inc.location.lng]}
                icon={SEVERITY_ICONS[inc.severity] || SEVERITY_ICONS.medium}
                eventHandlers={{ click: () => setSelected(inc) }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }} className="text-white">
                    <p className="font-bold text-sm mb-1">{inc.title}</p>
                    <p className="text-xs text-slate-400 mb-2">{inc.location.address}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                        style={{ background: severityColor(inc.severity).bg?.replace('bg-', ''), color: '#fff' }}>
                        {inc.severity}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          )}
        </div>

        {/* Sidebar list */}
        <div className="overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 480 }}>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No incidents found within {radius}km. Try increasing the radius.
            </div>
          ) : (
            incidents.map((inc) => {
              const sev = severityColor(inc.severity);
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelected(inc)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selected?.id === inc.id
                      ? 'border-indigo-500/40 bg-indigo-500/[0.08]'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-200 leading-tight">{inc.title}</p>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${sev.text} ${sev.bg} ${sev.border}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" />{inc.location.address}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge.Status value={inc.status} />
                    <span className="text-[10px] text-slate-600">{timeAgo(inc.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected incident detail */}
      {selected && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-white font-display text-base">{selected.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.location.address}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge.Status value={selected.status} />
              <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-white transition-colors">✕</button>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{selected.description}</p>
          <Link to={`/citizen/incidents/${selected.id}`} className="btn btn-outline btn-sm">
            View Full Details →
          </Link>
        </div>
      )}
    </div>
  );
};

export default NearbyIncidents;
