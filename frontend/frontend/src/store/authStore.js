import { create } from 'zustand';

/* ── Hydrate from localStorage ───────────────────────────────────────────────── */
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/* ── Auth Store ──────────────────────────────────────────────────────────────── */
const useAuthStore = create((set, get) => ({
  user:            getStoredUser(),
  token:           localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading:       false,

  /** Called after login / register success */
  setAuth: (userData) => {
    const { access_token, refresh_token, ...user } = userData;
    localStorage.setItem('access_token', access_token);
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: access_token, isAuthenticated: true });
  },

  /** Clear auth state (logout) */
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  /** Partial update of user profile (e.g. after edit) */
  updateUser: (updates) => {
    const current = get().user;
    const updated = { ...current, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  setLoading: (val) => set({ isLoading: val }),
}));

export default useAuthStore;
