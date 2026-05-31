import React from 'react';
import { Users, Mail, Phone, Linkedin } from 'lucide-react';

export default function StatsBar({ stats, loading }) {
  const cards = [
    { label: 'Total Contacts', value: stats.total,        icon: <Users size={20} />,    color: '#0A66C2', bg: '#EAF0FA' },
    { label: 'With Email',     value: stats.withEmail,    icon: <Mail size={20} />,     color: '#057642', bg: '#E8F5EE' },
    { label: 'With Phone',     value: stats.withPhone,    icon: <Phone size={20} />,    color: '#B37700', bg: '#FDF3DC' },
    { label: 'With LinkedIn',  value: stats.withLinkedin, icon: <Linkedin size={20} />, color: '#0A66C2', bg: '#EAF0FA' },
  ];

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap:                 12,
      padding:             '16px 0',
    }}>
      {cards.map(card => (
        <div key={card.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: card.bg, color: card.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {card.icon}
          </div>
          <div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: '#1D2226',
              fontVariantNumeric: 'tabular-nums',
              opacity: loading ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}>
              {loading ? '...' : (card.value || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: '#666', fontWeight: 500, marginTop: 1 }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
