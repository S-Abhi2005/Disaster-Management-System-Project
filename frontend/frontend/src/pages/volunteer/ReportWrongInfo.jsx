import React, { useState } from 'react';
import { AlertCircle, Send, FileText, MapPin, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportWrongInfo = () => {
  const [formData, setFormData] = useState({
    type: 'assignment',
    description: '',
    location: '',
    assignmentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Wrong information reported successfully. We will review it soon.', { icon: 'Thank you!' });
      setFormData({ type: 'assignment', description: '', location: '', assignmentId: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Report Wrong Information
          </h1>
          <p className="text-slate-500 text-sm mt-2">Help us maintain accurate information by reporting errors</p>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">What type of information is wrong?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '1rem' }}>
              {[
                { value: 'assignment', label: 'Assignment Details', icon: FileText },
                { value: 'location', label: 'Location Data', icon: MapPin },
                { value: 'volunteer', label: 'Volunteer Info', icon: Users }
              ].map((type) => (
                <label key={type.value} className="relative">
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="p-4 rounded-xl border cursor-pointer transition-all peer-checked:border-green-500 peer-checked:bg-green-500/10 hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <type.icon className="w-5 h-5 text-green-400 mb-2" />
                    <div className="text-sm font-medium text-white">{type.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Assignment ID (if assignment type) */}
          {formData.type === 'assignment' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Assignment ID (if applicable)</label>
              <input
                type="text"
                name="assignmentId"
                value={formData.assignmentId}
                onChange={handleChange}
                placeholder="e.g., ASGN-001234"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Location of the wrong information</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter the location or area"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Describe what's wrong</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe what information is incorrect and what should be corrected..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ marginRight: '1rem' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="card" style={{ maxWidth: '800px', margin: '2rem auto 0', background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.15)', padding: '1.5rem' }}>
        <div className="flex" style={{ gap: '1rem' }}>
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white" style={{ marginBottom: '0.5rem' }}>Why Report Wrong Information?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your reports help us maintain accurate and up-to-date information for everyone in the community. 
              All reports are reviewed by our team within 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportWrongInfo;
