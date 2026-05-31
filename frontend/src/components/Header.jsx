import React, { useState, useRef } from 'react';
import { Search, LayoutDashboard, UserPlus, Tag, Upload, X, Download } from 'lucide-react';

export default function Header({
  filters,
  searchDraft,
  setSearchDraft,
  onSearch,
  onFilterChange,
  onAddContact,
  onAddBrand,
  onUpload,
  onDownload,
  downloading,
}) {
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { onUpload(file); e.target.value = ''; }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  const handleClear = () => {
    setSearchDraft('');
    // Also clear committed search and re-fetch
    onFilterChange({ search: '' });
    // Submit empty search
    setTimeout(() => onSearch(), 0);
  };

  return (
    <header style={{
      background:   '#fff',
      borderBottom: '1px solid #E0DFDC',
      position:     'sticky',
      top:          0,
      zIndex:       100,
      boxShadow:    '0 1px 4px rgba(0,0,0,0.08)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

        {/* App title */}
        <div style={{ textAlign: 'center', padding: '16px 0 10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#0A66C2', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily:    'var(--font-serif)',
              fontSize:      22,
              fontWeight:    600,
              color:         '#1D2226',
              letterSpacing: '-0.3px',
            }}>
              LinkedIn Contact Manager
            </h1>
          </div>
        </div>

        {/* Search + Action buttons row */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            8,
          paddingBottom:  12,
        }}>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
            <input
              type="text"
              placeholder="Search by name, company, designation... (press Enter)"
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width:        '100%',
                padding:      '10px 36px 10px 14px',
                border:       '1.5px solid #E0DFDC',
                borderRadius: 24,
                fontSize:     14,
                fontFamily:   'var(--font)',
                outline:      'none',
                transition:   'border-color 0.15s ease, box-shadow 0.15s ease',
                background:   '#F3F2EF',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#0A66C2';
                e.target.style.background  = '#fff';
                e.target.style.boxShadow   = '0 0 0 2px rgba(10,102,194,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E0DFDC';
                e.target.style.background  = '#F3F2EF';
                e.target.style.boxShadow   = 'none';
              }}
            />
            {searchDraft && (
              <X
                size={14}
                onClick={handleClear}
                style={{
                  position:  'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#999',
                  cursor:    'pointer',
                }}
              />
            )}
          </div>

          {/* Search submit button */}
          <ActionBtn
            icon={<Search size={18} />}
            label="Search"
            onClick={onSearch}
            color="#0A66C2"
            filled
          />

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: '#E0DFDC', margin: '0 2px' }} />

          {/* Dashboard reset */}
          <ActionBtn
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            onClick={() => {
              setSearchDraft('');
              onFilterChange({ search: '', location: 'all', contact: 'all', preference: [], company: '', designation: '' });
            }}
          />

          {/* Add Contact */}
          <ActionBtn
            icon={<UserPlus size={18} />}
            label="Add Contact"
            onClick={onAddContact}
            color="#0A66C2"
          />

          {/* Add Brand */}
          <ActionBtn
            icon={<Tag size={18} />}
            label="Add Brand"
            onClick={onAddBrand}
            color="#057642"
          />

          {/* Upload CSV */}
          <ActionBtn
            icon={<Upload size={18} />}
            label="Upload CSV"
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Download CSV */}
          <ActionBtn
            icon={downloading ? <span style={{ width: 18, height: 18, border: '2px solid #E0DFDC', borderTopColor: '#057642', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <Download size={18} />}
            label={downloading ? 'Downloading...' : 'Download CSV'}
            onClick={onDownload}
            color="#057642"
            disabled={downloading}
          />

        </div>
      </div>
    </header>
  );
}

function ActionBtn({ icon, label, onClick, color, filled, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      data-tooltip={label}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:           40,
        height:          40,
        borderRadius:    '50%',
        border:          '1.5px solid',
        borderColor:     filled
          ? (color || '#0A66C2')
          : hovered ? (color || '#666') : '#E0DFDC',
        background:      filled
          ? (hovered ? (color === '#0A66C2' ? '#004182' : color) : (color || '#0A66C2'))
          : hovered ? (color ? `${color}15` : '#F3F2EF') : '#fff',
        color:           filled
          ? '#fff'
          : hovered ? (color || '#444') : '#666',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        transition:      'all 0.15s ease',
        flexShrink:      0,
        opacity:         disabled ? 0.6 : 1,
      }}
    >
      {icon}
    </button>
  );
}
