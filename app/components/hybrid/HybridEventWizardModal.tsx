"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  previewMatchCount,
  publishMatchRequest,
  type PhotographerType,
  type LocationCoverage,
} from '@/app/lib/hybridBooking';
import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';

interface HybridEventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (eventId: string) => void;
}

/** "100000" -> "100,000" for display; empty stays empty. */
const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString('en-US') : '');

export default function HybridEventWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: HybridEventWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Event fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Celebration');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('Kigali');
  const [description, setDescription] = useState('');

  // Step 2: Photographer requirements
  const [photographerType, setPhotographerType] = useState<PhotographerType>('ANY');
  const [minBudget, setMinBudget] = useState('100000');
  const [maxBudget, setMaxBudget] = useState('200000');
  const [locationCoverage, setLocationCoverage] = useState<LocationCoverage>('SAME_CITY');

  // Live match state
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchFailed, setMatchFailed] = useState(false);
  // Set once the event exists, so retrying a failed publish alerts
  // photographers for that event instead of creating a second one.
  const createdEventIdRef = useRef<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounced match preview
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMatchCount = useCallback(async () => {
    if (!date) return;
    setMatchLoading(true);
    try {
      const res = await previewMatchCount({
        eventDate: date,
        startTime: `${startTime}:00`,
        endTime: endTime ? `${endTime}:00` : undefined,
        city: city.trim() || undefined,
        photographerType,
        minBudget: Number(minBudget) || undefined,
        maxBudget: Number(maxBudget) || undefined,
        specialty: category,
        locationCoverage,
      });
      setMatchCount(res.count);
      setMatchFailed(false);
    } catch {
      // Not a count: say it couldn't be counted rather than show a number.
      setMatchCount(null);
      setMatchFailed(true);
    } finally {
      setMatchLoading(false);
    }
  }, [date, startTime, endTime, city, photographerType, minBudget, maxBudget, category, locationCoverage]);

  useEffect(() => {
    if (!isOpen || step !== 2) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchMatchCount();
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen, step, fetchMatchCount]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!title.trim()) {
        setErrorMsg('Please enter an event title.');
        return;
      }
      if (!date) {
        setErrorMsg('Please select an event date.');
        return;
      }
      if (!venueName.trim()) {
        setErrorMsg('Please enter the venue name or address.');
        return;
      }
      setStep(2);
      fetchMatchCount();
    } else if (step === 2) {
      const min = Number(minBudget);
      const max = Number(maxBudget);
      if (min < 0 || max <= 0 || min > max) {
        setErrorMsg('Please enter a valid budget range (Min ≤ Max).');
        return;
      }
      setStep(3);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let eventId = createdEventIdRef.current;
      if (!eventId) {
        // Same route the client events page uses; the proxy only forwards
        // api/remote/ paths, and there is no POST /events on the backend.
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/events/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            eventType: category,
            eventDate: date,
            startTime: `${startTime}:00`,
            endTime: endTime ? `${endTime}:00` : undefined,
            location: [venueName, city].filter((x) => x.trim()).join(', '),
            // Kept off public listings until a photographer is assigned.
            eventVisibility: 'PRIVATE',
          }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || body?.action !== 1) {
          throw new Error(body?.message || 'Could not create your event. Please try again.');
        }
        eventId = String(body?.data?.event?.id || body?.data?.eventId || body?.data?.id || '');
        if (!eventId) throw new Error('Could not create your event. Please try again.');
        createdEventIdRef.current = eventId;
      }

      try {
        await publishMatchRequest(eventId, {
          photographerType,
          minBudget: Number(minBudget) || undefined,
          maxBudget: Number(maxBudget) || undefined,
          currency: 'RWF',
          locationCoverage,
          specialty: category,
          city: city.trim() || undefined,
          venue: venueName.trim() || undefined,
          expirationHours: 24,
        });
      } catch (e: any) {
        throw new Error(
          `Your event was saved, but photographers weren't alerted: ${e?.message || 'please try again'}. ` +
            'Press Post again to retry.',
        );
      }

      createdEventIdRef.current = null;
      onSuccess(eventId);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error publishing event. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          maxWidth: '680px',
          maxHeight: '92vh',
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
        {/* Modal Header & Stepper */}
        <div
          style={{
            padding: '1.5rem 2rem 1.25rem',
            borderBottom: '1px solid #F1F5F9',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#F20C8F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(242, 12, 143, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                Hybrid Booking
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                Step {step} of 3
              </span>
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

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#083A85', margin: 0 }}>
            {step === 1 && 'Create your event'}
            {step === 2 && 'Who do you want to book?'}
            {step === 3 && 'Review brief & publish'}
          </h2>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: step >= s ? '#083A85' : '#E2E8F0',
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: '10px',
                color: '#991B1B',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="bi bi-exclamation-circle-fill" /> {errorMsg}
            </div>
          )}

          {/* ── STEP 1: EVENT DETAILS ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Event Name *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Birthday Celebration, Product Launch"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    color: '#0F172A',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Event Type / Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <option value="Celebration">Celebration / Party</option>
                    <option value="Wedding">Wedding / Ceremony</option>
                    <option value="Corporate">Corporate / Conference</option>
                    <option value="Portrait">Portrait / Studio</option>
                    <option value="Concert">Concert / Live Show</option>
                    <option value="Sports">Sports / Fitness</option>
                    <option value="Fashion">Fashion / Editorial</option>
                    <option value="Other">Other Event</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Kigali Convention Centre"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kigali"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                  Brief Notes / Special Requests (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell photographers about specific shots, indoor/outdoor lighting, dress codes, etc."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: PHOTOGRAPHER REQUIREMENTS & LIVE MATCH COUNT ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Live Match Counter Banner (Slide 04) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(8, 58, 133, 0.08) 0%, rgba(242, 12, 143, 0.08) 100%)',
                  borderRadius: '16px',
                  border: '1.5px solid rgba(8, 58, 133, 0.16)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083A85', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Live Server Eligibility Engine
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#083A85' }}>
                      {matchLoading ? '...' : (matchCount ?? '–')}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>
                      photographers currently match
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                    <span>✓ Available on {date || 'date'}</span>
                    <span>✓ Type matched</span>
                    <span>✓ Budget compatible</span>
                    <span>✓ Instagram portfolio eligible</span>
                  </div>
                  {matchFailed && !matchLoading && (
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}>
                      Couldn&apos;t count matching photographers right now. You can still post your event.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#083A85',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 8px 16px rgba(8, 58, 133, 0.25)',
                  }}
                >
                  <i className="bi bi-radar" />
                </div>
              </div>

              {/* Photographer Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                  Photographer Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {(['FREELANCER', 'STUDIO', 'ANY'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPhotographerType(t)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `2px solid ${photographerType === t ? '#083A85' : '#E2E8F0'}`,
                        backgroundColor: photographerType === t ? 'rgba(8, 58, 133, 0.05)' : '#FFFFFF',
                        color: photographerType === t ? '#083A85' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t === 'FREELANCER' && 'Freelancer'}
                      {t === 'STUDIO' && 'Studio / Agency'}
                      {t === 'ANY' && 'Any Type'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                  Budget Range (RWF)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Min Budget</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      // State keeps plain digits; the field shows thousands separators.
                      value={withCommas(minBudget)}
                      onChange={(e) => setMinBudget(e.target.value.replace(/\D/g, ''))}
                      placeholder="100,000"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.9rem',
                        color: '#0F172A',
                        outline: 'none',
                        marginTop: '4px',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Max Budget</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      // State keeps plain digits; the field shows thousands separators.
                      value={withCommas(maxBudget)}
                      onChange={(e) => setMaxBudget(e.target.value.replace(/\D/g, ''))}
                      placeholder="200,000"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.9rem',
                        color: '#0F172A',
                        outline: 'none',
                        marginTop: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Location Coverage */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                  Location Coverage
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {([
                    { key: 'SAME_CITY', label: 'Same City (≤25km)' },
                    { key: 'NEARBY_CITY', label: 'Nearby City (≤60km)' },
                    { key: 'ANY', label: 'Nationwide' },
                  ] as const).map((loc) => (
                    <button
                      key={loc.key}
                      type="button"
                      onClick={() => setLocationCoverage(loc.key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `2px solid ${locationCoverage === loc.key ? '#083A85' : '#E2E8F0'}`,
                        backgroundColor: locationCoverage === loc.key ? 'rgba(8, 58, 133, 0.05)' : '#FFFFFF',
                        color: locationCoverage === loc.key ? '#083A85' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: REVIEW & PUBLISH ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Event</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#083A85' }}>{title}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: '999px' }}>
                    {category}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>DATE & TIME</span>
                    <strong style={{ color: '#1E293B' }}>{date} • {startTime} - {endTime}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>VENUE</span>
                    <strong style={{ color: '#1E293B' }}>{venueName}, {city}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>BUDGET RANGE</span>
                    <strong style={{ color: '#083A85' }}>
                      {Number(minBudget).toLocaleString()} - {Number(maxBudget).toLocaleString()} RWF
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>COVERAGE</span>
                    <strong style={{ color: '#1E293B' }}>{locationCoverage.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>

              {/* Matched Photographers Notice */}
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  borderRadius: '12px',
                  border: '1px solid #10B981',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '24px', color: '#10B981' }}>
                  <i className="bi bi-check-circle-fill" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#065F46' }}>
                    {matchCount !== null
                      ? `${matchCount} photographer${matchCount === 1 ? '' : 's'} currently match; the best-ranked are alerted first`
                      : 'Matching photographers will be alerted'}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#047857' }}>
                    They will review your date and budget, then approve their availability. You can review candidate portfolios and make your choice with escrow protection.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#FAFCFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => ((s - 1) as 1 | 2))}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(8, 58, 133, 0.25)',
              }}
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 130%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                boxShadow: '0 4px 15px rgba(242, 12, 143, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {submitting ? (
                <>
                  <span className="ck-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff' }} />
                  Publishing Brief...
                </>
              ) : (
                <>
                  <i className="bi bi-broadcast" />
                  Publish Brief & Alert Photographers
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
