// ─── HELPERS UTILITY ────────────────────────────────────────────────────────

/** Role → dashboard path */
export const getRolePath = (role) => {
  const map = {
    citizen:   '/citizen/dashboard',
    volunteer: '/volunteer/dashboard',
    admin:     '/admin/dashboard',
  };
  return map[role] || '/login';
};

/** Role → profile path */
export const getProfilePath = (role) => {
  const map = {
    citizen:   '/citizen/profile',
    volunteer: '/volunteer/profile',
    admin:     '/admin/profile',
  };
  return map[role] || '/login';
};

/** Format ISO date string */
export const formatDate = (iso, opts = {}) => {
  if (!iso) return '—';
  const s = String(iso);
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(s);
  const d = new Date(hasTz ? s : `${s}Z`);
  const defaults = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-IN', { ...defaults, ...opts });
};

/** Format ISO date with time */
export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const s = String(iso);
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(s);
  const d = new Date(hasTz ? s : `${s}Z`);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/** Relative time (e.g. "2 hours ago") */
export const timeAgo = (iso) => {
  if (!iso) return '—';
  const s = String(iso);
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(s);
  const diff = Date.now() - new Date(hasTz ? s : `${s}Z`).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const m = Math.floor(secs / 60);  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
};

/** Severity → color token */
export const severityColor = (severity) => {
  const map = {
    low: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    high: { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    critical: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  };
  return map[severity] || map.medium;
};

/** Status → badge variant */
export const statusVariant = (status) => {
  const map = {
    pending: 'warning', active: 'info', resolved: 'success',
    closed: 'neutral', critical: 'danger',
    available: 'success', assigned: 'primary', unavailable: 'neutral',
    in_use: 'warning', maintenance: 'danger', in_progress: 'info',
  };
  return map[status] || 'neutral';
};

/** Alert type → colors */
export const alertTypeConfig = (type) => {
  const map = {
    info:       { icon: '💬', color: 'text-cyan-400',   bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)' },
    warning:    { icon: '⚠️',  color: 'text-yellow-400', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)' },
    critical:   { icon: '🚨',  color: 'text-red-400',    bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)' },
    evacuation: { icon: '🏃',  color: 'text-orange-400', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  };
  return map[type] || map.info;
};

/** Truncate text */
export const truncate = (str, n = 80) =>
  str && str.length > n ? `${str.slice(0, n - 1)}…` : str;

/** Initials from name */
export const getInitials = (firstName = '', lastName = '') =>
  `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';

/** Format phone number */
export const formatPhone = (ph) => {
  if (!ph) return '—';
  const s = String(ph).replace(/\D/g, '');
  if (s.length === 10) return `+91 ${s.slice(0, 5)}-${s.slice(5)}`;
  return ph;
};

/** Password strength (0–4) */
export const getPasswordStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

export const strengthLabel = (score) => {
  return ['', 'Weak', 'Fair', 'Good', 'Strong'][score] || '';
};

export const strengthColor = (score) => {
  return ['', '#f87171', '#facc15', '#60a5fa', '#4ade80'][score] || '';
};

/** Generate a random color from a string (for avatars) */
export const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${Math.abs(h)}, 60%, 50%)`;
};

/** Build query string from object (ignores undefined/null/'') */
export const buildQuery = (params = {}) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
};
