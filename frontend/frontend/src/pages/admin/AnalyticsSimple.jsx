import React from 'react';
import { Activity, AlertTriangle, Users, Package, TrendingUp } from 'lucide-react';

const Analytics = () => {
  return (
    <div style={{ padding: '1rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-2xl font-bold text-white font-display">Analytics Dashboard</h1>
        <p className="text-slate-500 text-sm mt-2">Comprehensive insights and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-slate-400">Total Incidents</span>
          </div>
          <p className="text-2xl font-bold text-white">303</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Active Volunteers</span>
          </div>
          <p className="text-2xl font-bold text-white">84</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-slate-400">Resources Used</span>
          </div>
          <p className="text-2xl font-bold text-white">633</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">Response Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">94%</p>
        </div>
      </div>

      <p className="text-slate-400">Charts loading...</p>
    </div>
  );
};

export default Analytics;
