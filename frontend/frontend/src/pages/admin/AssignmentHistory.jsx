import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, MapPin, Clock, User, Truck, Search, X, ChevronLeft, ChevronRight, Activity, CheckCircle2 } from 'lucide-react';
import { getIncidents } from '../../api/incidentService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/EmptyState';
import { timeAgo, formatDateTime, severityColor } from '../../utils/helpers';

const AssignmentHistory = () => {
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [page,     setPage]     = useState(1);
  const LIMIT = 10;

  // Paginated query for the table
  const { data, isLoading } = useQuery({
    queryKey: ['history-incidents', status, page],
    queryFn: () => getIncidents({ status: status || undefined, page, limit: LIMIT }),
  });

  // Separate query for all-time stats (no pagination)
  const { data: statsData } = useQuery({
    queryKey: ['history-stats'],
    queryFn: () => getIncidents({ limit: 100 }),
    staleTime: 60000,
  });

  const allIncidentsForStats = statsData?.data || [];
  const allIncidents = data?.data || [];

  // Filter table rows to only assigned/active/resolved
  const history = allIncidents.filter(inc =>
    inc.assigned_volunteer || inc.status === 'resolved' || inc.status === 'active'

  ).filter(inc =>
    !search ||
    inc.title.toLowerCase().includes(search.toLowerCase()) ||
    inc.id.toLowerCase().includes(search.toLowerCase()) ||
    inc.assigned_volunteer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = data?.pages || 1;

  const StatusIcon = ({ status }) => {
    if (status === 'resolved') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === 'active')   return <Activity className="w-4 h-4 text-cyan-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="space-y-5 animate-fade-in-up pb-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Assignment History</h1>
        <p className="text-slate-500 text-sm mt-1">All incident-to-volunteer assignment records</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
        {[
          {
            label: 'Total Assigned',
            value: allIncidentsForStats.filter(i => i.assigned_volunteer).length,
            color: '#818cf8',
          },
          {
            label: 'Resolved',
            value: allIncidentsForStats.filter(i => i.status === 'resolved').length,
            color: '#4ade80',
          },
          {
            label: 'In Progress',
            value: allIncidentsForStats.filter(i => i.status === 'active').length,
            color: '#22d3ee',
          },
        ].map(s => (
          <div key={s.label} className="card card-sm text-center">
            <p className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card card-sm flex flex-col sm:flex-row" style={{ gap: '1rem' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search by incident, ID, or volunteer…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-base pl-9" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-base sm:w-40">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="pending">Pending</option>
        </select>
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus(''); }} className="btn btn-ghost btn-sm shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? <SkeletonTable rows={8} /> : history.length === 0 ? (
        <EmptyState icon={History} title="No assignment records"
          description={search || status ? 'No records match your filters.' : 'Assignment history will appear here.'} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Volunteer</th>
                <th>Skill</th>
                <th>Location</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {history.map(inc => {
                const sev = severityColor(inc.severity);
                return (
                  <tr key={inc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={inc.status} />
                        <div>
                          <p className="text-sm font-semibold text-slate-200 max-w-[160px] truncate">{inc.title}</p>
                          <p className="text-xs text-slate-600 font-mono">{inc.id}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-xs text-slate-400">{inc.type}</span></td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${sev.text} ${sev.bg} ${sev.border}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      {inc.assigned_volunteer
                        ? (
                          <div className="flex items-center gap-1.5">
                            <div className="avatar text-white" style={{
                              width: 24, height: 24, borderRadius: 6, fontSize: '0.55rem',
                              background: 'linear-gradient(135deg,#22c55e,#16a34a)'
                            }}>
                              {inc.assigned_volunteer.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <span className="text-xs text-slate-300 font-medium">{inc.assigned_volunteer.name}</span>
                          </div>
                        )
                        : <span className="text-xs text-slate-600">—</span>
                      }
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">{inc.assigned_volunteer?.skill || '—'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{inc.location?.address}</span>
                      </div>
                    </td>
                    <td><Badge.Status value={inc.status} /></td>
                    <td><span className="text-xs text-slate-500">{timeAgo(inc.created_at)}</span></td>
                    <td><span className="text-xs text-slate-500">{timeAgo(inc.updated_at)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn btn-ghost btn-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({length: totalPages}, (_,i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`btn btn-sm ${p===page ? 'btn-primary' : 'btn-ghost'}`}
                style={{minWidth:'2rem',padding:'0 0.5rem'}}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="btn btn-ghost btn-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentHistory;
