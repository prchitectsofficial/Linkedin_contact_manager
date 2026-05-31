import React from 'react';
import { X, Mail, Phone, Linkedin, Globe, Building2, MapPin, Clock, Briefcase } from 'lucide-react';

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
}

function CompanyBlock({ label, company, designation, duration, location, accent }) {
  if (!company) return null;
  return (
    <div style={{
      padding: '12px 14px',
      background: '#F8F7F4',
      borderRadius: 8,
      borderLeft: `3px solid ${accent}`,
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1D2226', marginBottom: 2 }}>{company}</div>
      {designation && <div style={{ fontSize: 13, color: '#444', marginBottom: 2 }}>{designation}</div>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {duration && <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{duration}</span>}
        {location && <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{location}</span>}
      </div>
    </div>
  );
}

export default function ContactDetailModal({ contact, onClose }) {
  if (!contact) return null;

  const initials = getInitials(contact.name);

  const currentJobs = [
    { label: 'Current Company 1', company: contact.current_company_1, designation: contact.current_designation_1, duration: contact.current_duration_1, location: contact.current_location_1, accent: '#0A66C2' },
    { label: 'Current Company 2', company: contact.current_company_2, designation: contact.current_designation_2, duration: contact.current_duration_2, location: contact.current_location_2, accent: '#1B7FC4' },
  ];
  const prevJobs = [1,2,3,4,5].map(n => ({
    label:       `Previous Company ${n}`,
    company:     contact[`previous_company_${n}`],
    designation: contact[`previous_designation_${n}`],
    duration:    contact[`previous_duration_${n}`],
    location:    contact[`previous_location_${n}`],
    accent:      '#888',
  }));

  const hasPrev = prevJobs.some(j => j.company);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>

        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)', borderRadius: '16px 16px 0 0', color: '#fff', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 20, color: '#fff',
              border: '2px solid rgba(255,255,255,0.4)',
            }}>
              {initials}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{contact.name || 'No Name'}</h2>
              {contact.current_designation_1 && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0' }}>
                  {contact.current_designation_1}
                  {contact.current_company_1 && ` · ${contact.current_company_1}`}
                </p>
              )}
              {contact.source_user && (
                <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }}>
                  {contact.source_user.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Contact details */}
          <div style={{ marginBottom: 20 }}>
            <SectionTitle icon={<Mail size={14} />} label="Contact Details" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {contact.email && <ContactPill icon={<Mail size={13} />} label={contact.email} href={`mailto:${contact.email}`} color="#0A66C2" />}
              {contact.phone && <ContactPill icon={<Phone size={13} />} label={contact.phone} color="#057642" />}
              {contact.linkedin && <ContactPill icon={<Linkedin size={13} />} label="LinkedIn Profile" href={contact.linkedin} color="#0A66C2" />}
              {contact.website && <ContactPill icon={<Globe size={13} />} label={contact.website} href={contact.website} color="#666" />}
              {!contact.email && !contact.phone && !contact.linkedin && !contact.website && (
                <span style={{ color: '#999', fontSize: 13 }}>No contact details available</span>
              )}
            </div>
          </div>

          {/* Current companies */}
          <div style={{ marginBottom: 16 }}>
            <SectionTitle icon={<Briefcase size={14} />} label="Current Position(s)" />
            <div style={{ marginTop: 10 }}>
              {currentJobs.map(j => <CompanyBlock key={j.label} {...j} />)}
              {!currentJobs.some(j => j.company) && (
                <span style={{ color: '#999', fontSize: 13 }}>No current company data</span>
              )}
            </div>
          </div>

          {/* Previous companies */}
          {hasPrev && (
            <div>
              <SectionTitle icon={<Building2 size={14} />} label="Previous Experience" />
              <div style={{ marginTop: 10 }}>
                {prevJobs.map(j => <CompanyBlock key={j.label} {...j} />)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0A66C2', fontWeight: 700, fontSize: 13 }}>
      {icon} {label}
      <div style={{ flex: 1, height: 1, background: '#E0DFDC', marginLeft: 4 }} />
    </div>
  );
}

function ContactPill({ icon, label, href, color }) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 20,
      border: '1.5px solid #E0DFDC',
      background: '#F8F7F4',
      fontSize: 13, color: href ? color : '#444',
      textDecoration: 'none',
      transition: 'all 0.15s ease',
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}
    onMouseEnter={e => e.currentTarget.firstChild.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.firstChild.style.borderColor = '#E0DFDC'}
    >{inner}</a>;
  return inner;
}
