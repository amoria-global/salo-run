import React from 'react';

interface ClientItemProps {
  name: string;
  event: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  avatar: string;
  onMenuClick?: () => void;
}

export const ClientItem: React.FC<ClientItemProps> = ({
  name,
  event,
  status,
  avatar,
  onMenuClick
}) => {
  const getStatusClass = () => {
    switch (status) {
      case 'In Progress':
        return 'bg-pink-50 text-pink-600';
      case 'Completed':
        return 'bg-green-50 text-green-600';
      case 'Pending':
        return 'bg-amber-50 text-amber-600';
      default:
        return '';
    }
  };

  const getStatusStyle = () => {
    switch (status) {
      case 'In Progress':
        return { backgroundColor: '#FCE7F3', color: '#DB2777' };
      case 'Completed':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'Pending':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      default:
        return {};
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        transition: 'background-color 0.3s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <img
        src={avatar}
        alt={name}
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '9999px',
          objectFit: 'cover'
        }}
      />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem'
      }}>
        <span style={{
          fontSize: '1rem',
          lineHeight: '1.25rem',
          fontWeight: '700',
          color: '#111827'
        }}>{name}</span>
        <span style={{
          fontSize: '0.85rem',
          lineHeight: '1rem',
          color: '#6B7280'
        }}>{event}</span>
      </div>
      <span style={{
        paddingLeft: '0.625rem',
        paddingRight: '0.625rem',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        borderRadius: '0.25rem',
        fontSize: '0.85rem',
        lineHeight: '1rem',
        fontWeight: '600',
        ...getStatusStyle()
      }}>{status}</span>
      <button
        style={{
          padding: '0.25rem',
          color: '#9CA3AF',
          fontSize: '1.25rem',
          lineHeight: '1.75rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          transition: 'color 0.3s'
        }}
        onClick={onMenuClick}
        onMouseEnter={(e) => e.currentTarget.style.color = '#4B5563'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
      >
        <span>⋮</span>
      </button>
    </div>
  );
};
