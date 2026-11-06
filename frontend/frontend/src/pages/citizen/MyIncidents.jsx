import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search, Filter, AlertTriangle, MapPin, Clock,
  ChevronLeft, ChevronRight, SlidersHorizontal, X,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getMyIncidents, INCIDENT_TYPES } from '../../api/incidentService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/EmptyState';
import { timeAgo, severityColor } from '../../utils/helpers';

const STATUSES = ['pending', 'active', 'resolved', 'closed'];

const MyIncidents = () => {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]       = useState(1);
  const LIMIT = 8;

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-incidents', user?.id, statusFilter, page],
    queryFn: () => getMyIncidents(user?.id, { status: statusFilter || undefined, page, limit: LIMIT }),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  if (error) {
    console.error('MyIncidents query error:', error);
  }

  const incidents = (data?.data || []).filter((i) =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = data?.pages || 1;

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">My Incidents</h1>
          <p className="text-slate-500 text-sm mt-2">
            {data?.total ?? '…'} total incidents reported
          </p>
        </div>
        <Link to="/citizen/report" className="btn btn-primary btn-sm" style={{ marginRight: '1rem' }}>
          <AlertTriangle className="w-4 h-4" />
          Report New
        </Link>
      </div>

      {/* Filters */}
      <div className="card card-sm flex flex-col sm:flex-row" style={{ gap: '1rem' }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatus(''); setPage(1); }}
            className={`filter-pill ${!statusFilter ? 'filter-pill-active' : ''}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`filter-pill capitalize ${statusFilter === s ? 'filter-pill-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={search || statusFilter ? 'No results found' : 'No incidents yet'}
          description={search || statusFilter ? 'Try adjusting your filters.' : "You haven't reported any incidents yet."}
          action={
            !search && !statusFilter && (
              <Link to="/citizen/report" className="btn btn-primary btn-sm">Report first incident</Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: '2rem', marginTop: '2rem' }}>
          {incidents.map((inc) => {
            const sev = severityColor(inc.severity);
            return (
              <Link key={inc.id} to={`/citizen/incidents/${inc.id}`} 
                className="card hover:border-indigo-500/20 transition-all hover:translate-y-[-2px] duration-200"
                style={{ padding: '1.5rem' }}>
                <div className="flex items-start justify-between" style={{ marginBottom: '1rem' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 text-sm truncate">{inc.title}</p>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{inc.id}</p>
                  </div>
                  <Badge.Status value={inc.status} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-sm text-slate-400">{inc.type}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-sm text-slate-400 truncate">{inc.location?.address}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${sev.text} ${sev.bg} border ${sev.border}`}>
                      {inc.severity}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-4 h-4 shrink-0" />
                      {timeAgo(inc.created_at)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {data?.total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-ghost btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                style={{ minWidth: '2rem', padding: '0 0.5rem' }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-ghost btn-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyIncidents;
