import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange, onLimitChange }) {
  const { page, totalPages, total, limit } = pagination;

  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '14px 20px',
      background:      '#fff',
      border:          '1px solid #E0DFDC',
      borderRadius:    10,
      marginTop:       12,
      flexWrap:        'wrap',
      gap:             10,
    }}>
      {/* Records per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666' }}>
        <span>Show</span>
        <select
          value={limit}
          onChange={e => onLimitChange(Number(e.target.value))}
          style={{
            padding: '4px 8px', border: '1.5px solid #E0DFDC',
            borderRadius: 6, fontSize: 13, fontFamily: 'var(--font)',
            color: '#444', outline: 'none', cursor: 'pointer',
          }}
        >
          {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>of <strong>{total.toLocaleString()}</strong> contacts</span>
      </div>

      {/* Page controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PageBtn icon={<ChevronsLeft size={15} />} onClick={() => onPageChange(1)}         disabled={page === 1} />
        <PageBtn icon={<ChevronLeft size={15} />}  onClick={() => onPageChange(page - 1)}  disabled={page === 1} />

        <div style={{ display: 'flex', gap: 3 }}>
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} style={{ padding: '6px 4px', color: '#999', fontSize: 13 }}>…</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p)} style={{
                width: 32, height: 32, borderRadius: 6,
                border: `1.5px solid ${p === page ? '#0A66C2' : '#E0DFDC'}`,
                background: p === page ? '#0A66C2' : '#fff',
                color: p === page ? '#fff' : '#444',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: p === page ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
                {p}
              </button>
            )
          )}
        </div>

        <PageBtn icon={<ChevronRight size={15} />}  onClick={() => onPageChange(page + 1)}    disabled={page >= totalPages} />
        <PageBtn icon={<ChevronsRight size={15} />} onClick={() => onPageChange(totalPages)}   disabled={page >= totalPages} />
      </div>

      {/* Page info */}
      <div style={{ fontSize: 13, color: '#666' }}>
        Page <strong>{page}</strong> of <strong>{totalPages.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function PageBtn({ icon, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 32, height: 32, borderRadius: 6,
      border: '1.5px solid #E0DFDC',
      background: disabled ? '#F8F7F4' : '#fff',
      color: disabled ? '#ccc' : '#444',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = '#0A66C2'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0DFDC'; }}
    >
      {icon}
    </button>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', current-1, current, current+1, '...', total];
}
