"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getEventCandidates, selectEventPhotographer, type CandidateSummary } from '@/app/lib/hybridBooking';
import { normalizeImageUrl } from '@/lib/api';

interface CandidatesShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventStatus?: string;
  latitude?: number | null;
  longitude?: number | null;
  eventDate?: string | null;
  onPhotographerSelected: (photographerId: string, result: any, candidate?: CandidateSummary) => void;
}

export default function CandidatesShortlistModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventStatus,
  latitude,
  longitude,
  eventDate,
  onPhotographerSelected,
}: CandidatesShortlistModalProps) {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await getEventCandidates(eventId);
      setCandidates(data);
    } catch (e: any) {
      // Keep what's on screen, but say the list couldn't be refreshed.
      setStatusNotice({ type: 'error', message: e?.message || 'Could not load candidates.' });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchCandidates();

    // Auto-refresh candidates list every 12 seconds
    const interval = setInterval(fetchCandidates, 12000);
    return () => clearInterval(interval);
  }, [isOpen, fetchCandidates]);

  if (!isOpen) return null;

  const handleSelect = async (candidate: CandidateSummary) => {
    setSelectingId(candidate.photographerId);
    setStatusNotice(null);
    try {
      const result = await selectEventPhotographer(eventId, {
        candidateId: candidate.candidateId,
        photographerId: candidate.photographerId,
        escrowPercentage: 50,
      });
      onPhotographerSelected(candidate.photographerId, result, candidate);
    } catch (e: any) {
      if (e.code === 'NO_LONGER_AVAILABLE') {
        setStatusNotice({
          type: 'error',
          message: e.message,
        });
        fetchCandidates();
      } else {
        setStatusNotice({
          type: 'error',
          message: e.message || 'Could not select photographer. Please try again.',
        });
      }
    } finally {
      setSelectingId(null);
    }
  };

  const tierBadgeStyle = (tier: string) => {
    if (tier === 'HIGH') {
      return { bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0', label: 'HIGH MATCH' };
    }
    if (tier === 'MEDIUM') {
      return { bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE', label: 'GOOD MATCH' };
    }
    return { bg: '#F5F3FF', fg: '#6D28D9', border: '#DDD6FE', label: 'ELIGIBLE' };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 20, 48, 0.70)',
        backdropFilter: 'blur(8px)',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(8, 58, 133, 0.3)',
          border: '1px solid rgba(8, 58, 133, 0.14)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 2rem 1.25rem',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#083A85',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(8, 58, 133, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                Candidate Shortlist
              </span>
              <span style={{ fontSize: '0.8rem', color: eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION' ? '#7C3AED' : '#10B981', fontWeight: 700 }}>
                {eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION' ? '• Ready for Selection' : '• Live Matching Active'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#083A85', margin: 0 }}>
              {eventTitle || 'Your Event'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#F1F5F9',
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
        </div>

        {/* Notice alert banner */}
        {statusNotice && (
          <div
            style={{
              margin: '1rem 2rem 0',
              padding: '0.75rem 1rem',
              backgroundColor: statusNotice.type === 'error' ? '#FEF2F2' : '#EFF6FF',
              border: `1px solid ${statusNotice.type === 'error' ? '#F87171' : '#93C5FD'}`,
              borderRadius: '10px',
              color: statusNotice.type === 'error' ? '#991B1B' : '#1E40AF',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {statusNotice.message}
          </div>
        )}

        {/* Content list */}
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <div className="ck-spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading responding photographers...</div>
            </div>
          ) : candidates.length === 0 ? (
            (eventStatus === 'HYBRID_TIMEOUT' || eventStatus === 'EXPIRED') ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#64748B' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 16px',
                  }}
                >
                  <i className="bi bi-exclamation-circle-fill" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D97706', margin: '0 0 8px' }}>
                  Matching Window Concluded
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  The 24-hour matching window has ended with 0 accepted photographers. You can instantly switch to Direct Booking to browse and select available creators nearby on our map.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <a
                    href={`/photographers?lat=${latitude ?? -1.9536}&lng=${longitude ?? 30.0606}&eventDate=${encodeURIComponent(eventDate || '')}`}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="bi bi-geo-alt-fill" /> Browse Nearby Photographers
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748B' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(8, 58, 133, 0.06)',
                    color: '#083A85',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 16px',
                  }}
                >
                  <i className="bi bi-hourglass-split" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#083A85', margin: '0 0 6px' }}>
                  Photographers are reviewing your brief
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                  We notified nearby verified photographers. As soon as they confirm their availability, their profiles and proposed rates will appear here in real-time.
                </p>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.85rem 1.1rem',
                  borderRadius: '12px',
                  background: eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION'
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(8, 58, 133, 0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(8, 58, 133, 0.06) 100%)',
                  border: eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION'
                    ? '1px solid rgba(124, 58, 237, 0.20)'
                    : '1px solid rgba(16, 185, 129, 0.20)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION' ? '#EDE9FE' : '#D1FAE5',
                    color: eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION' ? '#7C3AED' : '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  <i className={eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION' ? 'bi bi-check-circle-fill' : 'bi bi-shield-check'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                    {eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION'
                      ? 'Matching Window Concluded: Select Your Preferred Creator'
                      : '100% Escrow Protected Booking'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.35 }}>
                    {eventStatus?.toUpperCase() === 'MATCHES_AWAITING_SELECTION'
                      ? 'Review the verified creators who accepted your brief. Selecting a photographer locks their calendar and establishes your 50% deposit escrow.'
                      : 'Your 50% booking deposit remains safely held in escrow until you approve the final gallery delivery.'}
                  </div>
                </div>
              </div>

              {candidates.map((candidate) => {
                const tier = tierBadgeStyle(candidate.recommendationTier);
                const avatar = normalizeImageUrl(candidate.profilePicture);

                return (
                  <div
                    key={candidate.photographerId}
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1.25rem',
                      backgroundColor: '#FFFFFF',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#083A85';
                      e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(8, 58, 133, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Left: Avatar + Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '16px',
                          backgroundColor: '#E2E8F0',
                          overflow: 'hidden',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        {avatar ? (
                          <Image src={avatar} alt={candidate.photographerName} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#083A85',
                              fontSize: '1.2rem',
                            }}
                          >
                            {candidate.photographerName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                            {candidate.photographerName}
                          </span>
                          {candidate.instagramHandle && (
                            <span
                              title={`Instagram @${candidate.instagramHandle}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#E1306C',
                                background: 'rgba(225, 48, 108, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              <i className="bi bi-instagram" /> @{candidate.instagramHandle}
                            </span>
                          )}
                        </div>

                        {/* Recommendation Tier Badge */}
                        <div style={{ marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              color: tier.fg,
                              backgroundColor: tier.bg,
                              border: `1px solid ${tier.border}`,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {tier.label}
                          </span>
                        </div>

                        {/* Meta: distance & rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#64748B' }}>
                          <span>
                            {candidate.reviewCount
                              ? `★ ${(candidate.rating ?? 0).toFixed(1)} (${candidate.reviewCount} review${candidate.reviewCount === 1 ? '' : 's'})`
                              : 'No reviews yet'}
                          </span>
                          {candidate.distanceKm !== undefined && (
                            <>
                              <span>•</span>
                              <span>{`${candidate.distanceKm.toFixed(1)} km away`}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & CTA */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Typical Rate</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#083A85' }}>
                          {candidate.typicalPriceRange ?? '—'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelect(candidate)}
                        disabled={selectingId === candidate.photographerId}
                        style={{
                          padding: '0.6rem 1.25rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: selectingId === candidate.photographerId ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 10px rgba(8, 58, 133, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {selectingId === candidate.photographerId ? (
                          <>
                            <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} />
                            Selecting...
                          </>
                        ) : (
                          <>
                            Select Photographer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#F8FAFC',
            fontSize: '0.78rem',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Selection locks photographer availability and prompts milestone deposit escrow.</span>
          <button
            onClick={fetchCandidates}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#083A85',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <i className="bi bi-arrow-clockwise" /> Refresh Candidates
          </button>
        </div>
      </div>
    </div>
  );
}
