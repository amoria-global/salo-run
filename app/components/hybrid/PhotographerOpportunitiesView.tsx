"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  getPhotographerOpportunities,
  approveOpportunity,
  rejectOpportunity,
  type PhotographerOpportunity,
} from '@/app/lib/hybridBooking';

function OpportunityCountdown({
  expiresAt,
  candidateExpiresAt,
  onExpire,
}: {
  expiresAt?: string;
  candidateExpiresAt?: string;
  onExpire?: () => void;
}) {
  const targetTime = candidateExpiresAt || expiresAt;

  const calculateRemaining = useCallback(() => {
    if (!targetTime) return 0;
    const diff = Math.floor((new Date(targetTime).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [targetTime]);

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    setSecondsLeft(calculateRemaining());
    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateRemaining, onExpire]);

  const isExpired = secondsLeft <= 0;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 120; // under 2 min
  const isWarning = secondsLeft > 120 && secondsLeft <= 300; // under 5 min

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (isExpired) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '999px',
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          fontSize: '0.74rem',
          fontWeight: 800,
          border: '1px solid #FCA5A5',
        }}
      >
        <i className="bi bi-clock-history" />
        <span>Timed Out</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.74rem',
        fontWeight: 800,
        backgroundColor: isUrgent ? '#FEE2E2' : isWarning ? '#FEF3C7' : '#EFF6FF',
        color: isUrgent ? '#DC2626' : isWarning ? '#D97706' : '#2563EB',
        border: `1px solid ${isUrgent ? '#F87171' : isWarning ? '#FCD34D' : '#BFDBFE'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <i className={isUrgent ? 'bi bi-fire' : 'bi bi-stopwatch'} />
      <span>
        {isUrgent ? '🔥 Expiring soon: ' : '⏱️ Remaining: '}
        {formattedTime}
      </span>
    </div>
  );
}

export default function PhotographerOpportunitiesView() {
  const [opportunities, setOpportunities] = useState<PhotographerOpportunity[]>([]);
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      const data = await getPhotographerOpportunities();
      setOpportunities(data.filter((o) => o.status === 'PENDING' || o.status === 'INVITED'));
    } catch (e: any) {
      // Keep what's on screen, but say the list couldn't be refreshed.
      setNotice({ type: 'error', message: e?.message || 'Could not load opportunities.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 15000);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  const handleExpire = (oppId: string) => {
    setExpiredIds((prev) => new Set(prev).add(oppId));
  };

  const handleApprove = async (opp: PhotographerOpportunity) => {
    const targetId = opp.candidateId || opp.opportunityId;
    setActionLoadingId(targetId);
    setNotice(null);

    // Optimistic removal
    const previous = [...opportunities];
    setOpportunities((prev) => prev.filter((o) => (o.candidateId || o.opportunityId) !== targetId));

    try {
      await approveOpportunity(targetId);
      setNotice({
        type: 'success',
        message: `Great! You confirmed availability for "${opp.eventTitle}". The client has been notified.`,
      });
    } catch (e: any) {
      // Rollback on error
      setOpportunities(previous);
      setNotice({
        type: 'error',
        message: e.message || 'Could not accept opportunity. Please try again.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (opp: PhotographerOpportunity) => {
    const targetId = opp.candidateId || opp.opportunityId;
    setActionLoadingId(targetId);
    setNotice(null);

    // Optimistic removal
    const previous = [...opportunities];
    setOpportunities((prev) => prev.filter((o) => (o.candidateId || o.opportunityId) !== targetId));

    try {
      await rejectOpportunity(targetId);
      setNotice({
        type: 'success',
        message: `Opportunity for "${opp.eventTitle}" declined. Queue will backfill next creator.`,
      });
    } catch (e: any) {
      // Rollback on error
      setOpportunities(previous);
      setNotice({
        type: 'error',
        message: e.message || 'Could not decline opportunity.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
        <div className="ck-spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 12px' }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading incoming opportunities...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Notice Banner */}
      {notice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: notice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${notice.type === 'success' ? '#10B981' : '#F87171'}`,
            borderRadius: '12px',
            color: notice.type === 'success' ? '#047857' : '#991B1B',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Subheader info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#083A85', margin: '0 0 2px' }}>
            Open Client Opportunities ({opportunities.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            Events posted by clients matching your location, availability, and rate bracket.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchOpportunities();
          }}
          style={{
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#083A85',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {/* Empty State */}
      {opportunities.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px dashed #CBD5E1',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(8, 58, 133, 0.06)',
              color: '#083A85',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              margin: '0 auto 14px',
            }}
          >
            <i className="bi bi-bell" />
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#083A85', margin: '0 0 4px' }}>
            No pending opportunities
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, maxWidth: '420px', marginInline: 'auto' }}>
            When clients post events matching your date availability and coverage in your city, alerts will appear here in real-time.
          </p>
        </div>
      ) : (
        /* Opportunities Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {opportunities.map((opp) => {
            const oppId = opp.candidateId || opp.opportunityId;
            const isCardExpired = expiredIds.has(oppId);

            return (
              <div
                key={opp.opportunityId}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: isCardExpired ? '1.5px solid #FCA5A5' : '1.5px solid rgba(8, 58, 133, 0.14)',
                  padding: '1.5rem',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isCardExpired ? 0.75 : 1,
                  transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isCardExpired) {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 25px -8px rgba(8, 58, 133, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCardExpired) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.04)';
                  }
                }}
              >
                {/* Top Accent Bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: isCardExpired
                      ? '#EF4444'
                      : 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                  }}
                />

                <div>
                  {/* Header: Title + Category */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {opp.eventTitle}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    >
                      {opp.eventType}
                    </span>
                  </div>

                  {/* Countdown Timer Badge */}
                  <div style={{ marginBottom: '10px' }}>
                    <OpportunityCountdown
                      expiresAt={opp.expiresAt}
                      candidateExpiresAt={opp.candidateExpiresAt}
                      onExpire={() => handleExpire(oppId)}
                    />
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: '#475569', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-calendar3" style={{ color: '#083A85' }} />
                      <span>{opp.eventDate} • {opp.startTime}{opp.endTime ? ` - ${opp.endTime}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-geo-alt" style={{ color: '#083A85' }} />
                      <span>
                        {[opp.venue, opp.city].filter(Boolean).join(', ') || 'Location shared after booking'}
                        {opp.distanceKm !== undefined ? ` (${opp.distanceKm.toFixed(1)} km away)` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Client Budget
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#083A85' }}>
                      {opp.minBudget !== undefined && opp.maxBudget !== undefined
                        ? `${opp.minBudget.toLocaleString()} - ${opp.maxBudget.toLocaleString()} ${opp.currency || 'RWF'}`
                        : 'Open budget'}
                    </span>
                  </div>

                  {/* "Why you match" Checklist */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Why you match
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                      {opp.matchReasons.map((reason, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="bi bi-check-circle-fill" style={{ fontSize: '12px', color: '#10B981' }} />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    type="button"
                    onClick={() => handleReject(opp)}
                    disabled={actionLoadingId === oppId || isCardExpired}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: isCardExpired ? '#94A3B8' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: actionLoadingId === oppId || isCardExpired ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(opp)}
                    disabled={actionLoadingId === oppId || isCardExpired}
                    style={{
                      flex: 1.6,
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: isCardExpired
                        ? '#E2E8F0'
                        : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: isCardExpired ? '#94A3B8' : '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: actionLoadingId === oppId || isCardExpired ? 'not-allowed' : 'pointer',
                      boxShadow: isCardExpired ? 'none' : '0 4px 10px rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {actionLoadingId === oppId ? (
                      <>
                        <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} />
                        Sending...
                      </>
                    ) : isCardExpired ? (
                      <>
                        <i className="bi bi-x-circle" />
                        Expired
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2" />
                        I&apos;m Available
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
  );
}

