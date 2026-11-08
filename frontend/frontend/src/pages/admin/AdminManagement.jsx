import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, Shield, UserPlus, Search, RefreshCw,
  Mail, Phone, MapPin, Calendar, Power, Edit3, Trash2,
  CheckCircle2, AlertTriangle, XCircle, Lock, User, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import {
  getAdminAccounts,
  createAdminAccount,
  updateAdminStatus,
  updateAdminAccount,
  deleteAdminAccount
} from '../../api/adminService';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState, { Spinner } from '../../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../../utils/helpers';

/* ── Create Admin Modal ──────────────────────────────────────────────────────── */
const CreateAdminModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    city: '',
    role: 'ADMIN',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await createAdminAccount(formData);
      toast.success('Admin account created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create admin account.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Administrator" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          name="full_name"
          placeholder="e.g. Priya Sharma"
          value={formData.full_name}
          onChange={handleChange}
          required
        />

        <Input
          label="Email Address *"
          type="email"
          name="email"
          placeholder="e.g. priya@disastershield.org"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Password *"
          type="password"
          name="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            name="phone_number"
            placeholder="e.g. +91 9876543210"
            value={formData.phone_number}
            onChange={handleChange}
          />
          <Input
            label="City"
            name="city"
            placeholder="e.g. Yadgir"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Administrator Role *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="ADMIN">Standard Admin (Manage Incidents, Volunteers, Resources)</option>
            <option value="SUPER_ADMIN">Super Admin (Full Access + Admin Management)</option>
          </select>
          <p className="text-xs text-slate-500 mt-1.5">
            Super Admins have authority to manage other administrative accounts.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} icon={UserPlus}>
            Create Admin
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* ── Edit Admin Modal ────────────────────────────────────────────────────────── */
const EditAdminModal = ({ admin, open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: admin?.full_name || '',
    phone_number: admin?.phone_number || '',
    city: admin?.city || '',
    role: admin?.role || 'ADMIN',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        city: formData.city,
        role: formData.role,
      };
      if (formData.password.trim()) {
        if (formData.password.length < 6) {
          toast.error('New password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        payload.password = formData.password.trim();
      }

      await updateAdminAccount(admin.id, payload);
      toast.success('Admin updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update admin account.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Edit Admin: ${admin.full_name || admin.email}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Administrator Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="ADMIN">Standard Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        <Input
          label="Reset Password (leave blank to keep current)"
          type="password"
          name="password"
          placeholder="New password (optional)"
          value={formData.password}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* ── Main AdminManagement Component ─────────────────────────────────────────── */
const AdminManagement = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  // Fetch admin accounts
  const { data: admins = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: getAdminAccounts,
    refetchInterval: 60000,
  });

  // Toggle active/deactive status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateAdminStatus(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      toast.success(
        data.is_active
          ? `Admin ${data.full_name || data.email} activated.`
          : `Admin ${data.full_name || data.email} deactivated.`
      );
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to update account status.';
      toast.error(msg);
    },
    onSettled: () => setDeactivatingId(null),
  });

  // Delete admin mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      toast.success('Admin account deleted successfully.');
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to delete admin account.';
      toast.error(msg);
    },
  });

  const handleToggleStatus = (admin) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can activate or deactivate accounts.');
      return;
    }

    const newStatus = !admin.is_active;
    const action = newStatus ? 'activate' : 'deactivate';

    // Client-side quick check for last active super admin
    if (!newStatus && admin.role === 'SUPER_ADMIN') {
      const activeSuperCount = admins.filter((a) => a.role === 'SUPER_ADMIN' && a.is_active).length;
      if (activeSuperCount <= 1) {
        toast.error('Cannot deactivate the last active Super Admin account.');
        return;
      }
    }

    if (window.confirm(`Are you sure you want to ${action} ${admin.full_name || admin.email}?`)) {
      setDeactivatingId(admin.id);
      toggleStatusMutation.mutate({ id: admin.id, isActive: newStatus });
    }
  };

  const handleDelete = (admin) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can delete accounts.');
      return;
    }

    if (admin.role === 'SUPER_ADMIN') {
      const activeSuperCount = admins.filter((a) => a.role === 'SUPER_ADMIN' && a.is_active).length;
      if (activeSuperCount <= 1) {
        toast.error('Cannot delete the last active Super Admin account.');
        return;
      }
    }

    if (window.confirm(`Are you sure you want to permanently delete admin ${admin.full_name || admin.email}?`)) {
      deleteMutation.mutate(admin.id);
    }
  };

  // Filtered list: Search by name, email, or city + Role filter + Status filter
  const filteredAdmins = admins.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q);

    const adminRole = String(a.role || '').toUpperCase();
    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'SUPER_ADMIN' && adminRole === 'SUPER_ADMIN') ||
      (roleFilter === 'ADMIN' && adminRole === 'ADMIN');

    const isActive = Boolean(a.is_active ?? true);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats calculations
  const totalAdmins = admins.length;
  const superAdminCount = admins.filter((a) => a.role === 'SUPER_ADMIN').length;
  const activeCount = admins.filter((a) => a.is_active).length;
  const inactiveCount = admins.filter((a) => !a.is_active).length;

  return (
    <div className="animate-fade-in space-y-8" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white font-display">Admin Management</h1>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
              style={{
                background: isSuperAdmin ? 'rgba(236,72,153,0.15)' : 'rgba(99,102,241,0.15)',
                color: isSuperAdmin ? '#f472b6' : '#818cf8',
                border: `1px solid ${isSuperAdmin ? 'rgba(236,72,153,0.3)' : 'rgba(99,102,241,0.3)'}`,
              }}
            >
              {isSuperAdmin ? 'Super Admin Mode' : 'Admin Access'}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage administrative personnel, roles, and access credentials across the Disaster Management System.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn btn-ghost btn-sm"
            title="Refresh administrators"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin ? (
            <Button
              variant="primary"
              size="md"
              icon={UserPlus}
              onClick={() => setCreateOpen(true)}
            >
              Add New Admin
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.04] px-3 py-2 rounded-xl border border-white/[0.06]">
              <Lock className="w-3.5 h-3.5" />
              <span>Super Admin required to create accounts</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Admins"
          value={totalAdmins}
          icon={Shield}
          color="primary"
          subtitle="All registered staff"
        />
        <StatCard
          title="Super Admins"
          value={superAdminCount}
          icon={ShieldCheck}
          color="danger"
          subtitle="Full privilege controllers"
        />
        <StatCard
          title="Active Accounts"
          value={activeCount}
          icon={CheckCircle2}
          color="success"
          subtitle="Currently permitted to login"
        />
        <StatCard
          title="Deactivated"
          value={inactiveCount}
          icon={XCircle}
          color="warning"
          subtitle="Access temporarily revoked"
        />
      </div>

      {/* Filter and Search Controls */}
      <div className="card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-full lg:max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-12 pr-10 h-11 text-sm bg-slate-900/80 border-white/10 rounded-xl placeholder:text-slate-500 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Groups */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Role Filter Group */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Role:
            </span>
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/10 gap-1.5 shadow-inner">
              {[
                { value: 'ALL', label: 'All Roles' },
                { value: 'SUPER_ADMIN', label: 'Super Admins' },
                { value: 'ADMIN', label: 'Admins' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRoleFilter(r.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                    roleFilter === r.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Group */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Status:
            </span>
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/10 gap-1.5 shadow-inner">
              {[
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                    statusFilter === s.value
                      ? s.value === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/30'
                        : s.value === 'INACTIVE'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/30'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters Shortcut */}
          {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Reset all search and filter criteria"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Accounts Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-slate-500 text-sm mt-4">Loading administrator records...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={Shield}
              title="No administrator accounts found"
              description={
                search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No administrator accounts match your current search and filter criteria.'
                  : 'Get started by creating your first team administrator.'
              }
              action={
                search || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('ALL');
                      setStatusFilter('ALL');
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : (
                  isSuperAdmin && (
                    <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)} icon={UserPlus}>
                      Create Administrator
                    </Button>
                  )
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Administrator
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Location & Contact
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Registered On
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredAdmins.map((admin) => {
                  const isCurrent = currentUser?.email?.toLowerCase() === admin.email.toLowerCase();
                  const isSuper = admin.role === 'SUPER_ADMIN';
                  const initials = (admin.full_name || admin.email || 'A')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={admin.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        !admin.is_active ? 'opacity-65' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md"
                            style={{
                              background: isSuper
                                ? 'linear-gradient(135deg, #ec4899, #be185d)'
                                : 'linear-gradient(135deg, #6366f1, #4338ca)',
                              color: '#fff',
                            }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white truncate">
                                {admin.full_name || 'Unnamed Admin'}
                              </p>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{
                            background: isSuper ? 'rgba(236,72,153,0.15)' : 'rgba(99,102,241,0.15)',
                            color: isSuper ? '#f472b6' : '#a5b4fc',
                            border: `1px solid ${isSuper ? 'rgba(236,72,153,0.25)' : 'rgba(99,102,241,0.25)'}`,
                          }}
                        >
                          {isSuper ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {isSuper ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>

                      {/* Location & Contact */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <p className="text-slate-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {admin.city || '—'}
                          </p>
                          <p className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {admin.phone_number || '—'}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            admin.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          {admin.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Creation Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{admin.created_at ? formatDate(admin.created_at) : '—'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSuperAdmin ? (
                            <>
                              {/* Toggle active status */}
                              <button
                                onClick={() => handleToggleStatus(admin)}
                                disabled={deactivatingId === admin.id}
                                className={`btn btn-sm btn-ghost p-1.5 rounded-lg transition-colors ${
                                  admin.is_active
                                    ? 'hover:bg-rose-500/10 hover:text-rose-400 text-slate-400'
                                    : 'hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-400'
                                }`}
                                title={admin.is_active ? 'Deactivate account' : 'Reactivate account'}
                              >
                                <Power className={`w-4 h-4 ${deactivatingId === admin.id ? 'animate-spin' : ''}`} />
                              </button>

                              {/* Edit details */}
                              <button
                                onClick={() => setEditingAdmin(admin)}
                                className="btn btn-sm btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                title="Edit details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete account */}
                              <button
                                onClick={() => handleDelete(admin)}
                                className="btn btn-sm btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Delete account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 italic">View only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Info Card */}
      <div className="card bg-indigo-950/20 border-indigo-500/20 p-5 rounded-2xl flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white font-display">Role-Based Security Policy</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All administrator operations are strictly audited. Super Admins possess full account management privileges.
            Standard Admins retain emergency command privileges (disaster reports, volunteer triage, alert broadcasts, and resource allocation)
            while account creation, role modification, and deactivation controls remain reserved for Super Admins.
            The system actively prevents deleting or deactivating the last remaining active Super Admin.
          </p>
        </div>
      </div>

      {/* Modals */}
      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })}
      />

      <EditAdminModal
        admin={editingAdmin}
        open={!!editingAdmin}
        onClose={() => setEditingAdmin(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })}
      />
    </div>
  );
};

export default AdminManagement;

