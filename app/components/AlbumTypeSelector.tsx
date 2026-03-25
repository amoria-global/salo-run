'use client';

import React from 'react';

export type AlbumType = 'PAID' | 'FREE';

interface AlbumTypeSelectorProps {
  selectedType: AlbumType;
  onChange: (type: AlbumType) => void;
  disabled?: boolean;
}

const AlbumTypeSelector: React.FC<AlbumTypeSelectorProps> = ({
  selectedType,
  onChange,
  disabled = false,
}) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
        Album Type *
      </label>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* PAID Album Option */}
        <button
          type="button"
          onClick={() => !disabled && onChange('PAID')}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '1rem',
            border: `2px solid ${selectedType === 'PAID' ? '#3b82f6' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            background: selectedType === 'PAID' ? 'rgba(59, 130, 246, 0.1)' : '#ffffff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div
              style={{
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '50%',
                border: `2px solid ${selectedType === 'PAID' ? '#3b82f6' : '#d1d5db'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selectedType === 'PAID' && (
                <div
                  style={{
                    width: '0.625rem',
                    height: '0.625rem',
                    borderRadius: '50%',
                    background: '#3b82f6',
                  }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                PAID Album
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4 }}>
                • Publicly searchable via facial recognition<br />
                • 30% platform commission<br />
                • Set price per image
              </div>
            </div>
          </div>
        </button>

        {/* FREE Album Option */}
        <button
          type="button"
          onClick={() => !disabled && onChange('FREE')}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '1rem',
            border: `2px solid ${selectedType === 'FREE' ? '#10b981' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            background: selectedType === 'FREE' ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div
              style={{
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '50%',
                border: `2px solid ${selectedType === 'FREE' ? '#10b981' : '#d1d5db'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selectedType === 'FREE' && (
                <div
                  style={{
                    width: '0.625rem',
                    height: '0.625rem',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                FREE Album
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4 }}>
                • Private link with email verification<br />
                • 0% commission (100% free)<br />
                • Single recipient access
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AlbumTypeSelector;
