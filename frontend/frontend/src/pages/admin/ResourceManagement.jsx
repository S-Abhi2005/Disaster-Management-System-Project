import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Package, Plus, Trash2, Edit3, Link2, Link2Off,
  Search, X, Check, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getResources, createResource, updateResource,
  deleteResource, assignResource, releaseResource, RESOURCE_TYPES,
} from '../../api/resourceService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { timeAgo } from '../../utils/helpers';

/* ── Add / Edit modal ──────────────────────────────────────────────────────── */
const ResourceForm = ({ resource, onClose, onSave }) => {
  const isEdit = !!resource?.id;
  const formik = useFormik({
    initialValues: {
      name:     resource?.name     || '',
      type:     resource?.type     || '',
      otherType: resource?.otherType || '',
      quantity: resource?.quantity || '',
      unit:     resource?.unit     || '',
      location: resource?.location || '',
    },
    validationSchema: Yup.object({
      name:     Yup.string().required('Required'),
      type:     Yup.string().oneOf(RESOURCE_TYPES).required('Required'),
      otherType: Yup.string().when('type', {
        is: 'Other',
        then: () => Yup.string().required('Please specify the type'),
        otherwise: () => Yup.string(),
      }),
      quantity: Yup.number().min(1).required('Required').typeError('Must be a number'),
      unit:     Yup.string().required('Required'),
      location: Yup.string().required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const finalType = values.type === 'Other' ? values.otherType : values.type;
        await onSave({ ...values, type: finalType, quantity: Number(values.quantity) });
      } finally { setSubmitting(false); }
    },
  });
  const fld = n => ({ ...formik.getFieldProps(n), error: formik.touched[n] && formik.errors[n] });
  const isOther = formik.values.type === 'Other';
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Resource' : 'Add Resource'} size="md" closable={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
        <Input label="Resource Name" placeholder="e.g. First Aid Kits (Batch A)" required {...fld('name')} />
        <Select label="Type" required placeholder="Select type" {...fld('type')}>
          <option value="">Select resource type</option>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        {isOther && (
          <Input 
            label="Specify Type" 
            placeholder="e.g. Safety Equipment, Tools, etc." 
            required 
            {...fld('otherType')} 
          />
        )}
        <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
          <Input label="Quantity" type="number" placeholder="50" required {...fld('quantity')} />
          <Input label="Unit" placeholder="kits, boats, units..." required {...fld('unit')} />
        </div>
        <Input label="Location / Warehouse" placeholder="e.g. Warehouse 1, Andheri" required {...fld('location')} />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-white/[0.05]">
        <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
        <button onClick={formik.handleSubmit} disabled={formik.isSubmitting} className="btn btn-primary btn-sm">
          {formik.isSubmitting ? <Spinner size="sm" /> : <><Check className="w-4 h-4" />{isEdit ? 'Update Resource' : 'Save Changes'}</>}
        </button>
      </div>
    </Modal>
  );
};

/* ── Main page ─────────────────────────────────────────────────────────────── */
const ResourceManagement = () => {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('');
  const [statusFilter, setStat] = useState('');
  const [formTarget, setForm]   = useState(null);  // null=closed, {}=new, {id,...}=edit
  const [delTarget, setDel]     = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-resources', typeFilter, statusFilter],
    queryFn: () => getResources({ type: typeFilter || undefined, status: statusFilter || undefined }),
  });
  const resources = (data?.data || []).filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  /* Mutations */
  const createMut = useMutation({
    mutationFn: createResource,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resources'] }); setForm(null); toast.success('Resource added!'); },
    onError: () => toast.error('Failed to add.'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => updateResource(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resources'] }); setForm(null); toast.success('Resource updated!'); },
    onError: () => toast.error('Update failed.'),
  });
  const deleteMut = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resources'] }); setDel(null); toast.success('Deleted.'); },
    onError: () => toast.error('Delete failed.'),
  });
  const releaseMut = useMutation({
    mutationFn: releaseResource,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-resources'] }); toast.success('Resource released.'); },
    onError: () => toast.error('Release failed.'),
  });

  const handleSave = async (values) => {
    if (formTarget?.id) await updateMut.mutateAsync({ id: formTarget.id, ...values });
    else await createMut.mutateAsync(values);
  };

  return (
    <div className="space-y-5 animate-fade-in-up pb-6" style={{ padding: '1rem' }}>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: '0.75rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Resource Management</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? '…'} resources in inventory</p>
        </div>
        <button onClick={() => setForm({})} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="relative flex-1" style={{ minWidth: '350px' }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Search resources…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-base pl-12 search-input-large" />
        </div>
        <select value={typeFilter} onChange={e => setType(e.target.value)} className="input-base sm:w-36">
          <option value="">All Types</option>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStat(e.target.value)} className="input-base sm:w-32">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
        </select>
        {(search || typeFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setType(''); setStat(''); }} className="btn btn-ghost btn-sm shrink-0"><X className="w-4 h-4" /></button>
        )}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '2rem' }}>
              <div className="skeleton h-4 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded mb-4" />
              <div className="skeleton h-3 w-full rounded mb-2" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState icon={Package} title="No resources found"
          description="Add your first resource to the inventory."
          action={<button onClick={() => setForm({})} className="btn btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Add Resource</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem' }}>
          {resources.map(r => {
            // Calculate correct status based on available quantity
            const cardStatus = r.available === 0 
              ? 'in_use' 
              : r.available === r.quantity 
                ? 'available' 
                : 'partially_used';
            return (
            <div key={r.id} 
                 className="card hover:border-indigo-500/30 transition-all hover:translate-y-[-2px] duration-200 cursor-pointer"
                 style={{ padding: '2rem' }}
                 onClick={() => window.location.href = `/admin/resources/${r.id}`}>
              {/* Header - Name and Status */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                  <Badge.Status value={cardStatus} />
                  <span className="text-xs font-mono text-slate-600">{r.id}</span>
                </div>
                <h3 className="text-base font-bold text-white font-display leading-snug line-clamp-2">
                  {r.name}
                </h3>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span>{r.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-slate-500">Qty:</span>
                  <span className="font-bold text-white">{r.quantity} {r.unit}</span>
                  <span className="text-slate-600">|</span>
                  <span className={`font-bold ${r.available > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.available} available
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-slate-500">Location:</span>
                  <span className="truncate">{r.location}</span>
                </div>
                {r.assigned_to && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Assigned:</span>
                    <span className="text-orange-400 font-mono">{r.assigned_to}</span>
                  </div>
                )}
              </div>

              {/* Footer - Time and Actions */}
              <div className="flex items-center justify-between" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-slate-500">{timeAgo(r.last_updated)}</span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setForm(r)}
                    className="text-xs font-semibold px-3 py-1.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" />Edit
                  </button>
                  {r.status === 'in_use' && (
                    <button onClick={() => releaseMut.mutate(r.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded border border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-all flex items-center gap-1"
                      title="Release resource">
                      <Link2Off className="w-3.5 h-3.5" />Release
                  </button>
                  )}
                  <button onClick={() => setDel(r)}
                    className="text-xs font-semibold px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit form modal */}
      {formTarget !== null && (
        <ResourceForm
          resource={formTarget?.id ? formTarget : null}
          onClose={() => setForm(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm modal */}
      {delTarget && (
        <Modal open onClose={() => setDel(null)} title="Delete Resource" size="sm" closable={true}>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-200">This will permanently delete <strong className="text-white">{delTarget.name}</strong>.</p>
                <p className="text-xs text-red-400 mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDel(null)} className="btn btn-secondary btn-sm">Cancel</button>
            <button onClick={() => deleteMut.mutate(delTarget.id)} disabled={deleteMut.isPending} className="btn btn-danger btn-sm">
              {deleteMut.isPending ? <Spinner size="sm" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResourceManagement;
