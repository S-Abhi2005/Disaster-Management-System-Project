import { create } from 'zustand';

/* ── UI State Store ──────────────────────────────────────────────────────────── */
const useUIStore = create((set, get) => ({
  // Notifications panel
  notificationsOpen: false,
  notifications: [],      // { id, title, message, type, timestamp, read }
  unreadCount: 0,

  toggleNotifications: () =>
    set((s) => ({ notificationsOpen: !s.notificationsOpen })),

  closeNotifications: () => set({ notificationsOpen: false }),

  addNotification: (notif) =>
    set((s) => ({
      notifications: [notif, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  markOneRead: (id) =>
    set((s) => {
      const n = s.notifications.find((n) => n.id === id);
      const wasUnread = n && !n.read;
      return {
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      };
    }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  // Global loading overlay
  globalLoading: false,
  setGlobalLoading: (val) => set({ globalLoading: val }),

  // Mobile sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));

export default useUIStore;
