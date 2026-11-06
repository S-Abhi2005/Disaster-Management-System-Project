import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Bell, Plus, Trash2, BellOff, Send, AlertTriangle, Info, Zap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAlerts, createAlert, deactivateAlert,
  deleteAlert, ALERT_TYPES, ALERT_TARGETS,
} from '../../api/alertService';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/EmptyState';
import { alertTypeConfig, timeAgo } from '../../utils/helpers';

/* ── Create alert form modal ───────────────────────────────────────────────── */
const CreateAlertModal = ({ onClose, onCreate }) => {
  const formik = useFormik({
    initialValues: { title: '', message: '', type: 'info', target: 'all' },
    validationSchema: Yup.object({
      title:   Yup.string().min(5, 'Min 5 chars').required('Title required'),
      message: Yup.string().min(10, 'Min 10 chars').required('Message required'),
      type:    Yup.string().oneOf(ALERT_TYPES).required(),
      target:  Yup.string().oneOf(ALERT_TARGETS).required(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try { await onCreate(values); }
      finally { setSubmitting(false); }
    },
  });
  const fld = n => ({ ...formik.getFieldProps(n), error: formik.touched[n] && formik.errors[n] });

  const TYPE_CONFIG = {
    info:       { label: 'Info',       color: '#22d3ee', icon: '💬' },
    warning:    { label: 'Warning',    color: '#facc15', icon: '⚠️' },
    critical:   { label: 'Critical',   color: '#f43f5e', icon: '🚨' },
    evacuation: { label: 'Evacuation', color: '#f97316', icon: '🏃' },
  };

  return (
    <Modal open onClose={onClose} title="Broadcast Alert" size="md">
      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Alert Type <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
            {ALERT_TYPES.map(t => {
              const cfg = TYPE_CONFIG[t];
              const sel = formik.values.type === t;
              return (
                <button key={t} type="button"
                  onClick={() => formik.setFieldValue('type', t)}
                  className="flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-semibold transition-all"
                  style={{
                    borderColor: sel ? cfg.color : 'rgba(255,255,255,0.07)',
                    background:  sel ? `${cfg.color}15` : 'rgba(255,255,255,0.02)',
                    color:       sel ? cfg.color : '#94a3b8',
                  }}>
                  <span>{cfg.icon}</span> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience <span className="text-red-400">*</span></label>
          <div className="flex gap-2">
            {[
              { value: 'all',       label: '👥 Everyone' },
              { value: 'citizen',   label: '🏠 Citizens' },
              { value: 'volunteer', label: '🦺 Volunteers' },
            ].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => formik.setFieldValue('target', opt.value)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  formik.values.target === opt.value
                    ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Input label="Alert Title" placeholder="e.g. Flash Flood Warning" required {...fld('title')} />
        <Textarea label="Message" placeholder="Provide clear instructions for the target audience…"
          rows={4} required {...fld('message')} />
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/[0.05]">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="danger" size="sm" loading={formik.isSubmitting}
          onClick={formik.handleSubmit} leftIcon={<Send className="w-3.5 h-3.5" />}>
          Broadcast Alert
        </Button>
      </div>
    </Modal>
  );
};

/* ── Alert row ─────────────────────────────────────────────────────────────── */
const AlertRow = ({ alert, onDeactivate, onDelete, deactivating, deleting }) => {
  const cfg = alertTypeConfig(alert.type);
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 ${!alert.active ? 'opacity-60' : ''}`}
      style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">{cfg.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <p className="text-sm font-bold text-white font-display">{alert.title}</p>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                style={{ color: cfg.color, background: `${cfg.border}55` }}>
                {alert.type}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-white/10 text-slate-500">
                → {alert.target}
              </span>
              {!alert.active && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-500 border border-slate-700">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{alert.message}</p>
            <p className="text-xs text-slate-600 mt-2">
              Sent by {alert.sent_by} · {timeAgo(alert.timestamp)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {alert.active && (
            <button onClick={() => onDeactivate(alert.id)} disabled={deactivating === alert.id}
              className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
              title="Deactivate">
              {deactivating === alert.id ? <Spinner size="sm" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={() => onDelete(alert.id)} disabled={deleting === alert.id}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete">
            {deleting === alert.id ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ─────────────────────────────────────────────────────────────── */
const AlertsManagement = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setType]       = useState('');
  const [deactivating, setDeact]    = useState(null);
  const [deleting, setDeleting]     = useState(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['admin-alerts', typeFilter],
    queryFn: () => getAlerts({ type: typeFilter || undefined }),
    refetchInterval: 15000,
  });

  const createMut = useMutation({
    mutationFn: createAlert,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-alerts'] }); setShowCreate(false); toast.success('Alert broadcast!'); },
    onError: () => toast.error('Broadcast failed.'),
  });

  const handleDeactivate = async (id) => {
    setDeact(id);
    try {
      await deactivateAlert(id);
      qc.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast.success('Alert deactivated');
    } catch { toast.error('Failed'); }
    finally { setDeact(null); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteAlert(id);
      qc.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast.success('Alert deleted');
    } catch { toast.error('Failed'); }
    finally { setDeleting(null); }
  };

  const active   = alerts.filter(a => a.active);
  const inactive = alerts.filter(a => !a.active);

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Alerts Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {active.length} active · {inactive.length} inactive
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-danger btn-sm">
          <Send className="w-4 h-4" /> Broadcast Alert
        </button>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: '2rem' }}>
        {['', ...ALERT_TYPES].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`filter-pill capitalize ${typeFilter === t ? 'filter-pill-active' : ''}`}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet" description="Broadcast your first alert now."
          action={<button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Create Alert</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {active.length > 0 && (
            <>
              <div className="section-label flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Active Alerts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {active.map(a => (
                  <AlertRow key={a.id} alert={a} onDeactivate={handleDeactivate} onDelete={handleDelete}
                    deactivating={deactivating} deleting={deleting} />
                ))}
              </div>
            </>
          )}
          {inactive.length > 0 && (
            <>
              <div className="section-label mt-3">Inactive</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {inactive.map(a => (
                  <AlertRow key={a.id} alert={a} onDeactivate={handleDeactivate} onDelete={handleDelete}
                    deactivating={deactivating} deleting={deleting} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showCreate && (
        <CreateAlertModal
          onClose={() => setShowCreate(false)}
          onCreate={async (payload) => createMut.mutateAsync(payload)}
        />
      )}
    </div>
  );
};

export default AlertsManagement;
