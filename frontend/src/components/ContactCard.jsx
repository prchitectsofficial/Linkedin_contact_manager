import React from 'react';
import { Mail, Phone, Linkedin, Building2, Eye, Pencil, Globe } from 'lucide-react';

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?';
}

function getAvatarColor(name = '') {
  const colors = [
    { bg: '#EAF0FA', color: '#0A66C2' },
    { bg: '#E8F5EE', color: '#057642' },
    { bg: '#FDF3DC', color: '#B37700' },
    { bg: '#F5EAFA', color: '#7B2FBE' },
    { bg: '#FAEAEA', color: '#CC1016' },
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] || colors[0];
}

export default function ContactCard({ contact, onView, onEdit }) {
  const initials  = getInitials(contact.name);
  const avatarClr = getAvatarColor(contact.name);

  const company = contact.current_company_1 || '';
  const desig   = contact.current_designation_1 || '';
  const duration = contact.current_duration_1 || '';

  return (
    <div className="card" style={{
      padding:  '16px 18px',
      display:  'flex',
      gap:      14,
      alignItems: 'flex-start',
      transition: 'box-shadow 0.2s ease, transform 0.15s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: avatarClr.bg, color: avatarClr.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 17, flexShrink: 0,
        border: '2px solid #E0DFDC',
      }}>
        {initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + source badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1D2226', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contact.name || 'No Name'}
          </span>
          {contact.source_user && (
            <span className={`badge ${contact.source_user === 'garima' ? 'badge-blue' : 'badge-green'}`}>
              {contact.source_user}
            </span>
          )}
        </div>

        {/* Contact info row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 8 }}>
          {contact.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
              <Mail size={12} color="#0A66C2" />
              <a href={`mailto:${contact.email}`} style={{ color: '#0A66C2', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                {contact.email}
              </a>
            </span>
          )}
          {contact.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
              <Phone size={12} color="#057642" />
              {contact.phone}
            </span>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0A66C2', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              <Linkedin size={12} />
              LinkedIn
            </a>
          )}
        </div>

        {/* Current Company */}
        {company && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '6px 10px',
            background:   '#F3F2EF',
            borderRadius: 6,
            fontSize:     12,
          }}>
            <Building2 size={13} color="#0A66C2" />
            <span style={{ fontWeight: 600, color: '#1D2226' }}>{company}</span>
            {desig && <span style={{ color: '#666' }}>· {desig}</span>}
            {duration && <span style={{ color: '#999', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{duration}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <ActionIcon icon={<Eye size={15} />}    label="View Details" color="#0A66C2" onClick={() => onView(contact)} />
        <ActionIcon icon={<Pencil size={15} />} label="Edit Contact" color="#B37700" onClick={() => onEdit(contact)} />
      </div>
    </div>
  );
}

function ActionIcon({ icon, label, color, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      data-tooltip={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `1.5px solid ${hovered ? color : '#E0DFDC'}`,
        background: hovered ? `${color}15` : 'transparent',
        color: hovered ? color : '#999',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
    >
      {icon}
    </button>
  );
}
