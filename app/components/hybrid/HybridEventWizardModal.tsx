"use client";

import { WishInvitesField, focusWishInvitesField } from '../wishes/WishInvitesField';
import { wishInvitesError } from '@/lib/wishes/wishInvites';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import {
  budgetLabel,
  durationBetween,
  durationText,
  getHybridOptions,
  previewMatchCount,
  publishMatchRequest,
  type HybridOptions,
  type LocationCoverage,
  type MatchPreviewResult,
  type PhotographerType,
} from '@/app/lib/hybridBooking';
import {
  Chip, FieldLabel, HybridStyles, MODE_META, Notice, OptionCard, useFieldStyle,
} from './hybridUi';

interface HybridEventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after posting; `invitedCount` is how many photographers were alerted. */
  onSuccess: (eventId: string, invitedCount?: number) => void;
  /** Post an existing event again (after a match ended), instead of creating one. */
  existingEvent?: { id: string; title?: string; eventDate?: string; startTime?: string; endTime?: string; city?: string; venue?: string } | null;
}

type Step = 1 | 2 | 3 | 'done';

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: 'Tell us about your event',
  2: 'Who should we look for?',
  3: 'Review and post',
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function nextWeekday(weekday: number, weeksAhead = 0): Date {
  const d = new Date();
  const diff = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff + weeksAhead * 7);
  return d;
}

function timeSlots(step: number): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += step) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

/**
 * Post My Event: the client describes the event, sees how many photographers
 * currently fit (the server's count, from the same engine that sends the
 * alerts), and posts it. Every answer is a choice from a list except the
 * event's name and venue, which only the client knows.
 */
export default function HybridEventWizardModal({ isOpen, onClose, onSuccess, existingEvent }: HybridEventWizardModalProps) {
  const { colors } = useTheme();
  const field = useFieldStyle();
  const [options, setOptions] = useState<HybridOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [title, setTitle] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [city, setCity] = useState('Kigali');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  // Wish invites: no default, so the choice is required before step 1 can continue.
  const [wishInvites, setWishInvites] = useState<boolean | null>(null);
  const [wishInvitesErr, setWishInvitesErr] = useState<string | null>(null);

  // Step 2
  const [photographerType, setPhotographerType] = useState<PhotographerType>('ANY');
  const [budgetIndex, setBudgetIndex] = useState<number>(1);
  const [customBudget, setCustomBudget] = useState(false);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [specialty, setSpecialty] = useState('ANY');
  const [coverage, setCoverage] = useState<LocationCoverage>('SAME_CITY');
  const [windowHours, setWindowHours] = useState(24);

  // Live count
  const [preview, setPreview] = useState<MatchPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{ eventId: string; invited?: number; status?: string } | null>(null);
  const createdEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getHybridOptions().then((o) => { setOptions(o); setWindowHours(o.defaultMatchWindowHours); setOptionsError(null); })
      .catch((e) => setOptionsError(e?.message || 'Could not load the event options.'));
  }, [isOpen]);

  // Reset when reopened; prefill when reposting an existing event.
  useEffect(() => {
    if (!isOpen) return;
    setStep(existingEvent ? 2 : 1);
    setErrorMsg(null);
    setResult(null);
    createdEventIdRef.current = existingEvent?.id ?? null;
    if (existingEvent) {
      setTitle(existingEvent.title || '');
      if (existingEvent.eventDate) setDate(existingEvent.eventDate.slice(0, 10));
      if (existingEvent.startTime) setStartTime(existingEvent.startTime.slice(0, 5));
      if (existingEvent.endTime) setEndTime(existingEvent.endTime.slice(0, 5));
      if (existingEvent.city) setCity(existingEvent.city);
      if (existingEvent.venue) setVenue(existingEvent.venue);
    }
  }, [isOpen, existingEvent]);

  const eventType = options?.eventTypes.find((t) => t.id === eventTypeId);
  const minutes = durationBetween(startTime, endTime);
  const overnight = !!startTime && !!endTime && endTime <= startTime;
  const slots = useMemo(() => timeSlots(options?.timeStepMinutes || 30), [options]);
  const cityInfo = options?.cities.find((c) => c.name === city);

  const budget = useMemo((): { min?: number; max?: number } => {
    if (customBudget) {
      return { min: minBudget ? Number(minBudget) : undefined, max: maxBudget ? Number(maxBudget) : undefined };
    }
    const p = options?.budgetPresets[budgetIndex];
    return { min: p?.min ?? undefined, max: p?.max ?? undefined };
  }, [customBudget, minBudget, maxBudget, options, budgetIndex]);

  const fetchPreview = useCallback(async () => {
    if (!date) return;
    setPreviewLoading(true);
    try {
      const res = await previewMatchCount({
        eventDate: date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        city,
        latitude: cityInfo?.latitude,
        longitude: cityInfo?.longitude,
        photographerType,
        minBudget: budget.min,
        maxBudget: budget.max,
        currency: 'RWF',
        specialty: eventType?.name,
        photographerSpecialty: specialty,
        locationCoverage: coverage,
        eventId: existingEvent?.id,
      });
      setPreview(res);
      setPreviewFailed(false);
    } catch {
      setPreview(null);
      setPreviewFailed(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [date, startTime, endTime, city, cityInfo, photographerType, budget, eventType, specialty, coverage, existingEvent]);

  useEffect(() => {
    if (!isOpen || (step !== 2 && step !== 3)) return;
    const t = setTimeout(fetchPreview, 400);
    return () => clearTimeout(t);
  }, [isOpen, step, fetchPreview]);

  if (!isOpen) return null;

  const validateStep1 = (): string | null => {
    if (!title.trim()) return 'Give your event a name.';
    if (!eventTypeId) return 'Choose the type of event.';
    if (!date) return 'Choose the event date.';
    const today = isoDate(new Date());
    if (date < today) return 'The event date has passed. Choose a future date.';
    if (date === today) {
      const now = new Date();
      if (startTime <= `${pad(now.getHours())}:${pad(now.getMinutes())}`) return 'That start time has passed. Choose a later time.';
    }
    if (!minutes) return 'Choose a start and end time.';
    if (!city) return 'Choose the city.';
    if (!venue.trim()) return 'Add the venue or address so photographers know where to go.';
    const missing = wishInvitesError(wishInvites);
    setWishInvitesErr(missing ?? null);
    if (missing) {
      focusWishInvitesField();
      return missing;
    }
    return null;
  };

  const validateStep2 = (): string | null => {
    if (customBudget) {
      const min = minBudget ? Number(minBudget) : undefined;
      const max = maxBudget ? Number(maxBudget) : undefined;
      if (max !== undefined && max <= 0) return 'The maximum budget must be more than zero.';
      if (min !== undefined && max !== undefined && min > max) return 'The minimum budget is higher than the maximum.';
    }
    return null;
  };

  const goNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) return setErrorMsg(err);
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return setErrorMsg(err);
      setStep(3);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let eventId = createdEventIdRef.current;
      if (!eventId) {
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/events/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: notes.trim() || undefined,
            eventCategoryId: eventTypeId || undefined,
            eventType: eventType?.name,
            eventDate: date,
            startTime: `${startTime}:00`,
            endTime: `${endTime}:00`,
            location: [venue.trim(), city, options?.country].filter(Boolean).join(', '),
            // Not PRIVATE: here that means a self-streamed event that must charge at
            // least 100 RWF, and the backend refused every post. The backend keeps a
            // posted event off public listings until a photographer is booked.
            eventVisibility: 'PUBLIC',
            allowWishInvites: wishInvites === true,
          }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || body?.action !== 1) throw new Error(body?.message || 'Could not create your event. Please try again.');
        eventId = String(body?.data?.event?.id || body?.data?.eventId || body?.data?.id || '');
        if (!eventId) throw new Error('Could not create your event. Please try again.');
        createdEventIdRef.current = eventId;
      }

      let posted;
      try {
        posted = await publishMatchRequest(eventId, {
          photographerType,
          minBudget: budget.min,
          maxBudget: budget.max,
          currency: 'RWF',
          locationCoverage: coverage,
          specialty: eventType?.name,
          photographerSpecialty: specialty,
          city,
          country: options?.country,
          venue: venue.trim() || undefined,
          latitude: cityInfo?.latitude,
          longitude: cityInfo?.longitude,
          instructions: notes.trim() || undefined,
          expirationHours: windowHours,
        });
      } catch (e: any) {
        throw new Error(`Your event was saved, but photographers weren't alerted: ${e?.message || 'please try again'}. Press Post again to retry.`);
      }
      setResult({ eventId, invited: posted.invitedCount, status: posted.status });
      setStep('done');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error posting your event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const finish = () => {
    if (result) onSuccess(result.eventId, result.invited);
    createdEventIdRef.current = null;
    onClose();
  };

  const accent = MODE_META.HYBRID.color;
  const count = preview?.count;
  const zero = count === 0 && !previewLoading;

  // ───────── pieces ─────────

  const Header = (
    <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: `1px solid ${colors.borderPrimary}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span aria-hidden style={{ width: 36, height: 36, borderRadius: 12, background: MODE_META.HYBRID.soft, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            <i className="bi bi-broadcast" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Post My Event{step !== 'done' ? ` · Step ${step} of 3` : ''}
            </div>
            <h2 id="hy-wizard-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary }}>
              {step === 'done' ? 'Your event is posted' : STEP_TITLES[step]}
            </h2>
          </div>
        </div>
        <button type="button" onClick={step === 'done' ? finish : onClose} aria-label="Close" className="hy-focus"
          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: colors.bgTertiary, color: colors.textSecondary, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>
          <i className="bi bi-x" aria-hidden />
        </button>
      </div>
      {step !== 'done' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }} aria-hidden>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: (step as number) >= s ? accent : colors.bgTertiary, transition: 'background 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );

  const MatchPanel = (
    <div aria-live="polite" style={{
      borderRadius: 16, padding: '14px 16px',
      border: `1.5px solid ${zero ? colors.statusWarning : colors.borderPrimary}`,
      background: zero ? colors.statusWarningBg : colors.bgTertiary,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: zero ? colors.statusWarning : colors.brandPrimary, minWidth: 44, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
          {previewLoading ? <span style={{ animation: 'hy-pulse 1s infinite' }}>…</span> : count ?? '–'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: colors.textPrimary, fontSize: '0.92rem' }}>
            {previewFailed ? "Couldn't count photographers right now" : count === 1 ? 'photographer fits right now' : 'photographers fit right now'}
          </div>
          <div style={{ fontSize: '0.76rem', color: colors.textTertiary }}>
            {previewFailed
              ? 'You can still continue; we check again when you post.'
              : `Free for the whole ${durationText(minutes) || 'event'} on ${date || 'your date'}. Checked again when you post.`}
          </div>
        </div>
      </div>
      {preview?.breakdown && !previewLoading && (
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 6 }}>
          {[
            [preview.breakdown.availableForFullEvent, `free for the full ${durationText(minutes) || 'event'}`],
            [preview.breakdown.typeMatched, photographerType === 'ANY' ? 'of any type' : `are ${photographerType === 'STUDIO' ? 'studios' : 'freelancers'}`],
            [preview.breakdown.withinBudget, budget.min == null && budget.max == null ? 'any budget' : 'fit your budget'],
            [preview.breakdown.inCoverage, coverage === 'ANY' ? 'anywhere in Rwanda' : `around ${city}`],
            ...(specialty !== 'ANY' ? [[preview.breakdown.specialtyMatched, `${specialty} specialists`] as [number | undefined, string]] : []),
          ].map(([n, label], i) => (
            <li key={i} style={{ fontSize: '0.76rem', color: colors.textSecondary, display: 'flex', gap: 6, alignItems: 'center' }}>
              <i className="bi bi-check2-circle" aria-hidden style={{ color: colors.statusSuccess }} />
              <span><strong style={{ color: colors.textPrimary }}>{n ?? 0}</strong> {label}</span>
            </li>
          ))}
        </ul>
      )}
      {preview?.breakdown?.nearbyFallback && (
        <div style={{ marginTop: 10, fontSize: '0.76rem', color: colors.textSecondary }}>
          <i className="bi bi-signpost-split" aria-hidden /> Nobody is free in {city}, so photographers from nearby cities are included.
        </div>
      )}
      {zero && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>Try widening your request:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {coverage !== 'ANY' && <Chip selected={false} icon="bi-geo" onClick={() => setCoverage(coverage === 'SAME_CITY' ? 'NEARBY_CITY' : 'ANY')}>{coverage === 'SAME_CITY' ? 'Include nearby cities' : 'Anywhere in Rwanda'}</Chip>}
            {photographerType !== 'ANY' && <Chip selected={false} icon="bi-people" onClick={() => setPhotographerType('ANY')}>Any photographer type</Chip>}
            {specialty !== 'ANY' && <Chip selected={false} icon="bi-camera" onClick={() => setSpecialty('ANY')}>Any specialty</Chip>}
            {(budget.min != null || budget.max != null) && options && (
              <Chip selected={false} icon="bi-cash" onClick={() => { setCustomBudget(false); setBudgetIndex(options.budgetPresets.length - 1); }}>Flexible budget</Chip>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const SummaryRow = ({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0' }}>
      <i className={`bi ${icon}`} aria-hidden style={{ color: colors.brandPrimary, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: colors.textPrimary }}>{value}</div>
      </div>
    </div>
  );

  const typeLabel = options?.photographerTypes.find((t) => t.value === photographerType)?.label;
  const coverageLabel = options?.coverageOptions.find((c) => c.value === coverage)?.label;
  const budgetText = budgetLabel(budget.min ?? null, budget.max ?? null) || 'Flexible';

  // ───────── body ─────────

  let body: React.ReactNode = null;
  if (!options && !optionsError) {
    body = <div style={{ padding: 40, textAlign: 'center', color: colors.textTertiary }}><span className="ck-spinner" /> Loading…</div>;
  } else if (optionsError) {
    body = <Notice tone="error">{optionsError} <button type="button" onClick={() => { setOptionsError(null); getHybridOptions().then(setOptions).catch((e) => setOptionsError(e?.message)); }} style={{ background: 'none', border: 'none', color: colors.textLink, fontWeight: 700, cursor: 'pointer' }}>Try again</button></Notice>;
  } else if (options && !options.enabled) {
    body = <Notice tone="info">Post My Event is paused right now. Use Find a Photographer to book directly.</Notice>;
  } else if (step === 1 && options) {
    const sat = isoDate(nextWeekday(6));
    const nextSat = isoDate(nextWeekday(6, 1));
    const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoDate(d); })();
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <FieldLabel required>What kind of event is it?</FieldLabel>
          <div role="radiogroup" aria-label="Event type" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.eventTypes.map((t) => (
              <Chip key={t.id} selected={eventTypeId === t.id} onClick={() => setEventTypeId(t.id)}>{t.name}</Chip>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="hy-title" required hint="What guests and photographers will see.">Event name</FieldLabel>
          <input id="hy-title" className="hy-input" style={field} value={title} maxLength={120}
            onChange={(e) => setTitle(e.target.value)} placeholder={eventType ? `e.g. ${eventType.name} celebration` : 'e.g. Birthday Celebration'} />
          {eventType && !title && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[`${eventType.name} celebration`, `${eventType.name} party`, `Our ${eventType.name.toLowerCase()}`].map((s) => (
                <Chip key={s} selected={false} icon="bi-lightning" onClick={() => setTitle(s)}>{s}</Chip>
              ))}
            </div>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="hy-date" required>When is it?</FieldLabel>
          <div role="radiogroup" aria-label="Quick dates" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <Chip selected={date === tomorrow} onClick={() => setDate(tomorrow)}>Tomorrow</Chip>
            <Chip selected={date === sat} onClick={() => setDate(sat)}>This Saturday</Chip>
            <Chip selected={date === nextSat} onClick={() => setDate(nextSat)}>Next Saturday</Chip>
          </div>
          <input id="hy-date" type="date" className="hy-input" style={field} value={date} min={isoDate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div>
            <FieldLabel htmlFor="hy-start" required>Starts</FieldLabel>
            <select id="hy-start" className="hy-input" style={field} value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              {slots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="hy-end" required>Ends</FieldLabel>
            <select id="hy-end" className="hy-input" style={field} value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              {slots.filter((s) => s !== startTime).map((s) => (
                <option key={s} value={s}>{s} · {durationText(durationBetween(startTime, s))}{s <= startTime ? ' (next day)' : ''}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ padding: '0.7rem 0.9rem', borderRadius: 12, background: MODE_META.HYBRID.soft, color: accent, fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-hourglass-split" aria-hidden /> {durationText(minutes) || '–'}{overnight ? ' · ends next day' : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <FieldLabel htmlFor="hy-city" required>City</FieldLabel>
            <select id="hy-city" className="hy-input" style={field} value={city} onChange={(e) => setCity(e.target.value)}>
              {options.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="hy-country">Country</FieldLabel>
            <select id="hy-country" className="hy-input" style={field} value={options.country} disabled>
              <option>{options.country}</option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="hy-venue" required hint="A venue name, street or landmark.">Venue or address</FieldLabel>
          <input id="hy-venue" className="hy-input" style={field} value={venue} maxLength={200} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Kigali Convention Centre" />
        </div>

        <WishInvitesField value={wishInvites} error={wishInvitesErr} disabled={submitting}
          onChange={(v) => { setWishInvites(v); setWishInvitesErr(null); setErrorMsg(null); }} />

        <div>
          <FieldLabel htmlFor="hy-notes" hint="Optional: shots you want, indoor or outdoor, dress code.">Notes for photographers</FieldLabel>
          <textarea id="hy-notes" className="hy-input" style={{ ...field, resize: 'vertical' }} rows={2} maxLength={600} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    );
  } else if (step === 2 && options) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {MatchPanel}
        <div>
          <FieldLabel>Photographer type</FieldLabel>
          <div role="radiogroup" aria-label="Photographer type" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            {options.photographerTypes.map((t) => (
              <OptionCard key={t.value} selected={photographerType === t.value} onClick={() => setPhotographerType(t.value)}
                title={t.label} description={t.description}
                icon={t.value === 'STUDIO' ? 'bi-building' : t.value === 'FREELANCER' ? 'bi-person' : 'bi-people'} />
            ))}
          </div>
        </div>

        <div>
          <FieldLabel hint="Photographers whose packages fit this range are alerted.">Budget</FieldLabel>
          <div role="radiogroup" aria-label="Budget" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.budgetPresets.map((p, i) => (
              <Chip key={p.label} selected={!customBudget && budgetIndex === i} onClick={() => { setCustomBudget(false); setBudgetIndex(i); }}>{p.label}</Chip>
            ))}
            <Chip selected={customBudget} icon="bi-pencil" onClick={() => setCustomBudget(true)}>Custom</Chip>
          </div>
          {customBudget && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <input aria-label="Minimum budget in RWF" inputMode="numeric" className="hy-input" style={field} placeholder="Minimum (RWF)"
                value={minBudget ? Number(minBudget).toLocaleString('en-US') : ''} onChange={(e) => setMinBudget(e.target.value.replace(/\D/g, ''))} />
              <input aria-label="Maximum budget in RWF" inputMode="numeric" className="hy-input" style={field} placeholder="Maximum (RWF)"
                value={maxBudget ? Number(maxBudget).toLocaleString('en-US') : ''} onChange={(e) => setMaxBudget(e.target.value.replace(/\D/g, ''))} />
            </div>
          )}
        </div>

        <div>
          <FieldLabel hint="Choose one only if it must be a specialist.">Photographer specialty</FieldLabel>
          <div role="radiogroup" aria-label="Photographer specialty" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.photographerSpecialties.map((s) => (
              <Chip key={s.value} selected={specialty === s.value} onClick={() => setSpecialty(s.value)}>{s.label}</Chip>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Where can the photographer come from?</FieldLabel>
          <div role="radiogroup" aria-label="Location coverage" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
            {options.coverageOptions.map((c) => (
              <OptionCard key={c.value} selected={coverage === c.value} onClick={() => setCoverage(c.value)}
                title={c.value === 'SAME_CITY' ? `${city} only` : c.label} description={c.description}
                icon={c.value === 'SAME_CITY' ? 'bi-geo-alt' : c.value === 'NEARBY_CITY' ? 'bi-signpost-split' : 'bi-map'} />
            ))}
          </div>
        </div>

        <div>
          <FieldLabel hint="After this, you choose from whoever said yes.">Collect answers for</FieldLabel>
          <div role="radiogroup" aria-label="Matching window" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.matchWindowHours.map((h) => (
              <Chip key={h} selected={windowHours === h} onClick={() => setWindowHours(h)}>{h} hours</Chip>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (step === 3 && options) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ borderRadius: 16, border: `1px solid ${colors.borderPrimary}`, padding: '6px 16px', background: colors.bgCard }}>
          <SummaryRow icon="bi-stars" label="Event" value={<>{title} <span style={{ color: colors.textTertiary, fontWeight: 500 }}>· {eventType?.name}</span></>} />
          <SummaryRow icon="bi-calendar-event" label="When" value={<>{date} · {startTime}–{endTime} · <strong style={{ color: accent }}>{durationText(minutes)}</strong>{overnight ? ' (ends next day)' : ''}</>} />
          <SummaryRow icon="bi-geo-alt" label="Where" value={`${venue}, ${city}, ${options.country}`} />
          <SummaryRow icon="bi-person-badge" label="Looking for" value={`${typeLabel}${specialty !== 'ANY' ? ` · ${specialty} specialist` : ''} · ${coverageLabel}`} />
          <SummaryRow icon="bi-cash-coin" label="Budget" value={budgetText} />
          <SummaryRow icon="bi-clock-history" label="Collect answers for" value={`${windowHours} hours`} />
        </div>
        {MatchPanel}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: colors.textPrimary, marginBottom: 8 }}>What happens next</div>
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['bi-broadcast', `The ${Math.min(options.firstBatchSize, count ?? options.firstBatchSize) || options.firstBatchSize} best-matched photographers are alerted right away.`],
              ['bi-hand-thumbs-up', `Each has ${durationText(options.inviteWindowMinutes)} to say yes; anyone who passes is replaced by the next best match.`],
              ['bi-people', 'Only photographers who said yes appear for you, grouped as top, good and possible matches, three of each.'],
              ['bi-shield-check', `You choose one and pay ${options.escrowOptions.length > 1 ? `${options.escrowOptions.slice(0, -1).join('%, ')}% or ` : ''}${options.escrowOptions[options.escrowOptions.length - 1]}% upfront. Connekyt holds the money until the work is delivered.`],
            ].map(([icon, text], i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.84rem', color: colors.textSecondary }}>
                <span aria-hidden style={{ width: 26, height: 26, borderRadius: 8, background: colors.bgTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.brandPrimary, flexShrink: 0 }}>
                  <i className={`bi ${icon}`} />
                </span>
                <span style={{ paddingTop: 3 }}>{text}</span>
              </li>
            ))}
          </ol>
          <p style={{ fontSize: '0.74rem', color: colors.textTertiary, margin: '10px 0 0' }}>
            Your event stays private. It only appears publicly once a photographer is booked.
          </p>
        </div>
      </div>
    );
  } else if (step === 'done' && result) {
    const failed = result.status === 'MATCHING_FAILED' || !result.invited;
    body = (
      <div style={{ textAlign: 'center', padding: '20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span aria-hidden style={{ width: 64, height: 64, borderRadius: '50%', background: failed ? colors.statusWarningBg : MODE_META.HYBRID.soft, color: failed ? colors.statusWarning : accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
          <i className={`bi ${failed ? 'bi-exclamation-lg' : 'bi-broadcast'}`} />
        </span>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary }}>
          {failed ? 'Saved, but nobody fits right now' : `${result.invited} photographer${result.invited === 1 ? ' was' : 's were'} alerted`}
        </div>
        <p style={{ margin: 0, maxWidth: 440, color: colors.textSecondary, fontSize: '0.88rem' }}>
          {failed
            ? 'Your event is saved privately. Post it again with a wider area or budget, or use Find a Photographer to book one yourself.'
            : "We'll notify you each time a photographer says yes. You can follow the answers from My Events."}
        </p>
      </div>
    );
  }

  const canPublish = !submitting && count !== 0 && options?.enabled !== false;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hy-wizard-title"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bgOverlay, backdropFilter: 'blur(6px)', padding: 16 }}
      onClick={step === 'done' ? finish : onClose}>
      <HybridStyles />
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, maxHeight: '94vh', display: 'flex', flexDirection: 'column', background: colors.bgModal, borderRadius: 22, boxShadow: '0 30px 70px -20px rgba(8,58,133,0.35)', overflow: 'hidden', border: `1px solid ${colors.borderPrimary}` }}>
        {Header}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorMsg && <Notice tone="error">{errorMsg}</Notice>}
          {body}
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${colors.borderPrimary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: colors.bgSecondary }}>
          {step === 'done' ? (
            <>
              <span />
              <button type="button" onClick={finish} className="ck-btn ck-btn-primary hy-focus" style={{ padding: '0.7rem 1.4rem', borderRadius: 12, fontWeight: 800 }}>
                {result?.invited ? 'Follow the answers' : 'Done'}
              </button>
            </>
          ) : (
            <>
              {(step as number) > 1 && !(existingEvent && step === 2) ? (
                <button type="button" onClick={() => { setErrorMsg(null); setStep(((step as number) - 1) as 1 | 2); }} className="hy-focus"
                  style={{ padding: '0.65rem 1.1rem', borderRadius: 12, border: `1.5px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textSecondary, fontWeight: 700, cursor: 'pointer' }}>
                  <i className="bi bi-arrow-left" aria-hidden /> Back
                </button>
              ) : <span />}
              {step !== 3 ? (
                <button type="button" onClick={goNext} disabled={!options} className="hy-focus"
                  style={{ padding: '0.7rem 1.4rem', borderRadius: 12, border: 'none', background: colors.brandPrimary, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                  Continue <i className="bi bi-arrow-right" aria-hidden />
                </button>
              ) : (
                <button type="button" onClick={handlePublish} disabled={!canPublish} className="hy-focus"
                  title={count === 0 ? 'Nobody fits yet. Widen your request first.' : undefined}
                  style={{ padding: '0.7rem 1.4rem', borderRadius: 12, border: 'none', background: canPublish ? accent : colors.bgTertiary, color: canPublish ? '#fff' : colors.textTertiary, fontWeight: 800, cursor: canPublish ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {submitting ? <><span className="ck-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Posting…</> : <><i className="bi bi-broadcast" aria-hidden /> Post and alert photographers</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
