import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Check, Trash2, RefreshCw } from 'lucide-react';
import { getAlerts, markAlertRead, deleteAlert } from '../../api/alertService';
import { alertTypeConfig, timeAgo } from '../../utils/helpers';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const CitizenAlerts = () => {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['alerts-all'],
    queryFn: () => getAlerts({ target: 'citizen' }),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts-all'] }),
  });

  const remove = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts-all'] });
      toast.success('Alert dismissed.');
    },
  });

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Alerts</h1>
          <p className="text-slate-500 text-sm mt-2">
            {unread > 0 ? `${unread} unread alerts` : 'All alerts read'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unread > 0 && (
            <button onClick={() => alerts.filter((a) => !a.read).forEach((a) => markRead.mutate(a.id))}
              className="btn btn-ghost btn-sm">
              <Check className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button onClick={() => refetch()} className="btn btn-ghost btn-sm" style={{ marginRight: '1rem' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={BellOff} title="No alerts" description="You have no alerts at the moment." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {alerts.map((alert) => {
            const cfg = alertTypeConfig(alert.type);
            return (
              <div
                key={alert.id}
                onClick={() => !alert.read && markRead.mutate(alert.id)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  !alert.read ? 'hover:scale-[1.005]' : 'opacity-70'
                }`}
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                {/* Unread dot */}
                {!alert.read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                )}

                <div className="flex items-start gap-3 pr-8">
                  <span className="text-xl shrink-0 mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-bold text-white font-display">{alert.title}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: `${cfg.border}44` }}>
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-slate-600">{timeAgo(alert.timestamp)}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-600">Sent by {alert.sent_by}</span>
                      {alert.read && <span className="text-xs text-green-500">✓ Read</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); remove.mutate(alert.id); }}
                  className="absolute bottom-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitizenAlerts;
