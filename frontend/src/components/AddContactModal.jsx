import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { contactsAPI } from '../api';
import toast from 'react-hot-toast';

export default function AddContactModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    table: 'garima', name: '', email: '', phone: '',
    linkedin: '', website: '',
    current_company_1: '', current_designation_1: '',
    current_duration_1: '', current_location_1: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await contactsAPI.create(form);
      toast.success(`Contact "${form.name}" added successfully`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2><UserPlus size={18} style={{ display:'inline', marginRight:8 }} />Add Contact</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>
        <div className="modal-body">

          <div className="form-group">
            <label className="form-label">Add to Table *</label>
            <select className="form-select" value={form.table} onChange={e => set('table', e.target.value)}>
              <option value="garima">Garima</option>
              <option value="lms">LMS</option>
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 ..." />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input className="form-input" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">Current Company</label>
              <input className="form-input" value={form.current_company_1} onChange={e => set('current_company_1', e.target.value)} placeholder="Company name" />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.current_designation_1} onChange={e => set('current_designation_1', e.target.value)} placeholder="Marketing Manager" />
            </div>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input className="form-input" value={form.current_duration_1} onChange={e => set('current_duration_1', e.target.value)} placeholder="Jan 2023 - Present" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.current_location_1} onChange={e => set('current_location_1', e.target.value)} placeholder="Mumbai, India" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <UserPlus size={15} />}
            {saving ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
