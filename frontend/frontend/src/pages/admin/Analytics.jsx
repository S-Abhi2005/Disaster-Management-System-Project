import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, Users, Package, TrendingUp, MapPin } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Analytics = () => {
  const [data, setData] = useState({
    incidents: null,
    volunteers: null,
    resources: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const [incidentsRes, volunteersRes, resourcesRes] = await Promise.all([
          axiosInstance.get('/analytics/incidents'),
          axiosInstance.get('/analytics/volunteers'),
          axiosInstance.get('/analytics/resources')
        ]);
        
        setData({
          incidents: incidentsRes,
          volunteers: volunteersRes,
          resources: resourcesRes
        });
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-white text-center">Loading Analytics...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">{error}</div>;
  }

  const { incidents, volunteers, resources } = data;

  // Format data for charts
  const incidentStatusData = Object.entries(incidents?.by_status || {}).map(([status, count]) => ({
    name: status,
    count: count,
  }));

  const COLORS = ['#6366f1', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'];

  const resourceStatusData = [
    { name: 'Available', value: resources?.available_resources || 0, color: '#22c55e' },
    { name: 'In Use', value: resources?.in_use_resources || 0, color: '#f97316' }
  ];

  const volunteerStatusData = [
    { name: 'Active', value: volunteers?.active_volunteers || 0, color: '#22c55e' },
    { name: 'Inactive', value: volunteers?.inactive_volunteers || 0, color: '#64748b' }
  ];

  return (
    <div style={{ padding: '1rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-2xl font-bold text-white font-display">Analytics Dashboard</h1>
        <p className="text-slate-500 text-sm mt-2">Real-time insights and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card bg-slate-800/50 border border-slate-700/50 rounded-xl" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm text-slate-400">Total Incidents</span>
          </div>
          <p className="text-2xl font-bold text-white">{incidents?.total_incidents || 0}</p>
        </div>

        <div className="card bg-slate-800/50 border border-slate-700/50 rounded-xl" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Total Volunteers</span>
          </div>
          <p className="text-2xl font-bold text-white">{volunteers?.total_volunteers || 0}</p>
        </div>

        <div className="card bg-slate-800/50 border border-slate-700/50 rounded-xl" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-sm text-slate-400">Total Resources</span>
          </div>
          <p className="text-2xl font-bold text-white">{resources?.total_resources || 0}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Incident Status Chart */}
        <div className="card bg-slate-800/50 border border-slate-700/50 rounded-xl" style={{ padding: '2rem' }}>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-display">Incidents By Status</h3>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="count" name="Incidents" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {incidentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volunteers Status Chart */}
        <div className="card bg-slate-800/50 border border-slate-700/50 rounded-xl" style={{ padding: '2rem' }}>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white font-display">Volunteers Status</h3>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={volunteerStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {volunteerStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
        {/* Resources Status Pie Chart */}
        <div className="card bg-slate-800/50 border border-slate-700/50 rounded-xl" style={{ padding: '2rem' }}>
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold text-white font-display">Resources Usage</h3>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resourceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
