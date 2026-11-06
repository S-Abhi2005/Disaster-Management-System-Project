import React, { useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, BellOff, Zap } from 'lucide-react';
import useUIStore from '../store/uiStore';
import { alertTypeConfig, timeAgo } from '../utils/helpers';

/* ── Bell button (used in topbar) ─────────────────────────────────────────── */
export const NotificationBell = () => {
  const unreadCount        = useUIStore((s) => s.unreadCount);
  const notificationsOpen  = useUIStore((s) => s.notificationsOpen);
  const toggleNotifications = useUIStore((s) => s.toggleNotifications);

  return (
    <button
      id="notifications-bell"
      onClick={toggleNotifications}
      className={`relative p-2 rounded-xl transition-all duration-200 ${
        notificationsOpen
          ? 'bg-indigo-500/20 text-indigo-300'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
      }`}
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: '#f43f5e', color: '#fff' }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

/* ── Notification panel ────────────────────────────────────────────────────── */
const NotificationCenter = () => {
  const {
    notificationsOpen, closeNotifications,
    notifications, unreadCount,
    markAllRead, markOneRead, clearNotifications,
  } = useUIStore();

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!notificationsOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          !e.target.closest('#notifications-bell')) {
        closeNotifications();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen]);

  if (!notificationsOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed top-16 right-4 z-50 w-full max-w-sm animate-fade-in-up"
      style={{ maxHeight: 'calc(100vh - 5rem)' }}
    >
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col"
        style={{
          background: 'rgba(6,13,28,0.96)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          maxHeight: 'calc(100vh - 5.5rem)',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white font-display">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                title="Mark all as read">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearNotifications}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Clear all">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={closeNotifications}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <BellOff className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
              <p className="text-xs text-slate-700 mt-1">Real-time alerts will appear here</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const cfg = alertTypeConfig(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => markOneRead(notif.id)}
                  className={`px-4 py-3.5 border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors relative ${
                    notif.read ? 'opacity-60 hover:opacity-80' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <span className="absolute right-4 top-4 w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}

                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-slate-200 leading-snug">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-700 mt-1.5">{timeAgo(notif.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-[10px] text-slate-700">
              {notifications.length} total · {unreadCount} unread
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
              <Zap className="w-3 h-3" /> Simulated real-time
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
