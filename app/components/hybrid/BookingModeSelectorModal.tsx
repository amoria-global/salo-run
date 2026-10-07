"use client";

import React from 'react';

interface BookingModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDirect: () => void;
  onSelectHybrid: () => void;
}

export default function BookingModeSelectorModal({
  isOpen,
  onClose,
  onSelectDirect,
  onSelectHybrid,
}: BookingModeSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 20, 48, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(8, 58, 133, 0.25)',
          border: '1px solid rgba(8, 58, 133, 0.12)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(8, 58, 133, 0.06)',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(242, 12, 143, 0.08)',
              color: '#F20C8F',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.5rem',
            }}
          >
            New Booking
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#083A85',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            How do you want to find your photographer?
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#64748B',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Choose between direct selection or let Connekyt match verified local pros to your budget and schedule.
          </p>
        </div>

        {/* Options Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 01: Direct Option */}
          <button
            onClick={() => {
              onClose();
              onSelectDirect();
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.25rem',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '2px solid rgba(8, 58, 133, 0.15)',
              backgroundColor: '#FAFCFF',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#083A85';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(8, 58, 133, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              <i className="bi bi-person-badge" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083A85' }}>
                  Find a Photographer
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#E2E8F0',
                    color: '#475569',
                  }}
                >
                  DIRECT
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                Browse, filter, and book directly from individual photographer profiles and packages.
              </p>
            </div>
          </button>

          {/* 02: Hybrid Option */}
          <button
            onClick={() => {
              onClose();
              onSelectHybrid();
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.25rem',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '2px solid rgba(242, 12, 143, 0.25)',
              background: 'linear-gradient(135deg, rgba(242, 12, 143, 0.03) 0%, rgba(8, 58, 133, 0.05) 100%)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F20C8F';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(242, 12, 143, 0.20)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(242, 12, 143, 0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 130%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              <i className="bi bi-broadcast" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083A85' }}>
                  Post My Event
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#FCE7F3',
                    color: '#BE185D',
                  }}
                >
                  RECOMMENDED • HYBRID
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                Create the event brief first. Connekyt instantly alerts verified nearby photographers who match your budget and date.
              </p>
            </div>
          </button>
        </div>

        {/* Footer trust badge */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          <span>✓ Escrow Protected</span>
          <span>•</span>
          <span>✓ Verified Portfolios</span>
          <span>•</span>
          <span>✓ Zero Duplicate Booking</span>
        </div>
      </div>
    </div>
  );
}
