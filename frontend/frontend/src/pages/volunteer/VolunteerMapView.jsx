import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Sliders, AlertTriangle, RefreshCw } from 'lucide-react';
import { getIncidents } from '../../api/incidentService';
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, severityColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

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

const VolunteerMapView = () => {
  const [mapCenter, setMapCenter] = useState(null);
  const [radius, setRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setMapCenter(DEFAULT_POS);
      setLocationLoaded(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoaded(true);
      },
      () => {
        setMapCenter(DEFAULT_POS);
        setLocationLoaded(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const { data: incidents, isLoading, refetch } = useQuery({
    queryKey: ['volunteer-map-incidents', mapCenter, radius, severityFilter, statusFilter],
    queryFn: () => getIncidents({
      lat: mapCenter?.lat || DEFAULT_POS.lat,
      lng: mapCenter?.lng || DEFAULT_POS.lng,
      radius,
      severity: severityFilter || undefined,
      status: statusFilter || undefined,
    }),
    enabled: !!locationLoaded,
    refetchInterval: 30000,
  });

  const filteredIncidents = incidents?.data || [];

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(newPos);
          toast.success('Location updated');
        },
        (err) => toast.error('Could not get your location')
      );
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '1rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap" style={{ gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 className="text-2xl font-bold text-white font-display">Incident Map</h1>
          <p className="text-slate-500 text-sm">
            {filteredIncidents.length} incidents within {radius}km
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLocateMe}
            className="btn btn-ghost btn-sm"
            title="Center on my location"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost btn-sm"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => refetch()}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card flex flex-col sm:flex-row gap-4" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Radius:</label>
            <select
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="input-base sm:w-24"
            >
              <option value={3}>3km</option>
              <option value={5}>5km</option>
              <option value={10}>10km</option>
              <option value={20}>20km</option>
            </select>
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="input-base sm:w-32"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-base sm:w-32"
          >
            <option value="">All Status</option>
            <option value="reported">Reported</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      )}

      {/* Map */}
      <div className="card p-0 overflow-hidden" style={{ height: '600px' }}>
        {!locationLoaded || isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
          </div>
        ) : (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapUpdater center={mapCenter} />
            
            {/* Radius circle */}
            <Circle
              center={[mapCenter.lat, mapCenter.lng]}
              radius={radius * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
              }}
            />

            {/* Incident markers */}
            {filteredIncidents.map(incident => (
              <Marker
                key={incident.id}
                position={[incident.location.lat, incident.location.lng]}
                icon={SEVERITY_ICONS[incident.severity]}
              >
                <Popup>
                  <div style={{ minWidth: '220px', padding: '0.5rem' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm">{incident.title}</span>
                      <Badge.Status value={incident.severity} />
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">{incident.description}</p>
                    <div className="flex items-center justify-between text-xs" style={{ gap: '1rem' }}>
                      <span>{timeAgo(incident.created_at)}</span>
                      <Link
                        to={`/volunteer/incidents/${incident.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default VolunteerMapView;
