import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeft, MapPin, Clock, TrendingUp, Calendar, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getResourceById } from '../../api/resourceService';
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, formatDateTime } from '../../utils/helpers';

const AdminResourceDetails = () => {
  const { id } = useParams();

  const { data: resource, isLoading } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => getResourceById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <AlertTriangle className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Resource Not Found</h1>
        <p className="text-slate-500 mb-6">The resource you're looking for doesn't exist.</p>
        <Link to="/admin/resources" className="btn btn-primary">
          Back to Resources
        </Link>
      </div>
    );
  }

  const usagePercentage = resource.quantity > 0 
    ? Math.round(((resource.quantity - resource.available) / resource.quantity) * 100) 
    : 0;

  // Calculate correct status based on available quantity
  const calculatedStatus = resource.available === 0 
    ? 'in_use' 
    : resource.available === resource.quantity 
      ? 'available' 
      : 'partially_used';

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/resources" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '3rem' }}>
        {/* Main Content */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Resource Info Card */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <div className="flex items-start justify-between" style={{ marginBottom: '2rem' }}>
              <div className="flex-1">
                <div className="flex items-center gap-3" style={{ marginBottom: '0.75rem' }}>
                  <span className="text-xs font-mono text-slate-600">{resource.id}</span>
                  <Badge.Status value={calculatedStatus} />
                </div>
                <h1 className="text-2xl font-bold text-white font-display" style={{ marginBottom: '0.75rem' }}>{resource.name}</h1>
                <p className="text-slate-400">{resource.type}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1.5rem' }}>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-slate-500" />
                <span className="text-sm">{resource.location || 'Location not specified'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Clock className="w-5 h-5 text-slate-500" />
                <span className="text-sm">Updated {timeAgo(resource.last_updated)}</span>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Usage Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '2rem', marginBottom: '2rem' }}>
              <div className="p-5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">Available</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{resource.available}</p>
                <p className="text-xs text-slate-500 mt-1">{resource.unit}</p>
              </div>
              
              <div className="p-5 rounded-xl" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-slate-400">In Use</span>
                </div>
                <p className="text-3xl font-bold text-orange-400">{resource.quantity - resource.available}</p>
                <p className="text-xs text-slate-500 mt-1">{resource.unit}</p>
              </div>
              
              <div className="p-5 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm text-slate-400">Total</span>
                </div>
                <p className="text-3xl font-bold text-indigo-400">{resource.quantity}</p>
                <p className="text-xs text-slate-500 mt-1">{resource.unit}</p>
              </div>
            </div>

            {/* Usage Bar */}
            <div style={{ marginTop: '1.5rem' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Usage Rate</span>
                <span className="text-sm font-bold text-white">{usagePercentage}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${usagePercentage}%`,
                    background: usagePercentage > 80 ? '#ef4444' : usagePercentage > 50 ? '#f59e0b' : '#22c55e'
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {usagePercentage > 80 
                  ? '⚠️ High usage - consider adding more resources' 
                  : usagePercentage > 50 
                    ? 'Moderate usage' 
                    : '✓ Good availability'}
              </p>
            </div>
          </div>

          {/* Monthly Usage Bar Chart */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white font-display">Monthly Usage Analytics</h3>
            </div>
            
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { month: 'Dec', used: 45, returned: 38 },
                    { month: 'Nov', used: 52, returned: 48 },
                    { month: 'Oct', used: 38, returned: 35 },
                    { month: 'Sep', used: 42, returned: 40 },
                    { month: 'Aug', used: 35, returned: 33 },
                    { month: 'Jul', used: 48, returned: 45 },
                  ]}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Bar 
                    dataKey="used" 
                    name="Used" 
                    fill="#f97316" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar 
                    dataKey="returned" 
                    name="Returned" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                <p className="text-xs text-slate-400">Total Used (6 months)</p>
                <p className="text-xl font-bold text-orange-400">260 {resource.unit}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-xs text-slate-400">Total Returned (6 months)</p>
                <p className="text-xl font-bold text-green-400">239 {resource.unit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Quick Actions */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/admin/resources" className="btn btn-outline w-full">
                Manage All Resources
              </Link>
            </div>
          </div>

          {/* Resource Timeline */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '2rem' }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2"></div>
                <div>
                  <p className="text-sm text-white">Resource Added</p>
                  <p className="text-xs text-slate-500">{formatDateTime(resource.created_at || resource.last_updated)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                <div>
                  <p className="text-sm text-white">Last Updated</p>
                  <p className="text-xs text-slate-500">{formatDateTime(resource.last_updated)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card" style={{ padding: '2.5rem' }}>
            <h3 className="text-lg font-bold text-white font-display" style={{ marginBottom: '1.5rem' }}>Quick Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Resource ID</span>
                <span className="text-sm font-mono text-slate-300">{resource.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Type</span>
                <span className="text-sm text-slate-300">{resource.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Status</span>
                <Badge.Status value={calculatedStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Location</span>
                <span className="text-sm text-slate-300 truncate max-w-[150px]">{resource.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResourceDetails;
