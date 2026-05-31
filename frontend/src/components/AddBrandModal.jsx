import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { brandsAPI } from '../api';
import toast from 'react-hot-toast';

const HANDLERS = ['','prashant','garima','bhanu','mohseen','himanshu','abhishek','kushagra','divya','megha','jatin','neha','gauri','aishwarya','shweta','io'];
const OPINIONS = ['','relevant','irrelevant','BMI starter','BMI enterprise','unreachable','unresponsive','negotiation failed','already in touch'];
const EMAIL_FROM = ['','mohseen@prichitects.com','bhanu@prichitects.com','abhishek@prichitects.com','himanshu@prichitects.com','garima@prichitects.com','kushagra@prichitects.com','neha@prchitects.com','gauri@prchitects.com'];

export default function AddBrandModal({ onClose }) {
  const [form, setForm] = useState({
    brand:'', client:'', designation:'', email:'', contact:'', company:'',
    website:'', linkedin:'', opinion:'', handler:'',
    conn_sent: false, conn_est: false, pitch_sent: false,
    linkedin_follow: false, email_outreach: false,
    email_from: '', pitch_response: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.brand.trim()) { toast.error('Brand name is required'); return; }
    if (form.email_outreach && !form.email_from) { toast.error('Select email to send from'); return; }
    setSaving(true);
    try {
      await brandsAPI.create(form);
      toast.success(`✅ Brand "${form.brand}" added to Brand Index!`);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add brand';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-header" style={{ borderBottom: '2px solid #057642' }}>
          <h2 style={{ color: '#057642' }}><Tag size={18} style={{ display:'inline', marginRight:8 }} />Add Brand</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Brand Name *</label>
              <input className="form-input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Nike" />
            </div>
            <div className="form-group">
              <label className="form-label">Point of Contact</label>
              <input className="form-input" value={form.client} onChange={e => set('client', e.target.value)} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Marketing Manager" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@brand.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone / Contact</label>
              <input className="form-input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="+91 ..." />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Parent company" />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input className="form-input" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Opinion</label>
              <select className="form-select" value={form.opinion} onChange={e => set('opinion', e.target.value)}>
                {OPINIONS.map(o => <option key={o} value={o}>{o || '— Select —'}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Handler</label>
              <select className="form-select" value={form.handler} onChange={e => set('handler', e.target.value)}>
                {HANDLERS.map(h => <option key={h} value={h}>{h || '— Select —'}</option>)}
              </select>
            </div>
          </div>

          <div className="divider" />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 10 }}>Outreach Status</p>
          <div className="checkbox-group" style={{ marginBottom: 16 }}>
            {[
              ['conn_sent',       'Connection Sent'],
              ['conn_est',        'Connection Established'],
              ['pitch_sent',      'LinkedIn Message'],
              ['linkedin_follow', 'LinkedIn Followup'],
              ['email_outreach',  'Personal Email Outreach'],
            ].map(([key, label]) => (
              <label key={key} className={`checkbox-pill ${form[key] ? 'active' : ''}`}>
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          {form.email_outreach && (
            <div className="form-group">
              <label className="form-label">Email Send From *</label>
              <select className="form-select" value={form.email_from} onChange={e => set('email_from', e.target.value)}>
                {EMAIL_FROM.map(e => <option key={e} value={e}>{e || '— Select email —'}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Pitch Response / Notes</label>
            <textarea className="form-textarea" value={form.pitch_response} onChange={e => set('pitch_response', e.target.value)} placeholder="Add notes..." />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}
            style={{ background: '#057642', borderColor: '#057642' }}>
            {saving ? <span className="spinner" /> : <Tag size={15} />}
            {saving ? 'Saving...' : 'Save Brand'}
          </button>
        </div>
      </div>
    </div>
  );
}
