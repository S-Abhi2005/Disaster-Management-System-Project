import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle, X, MapPin } from 'lucide-react';
import { getAlerts, markAlertRead } from '../../api/alertService';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/EmptyState';
import { timeAgo, alertTypeConfig } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Alerts = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts-volunteer'],
    queryFn: () => getAlerts({ target: 'volunteer' }),
    refetchInterval: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: (alertId) => markAlertRead(alertId),
    onSuccess: () => {
      toast.success('Marked as read');
      qc.invalidateQueries({ queryKey: ['alerts-volunteer'] });
    },
    onError: () => {
      toast.error('Could not mark as read');
    },
  });

  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  const AlertCard = ({ alert }) => {
    const type = alertTypeConfig(alert.type);
    return (
      <div className="card hover:border-indigo-500/15 transition-all duration-200" style={{ padding: '1.5rem' }}>
        <div className="flex items-start justify-between" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div className="flex items-start gap-3" style={{ flex: 1 }}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
              style={{ background: type.bg, border: `1px solid ${type.border}` }}>
              <span style={{ fontSize: '20px' }}>{type.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="text-sm font-semibold text-white font-display mb-1">{alert.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{alert.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge.Status value={alert.read ? 'read' : 'unread'} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(alert.created_at)}
            </span>
            {alert.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {alert.location}
              </span>
            )}
          </div>
          {!alert.read && (
            <button 
              onClick={() => markAsRead.mutate(alert.id)}
              disabled={markAsRead.isPending}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {markAsRead.isPending ? 'Marking...' : 'Mark as read'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Alerts</h1>
          <p className="text-slate-500 text-sm mt-2">{unread.length} unread, {read.length} read</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No alerts"
          description="You're all caught up! No new alerts at the moment."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {unread.length > 0 && (
            <div>
              <div className="section-label">Unread</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {unread.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
              </div>
            </div>
          )}
          {read.length > 0 && (
            <div>
              <div className="section-label">Read</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {read.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
