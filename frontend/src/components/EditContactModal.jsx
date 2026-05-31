import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { contactsAPI } from '../api';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'name',                    label: 'Full Name',           col: 2 },
  { key: 'email',                   label: 'Email',               col: 1 },
  { key: 'phone',                   label: 'Phone',               col: 1 },
  { key: 'linkedin',                label: 'LinkedIn URL',        col: 1 },
  { key: 'website',                 label: 'Website',             col: 1 },
  { key: 'current_company_1',       label: 'Current Company 1',   col: 1 },
  { key: 'current_designation_1',   label: 'Designation 1',       col: 1 },
  { key: 'current_duration_1',      label: 'Duration 1',          col: 1 },
  { key: 'current_location_1',      label: 'Location 1',          col: 1 },
  { key: 'current_company_2',       label: 'Current Company 2',   col: 1 },
  { key: 'current_designation_2',   label: 'Designation 2',       col: 1 },
  { key: 'current_duration_2',      label: 'Duration 2',          col: 1 },
  { key: 'current_location_2',      label: 'Location 2',          col: 1 },
];

export default function EditContactModal({ contact, onClose, onSaved }) {
  const [form,    setForm]    = useState({ ...contact });
  const [saving,  setSaving]  = useState(false);

  if (!contact) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await contactsAPI.update(contact.source_user || 'garima', contact.id, form);
      toast.success('Contact updated successfully');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2>✏️ Edit Contact</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            {FIELDS.filter(f => f.col === 1).map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input
                  className="form-input"
                  value={form[f.key] || ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
