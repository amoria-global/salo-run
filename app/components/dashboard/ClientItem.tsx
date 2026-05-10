import React from 'react';

interface ClientItemProps {
  name: string;
  event: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  avatar: string;
  onMenuClick?: () => void;
}

const statusStyle = (status: string): { background: string; color: string } => {
  switch (status) {
    case 'In Progress': return { background: 'rgba(242,12,143,0.10)', color: '#F20C8F' };
    case 'Completed':   return { background: '#ECFDF5', color: '#065F46' };
    case 'Pending':     return { background: '#FFFBEB', color: '#92400E' };
    default:            return { background: 'var(--ck-surface-muted)', color: 'var(--ck-text-soft)' };
  }
};

export const ClientItem: React.FC<ClientItemProps> = ({ name, event, status, avatar, onMenuClick }) => {
  const ss = statusStyle(status);
  return (
    <div className="ck-row" style={{ gap: 12 }}>
      <img
        src={avatar}
        alt={name}
        style={{ width: 36, height: 36, borderRadius: 9999, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ck-text)' }}>{name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ck-text-soft)', marginTop: 1 }}>{event}</div>
      </div>
      <span className="ck-pill" style={{ background: ss.background, color: ss.color, padding: '3px 9px' }}>{status}</span>
      <button
        onClick={onMenuClick}
        aria-label="More"
        style={{
          width: 28, height: 28, borderRadius: 9999,
          border: 'none', background: 'transparent', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ck-text-muted)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <i className="bi bi-three-dots" />
      </button>
    </div>
  );
};
