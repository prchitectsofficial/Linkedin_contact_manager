import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

const PREFERENCES = [
  { value: 'current',   label: 'Current Company Only' },
  { value: 'previous',  label: 'Previous Companies Only' },
  { value: 'name_only', label: 'Name Only' },
  { value: 'email_only',label: 'Email Only' },
];

export default function Filters({ filters, onFilterChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const togglePref = (val) => {
    const prefs = filters.preference || [];
    const next  = prefs.includes(val) ? prefs.filter(p => p !== val) : [...prefs, val];
    onFilterChange({ preference: next });
  };

  const hasAdvanced = filters.company || filters.designation;

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #E0DFDC', padding: '0 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Main filter row */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          flexWrap:   'wrap',
          gap:        8,
          padding:    '10px 0',
        }}>

          <FilterDropdown
            label="Select User"
            value={filters.user}
            options={[
              { value: 'all',    label: 'All Users' },
              { value: 'garima', label: 'Garima' },
              { value: 'lms',    label: 'LMS' },
            ]}
            onChange={v => onFilterChange({ user: v })}
          />

          <FilterDropdown
            label="Location"
            value={filters.location}
            options={[
              { value: 'all',       label: 'All Locations' },
              { value: 'indian',    label: 'Indian' },
              { value: 'non_indian',label: 'Non-Indian' },
            ]}
            onChange={v => onFilterChange({ location: v })}
          />

          <FilterDropdown
            label="Contact"
            value={filters.contact}
            options={[
              { value: 'all',           label: 'All Contacts' },
              { value: 'with_email',    label: 'With Email' },
              { value: 'without_email', label: 'Without Email' },
              { value: 'with_phone',    label: 'With Phone' },
              { value: 'without_phone', label: 'Without Phone' },
            ]}
            onChange={v => onFilterChange({ contact: v })}
          />

          {/* Preference checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 600, marginRight: 2 }}>Preference:</span>
            {PREFERENCES.map(p => (
              <label key={p.value} className={`checkbox-pill ${(filters.preference || []).includes(p.value) ? 'active' : ''}`}>
                <input type="checkbox" checked={(filters.preference || []).includes(p.value)} onChange={() => togglePref(p.value)} />
                {p.label}
              </label>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              padding:      '6px 12px',
              border:       `1.5px solid ${showAdvanced || hasAdvanced ? '#0A66C2' : '#E0DFDC'}`,
              borderRadius: 20,
              background:   showAdvanced || hasAdvanced ? '#EAF0FA' : '#fff',
              color:        showAdvanced || hasAdvanced ? '#0A66C2' : '#666',
              fontSize:     13,
              fontWeight:   600,
              cursor:       'pointer',
              fontFamily:   'var(--font)',
              transition:   'all 0.15s ease',
            }}
          >
            <SlidersHorizontal size={14} />
            Advanced Filters
            {hasAdvanced && <span style={{ background: '#0A66C2', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
          </button>
        </div>

        {/* Advanced filters panel */}
        {showAdvanced && (
          <div style={{
            borderTop: '1px solid #F0EFEC',
            padding:   '12px 0 14px',
            display:   'flex',
            gap:       12,
            flexWrap:  'wrap',
          }}>
            <AdvancedInput
              placeholder="Filter by Company name..."
              value={filters.company}
              onChange={v => onFilterChange({ company: v })}
            />
            <AdvancedInput
              placeholder="Filter by Designation..."
              value={filters.designation}
              onChange={v => onFilterChange({ designation: v })}
            />
            {hasAdvanced && (
              <button
                onClick={() => onFilterChange({ company: '', designation: '' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 12px', border: '1.5px solid #E0DFDC',
                  borderRadius: 20, background: '#fff', color: '#CC1016',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const selected = options.find(o => o.value === value);
  const isActive = value !== 'all' && value !== '';
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding:      '6px 28px 6px 12px',
          border:       `1.5px solid ${isActive ? '#0A66C2' : '#E0DFDC'}`,
          borderRadius: 20,
          background:   isActive ? '#EAF0FA' : '#fff',
          color:        isActive ? '#0A66C2' : '#444',
          fontSize:     13,
          fontWeight:   600,
          cursor:       'pointer',
          fontFamily:   'var(--font)',
          appearance:   'none',
          outline:      'none',
          transition:   'all 0.15s ease',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{
        position: 'absolute', right: 8, top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
        color: isActive ? '#0A66C2' : '#666',
      }} />
    </div>
  );
}

function AdvancedInput({ placeholder, value, onChange }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding:      '7px 14px',
        border:       `1.5px solid ${value ? '#0A66C2' : '#E0DFDC'}`,
        borderRadius: 20,
        fontSize:     13,
        fontFamily:   'var(--font)',
        outline:      'none',
        width:        240,
        background:   value ? '#EAF0FA' : '#fff',
        color:        value ? '#0A66C2' : '#444',
        transition:   'all 0.15s ease',
      }}
      onFocus={e => { e.target.style.borderColor = '#0A66C2'; }}
      onBlur={e => { if (!value) e.target.style.borderColor = '#E0DFDC'; }}
    />
  );
}
