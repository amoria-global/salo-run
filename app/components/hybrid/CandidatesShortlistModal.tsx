"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { getApiUrl } from '@/lib/api';
import { getLandingUrl } from '@/lib/urls';
import {
  budgetLabel,
  convertToDirect,
  getCandidatesOverview,
  getHybridOptions,
  hhmm,
  selectEventPhotographer,
  SMART_TIER_ORDER,
  smartTierOf,
  syncServerClock,
  TIER_META,
  type CandidateSummary,
  type CandidatesOverview,
} from '@/app/lib/hybridBooking';
import {
  candidateChargingSummary,
  formatMoney,
  nearestPackageIdToBudget,
  sortPackagesByBudget,
  type PricedPackageItem,
} from '@/app/lib/offerPresentation';
import { isMatchBooked } from '@/app/lib/hybridStatus';
import { CountdownText, HybridStyles, MODE_META, Notice } from './hybridUi';

interface CandidatesShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
  eventStatus?: string;
  latitude?: number;
  longitude?: number;
  eventDate?: string;
  onPhotographerSelected: (photographerId: string, result: any, candidate?: CandidateSummary) => void;
  /** Open the wizard to post this event again after matching ended. */
  onRepost?: () => void;
  /** Matching stopped; continue with Find a Photographer. */
  onConvertedToDirect?: () => void;
}

const TIER_ROW = 4;

/**
 * The client's view of a posted event, matching the mobile app (`event/candidates.tsx` + `CandidateCard.tsx`):
 * - Groups accepted photographers by Smart Match tiers (`PREMIUM`, `PREFERRED`, `SUGGESTED`, `ALTERNATIVE`)
 * - Compact `CandidateCard` with Smart Match score, role, specialty, charging summary pill, distance & Accepted badge
 * - Candidate detail view + Packages & delivery view
 * - "Book {name}?" modal with "SELECT PACKAGE & AGREED PRICE" (sorted packages + "Your event offer amount") and 50%/70%/100% escrow deposit buttons.
 */
export default function CandidatesShortlistModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onPhotographerSelected,
  onRepost,
  onConvertedToDirect,
}: CandidatesShortlistModalProps) {
  const { colors } = useTheme();
  const [data, setData] = useState<CandidatesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const [detailPick, setDetail] = useState<CandidateSummary | null>(null);
  const [packagesFor, setPackagesFor] = useState<CandidateSummary | null>(null);
  const [choosing, setChoosing] = useState<CandidateSummary | null>(null);
  const [selectedPackageChoice, setSelectedPackageChoice] = useState<'CLIENT_OFFER' | string>('CLIENT_OFFER');
  const [escrow, setEscrow] = useState(50);
  const [escrowOptions, setEscrowOptions] = useState<number[]>([50, 70, 100]);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});
  const [loadedPackages, setLoadedPackages] = useState<{ id: string; list: PricedPackageItem[] } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [booked, setBooked] = useState<{ candidate: CandidateSummary; result: any } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getCandidatesOverview(eventId);
      setData(d);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not load the photographers who answered.' });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setBooked(null);
    setChoosing(null);
    setDetail(null);
    setPackagesFor(null);
    syncServerClock();
    getHybridOptions().then((o) => {
      if (Array.isArray(o?.escrowOptions) && o.escrowOptions.length) setEscrowOptions(o.escrowOptions);
    }).catch(() => {});
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [isOpen, load]);

  const activePackagePhotographerId = choosing?.photographerId || packagesFor?.photographerId || null;
  const packagesLoading = !!activePackagePhotographerId && loadedPackages?.id !== activePackagePhotographerId;
  const packages =
    loadedPackages && packagesFor && loadedPackages.id === packagesFor.photographerId ? loadedPackages.list : [];

  useEffect(() => {
    if (!activePackagePhotographerId) return;
    if (loadedPackages?.id === activePackagePhotographerId) return;
    let live = true;
    const id = activePackagePhotographerId;
    fetch(`${getApiUrl()}/api/remote/public/photographers/${encodeURIComponent(id)}/packages`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((json) => {
        if (!live) return;
        const raw = json?.action === 1 && Array.isArray(json.data) ? json.data : [];
        const list: PricedPackageItem[] = raw
          .filter((p: any) => p.isActive !== false)
          .map((p: any) => ({
            id: String(p.id ?? ''),
            name: String(p.packageName || p.name || 'Package'),
            price: typeof p.price === 'number' ? p.price : undefined,
            currency: p.currencyAbbreviation || p.currency?.abbreviation || 'RWF',
            deliveryDays: typeof p.deliveryDays === 'number' ? p.deliveryDays : undefined,
            durationHours: typeof p.durationHours === 'number' ? p.durationHours : undefined,
            includedPhotos: typeof p.includedPhotos === 'number' ? p.includedPhotos : undefined,
            includedVideos: typeof p.includedVideos === 'number' ? p.includedVideos : undefined,
            description: p.description || undefined,
          }));
        setLoadedPackages({ id, list });
      })
      .catch(() => {
        if (live) setLoadedPackages({ id, list: [] });
      });
    return () => {
      live = false;
    };
  }, [activePackagePhotographerId, loadedPackages?.id]);

  const eventBudget = data?.maxBudget ?? data?.minBudget ?? null;

  const choosingPackages = useMemo<PricedPackageItem[]>(() => {
    if (!choosing) return [];
    const fetched =
      loadedPackages && loadedPackages.id === choosing.photographerId ? [...loadedPackages.list] : [];
    const suggestedPrice = choosing.proposedPrice ?? choosing.matchedPackagePrice;
    const suggestedId = choosing.matchedPackageId || '__suggested_pkg__';
    if (
      (choosing.matchedPackageName || (suggestedPrice != null && suggestedPrice > 0)) &&
      choosing.pricingMode !== 'CLIENT_OFFER'
    ) {
      const exists = fetched.some(
        (p) =>
          p.id === suggestedId ||
          (choosing.matchedPackageName &&
            p.name.toLowerCase() === choosing.matchedPackageName.toLowerCase() &&
            p.price === suggestedPrice),
      );
      if (!exists) {
        fetched.unshift({
          id: suggestedId,
          name: choosing.matchedPackageName || 'Suggested package',
          price: suggestedPrice,
          currency: choosing.matchedPackageCurrency || 'RWF',
          deliveryDays: choosing.packageDeliveryDays,
          durationHours: choosing.matchedPackageHours,
          includedPhotos: choosing.matchedPackagePhotos,
          includedVideos: choosing.matchedPackageVideos,
          description: choosing.packageDeliveryDescription,
        });
      }
    }
    return sortPackagesByBudget(fetched, eventBudget, choosing.matchedPackageId || suggestedId);
  }, [choosing, loadedPackages, eventBudget]);

  const nearestChoosingPkgId = useMemo(
    () => nearestPackageIdToBudget(choosingPackages, eventBudget, choosing?.matchedPackageId),
    [choosingPackages, eventBudget, choosing?.matchedPackageId],
  );

  useEffect(() => {
    if (!choosing) return;
    if (
      choosing.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' &&
      choosing.pricingMode !== 'CLIENT_OFFER' &&
      selectedPackageChoice === '__suggested_pkg__' &&
      choosingPackages.length > 0 &&
      !choosingPackages.some((p) => p.id === '__suggested_pkg__')
    ) {
      setSelectedPackageChoice(nearestChoosingPkgId ?? choosingPackages[0].id);
    }
  }, [choosing, choosingPackages, nearestChoosingPkgId, selectedPackageChoice]);

  const openChoosingModal = useCallback(
    (cand: CandidateSummary, explicitPackageId?: string) => {
      setEscrow(50);
      if (explicitPackageId) {
        setSelectedPackageChoice(explicitPackageId);
      } else if (
        cand.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' &&
        cand.pricingMode !== 'CLIENT_OFFER' &&
        (cand.matchedPackageId || cand.matchedPackagePrice != null || cand.proposedPrice != null)
      ) {
        setSelectedPackageChoice(cand.matchedPackageId || '__suggested_pkg__');
      } else if (eventBudget != null && eventBudget > 0) {
        setSelectedPackageChoice('CLIENT_OFFER');
      } else if (cand.matchedPackageId) {
        setSelectedPackageChoice(cand.matchedPackageId);
      } else {
        setSelectedPackageChoice('CLIENT_OFFER');
      }
      setChoosing(cand);
    },
    [eventBudget],
  );

  const selectedChoosingPkg = useMemo(
    () =>
      selectedPackageChoice === 'CLIENT_OFFER'
        ? null
        : choosingPackages.find((p) => p.id === selectedPackageChoice) ?? null,
    [selectedPackageChoice, choosingPackages],
  );

  const agreedPrice = useMemo(() => {
    if (selectedChoosingPkg && selectedChoosingPkg.price != null) {
      return selectedChoosingPkg.price;
    }
    if (selectedPackageChoice === 'CLIENT_OFFER') {
      return eventBudget ?? choosing?.proposedPrice ?? choosing?.matchedPackagePrice ?? null;
    }
    return choosing?.proposedPrice ?? choosing?.matchedPackagePrice ?? eventBudget ?? null;
  }, [selectedChoosingPkg, selectedPackageChoice, eventBudget, choosing]);

  const agreedCurrency = selectedChoosingPkg?.currency || choosing?.matchedPackageCurrency || 'RWF';
  const expectedDeposit =
    agreedPrice != null && Number.isFinite(agreedPrice) && agreedPrice > 0
      ? Math.round((agreedPrice * escrow) / 100)
      : undefined;

  if (!isOpen) return null;

  const confirmChoice = async () => {
    if (!choosing) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const realPackageId =
        selectedPackageChoice !== 'CLIENT_OFFER' && !selectedPackageChoice.startsWith('__')
          ? selectedPackageChoice
          : choosing.matchedPackageId && selectedPackageChoice !== 'CLIENT_OFFER'
            ? choosing.matchedPackageId
            : undefined;
      const result = await selectEventPhotographer(eventId, {
        candidateId: choosing.candidateId,
        photographerId: choosing.photographerId,
        packageId: realPackageId,
        agreedPrice: agreedPrice ?? undefined,
        proposedPrice: agreedPrice ?? undefined,
        escrowPercentage: escrow,
      });
      const bookedCandidate = choosing;
      setChoosing(null);
      // Immediately hand off to payment checkout if declarationId is present, or show booked state
      if (result?.declarationId) {
        onPhotographerSelected(bookedCandidate.photographerId, result, bookedCandidate);
      } else {
        setBooked({ candidate: bookedCandidate, result });
      }
    } catch (e: any) {
      setChoosing(null);
      setNotice({ tone: 'error', text: e?.message || 'Could not confirm this photographer.' });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const switchToDirect = async () => {
    setConverting(true);
    try {
      await convertToDirect(eventId);
      onConvertedToDirect?.();
      onClose();
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not switch to Find a Photographer.' });
    } finally {
      setConverting(false);
    }
  };

  const title = data?.eventTitle || eventTitle || 'Your event';
  const candidates = data?.candidates ?? [];
  const active = (data?.matchStatus || '').toUpperCase() === 'ACTIVE';
  const detail = detailPick ? candidates.find((c) => c.candidateId === detailPick.candidateId) ?? detailPick : null;

  const CompactCandidateCard = ({ c }: { c: CandidateSummary }) => {
    const tier = TIER_META[smartTierOf(c)];
    const role = c.photographerType === 'STUDIO' ? 'Company / Studio' : 'Freelancer / Individual';
    const score = c.matchScore != null ? `${c.matchScore}` : null;
    const charging = candidateChargingSummary(c, eventBudget, 'RWF');
    const priceText = charging.amount != null ? formatMoney(charging.amount, charging.currency) : null;

    return (
      <button
        type="button"
        data-ck-shape="card"
        onClick={() => setDetail(c)}
        className="hy-focus"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          textAlign: 'left',
          padding: 12,
          borderRadius: 16,
          border: `1.5px solid ${tier.color}`,
          background: colors.bgCard,
          cursor: 'pointer',
          minWidth: 165,
          flex: '1 1 165px',
          maxWidth: 220,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              overflow: 'hidden',
              background: colors.bgTertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: colors.brandPrimary,
              fontSize: 16,
            }}
          >
            {c.profilePicture || c.avatar ? (
              <img src={c.profilePicture || c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (c.name || c.photographerName).charAt(0)
            )}
          </div>
          {score && (
            <span
              style={{
                padding: '3px 9px',
                borderRadius: 999,
                background: tier.bg,
                color: tier.color,
                fontSize: '0.74rem',
                fontWeight: 800,
              }}
            >
              {score}
            </span>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: colors.textPrimary }}>
          {c.name || c.photographerName}
        </div>
        <div style={{ fontSize: '0.72rem', color: colors.textTertiary }}>{role}</div>
        {c.primarySpecialty && (
          <div style={{ fontSize: '0.74rem', color: colors.textSecondary }}>{c.primarySpecialty}</div>
        )}
        {priceText && (
          <div
            style={{
              padding: '5px 8px',
              borderRadius: 8,
              background: charging.isSuggestedPackage ? MODE_META.HYBRID.soft : colors.bgTertiary,
              border: `1px solid ${charging.isSuggestedPackage ? MODE_META.HYBRID.color : colors.borderPrimary}`,
              marginTop: 2,
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: charging.isSuggestedPackage ? MODE_META.HYBRID.color : colors.textPrimary,
              }}
            >
              <i className={`bi ${charging.isSuggestedPackage ? 'bi-tag-fill' : 'bi-cash'}`} /> {priceText}
            </div>
            <div style={{ fontSize: '0.68rem', color: colors.textTertiary }}>{charging.label}</div>
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: colors.textSecondary, marginTop: 'auto' }}>
          <i className="bi bi-geo-alt" /> {c.distanceLabel || c.city || 'Distance not shown'}
        </div>
        <div style={{ fontSize: '0.72rem', color: colors.statusSuccess, fontWeight: 700 }}>
          <i className="bi bi-check-circle-fill" /> Accepted
        </div>
      </button>
    );
  };

  let body: React.ReactNode;
  if (loading && !data) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ height: 96, borderRadius: 16, background: colors.bgTertiary, animation: 'hy-pulse 1.2s infinite' }} />
        ))}
      </div>
    );
  } else if (booked) {
    const pct = booked.result?.escrowPercentage ?? escrow;
    body = (
      <div style={{ textAlign: 'center', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span
          aria-hidden
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: colors.statusSuccessBg,
            color: colors.statusSuccess,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
          }}
        >
          <i className="bi bi-check-lg" />
        </span>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary }}>
          {booked.candidate.photographerName} is booked
        </div>
        <p style={{ margin: 0, maxWidth: 440, color: colors.textSecondary, fontSize: '0.88rem' }}>
          Pay your {pct}% first payment to confirm it. Connekyt holds the money and releases it to the photographer by the usual milestones.
          {booked.result?.depositAmount ? (
            <>
              {' '}Amount due:{' '}
              <strong>
                {Math.round(booked.result.depositAmount).toLocaleString('en-US')} {booked.result.currency || 'RWF'}
              </strong>.
            </>
          ) : null}
        </p>
      </div>
    );
  } else if (candidates.length > 0) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {SMART_TIER_ORDER.map((tTier) => {
          const inTier = candidates.filter((c) => smartTierOf(c) === tTier);
          if (inTier.length === 0) return null;
          const open = !!expandedTiers[tTier];
          const meta = TIER_META[tTier];
          const extra = inTier.length - TIER_ROW;
          return (
            <section key={tTier} aria-label={meta.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: meta.bg,
                    color: meta.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className={`bi ${meta.icon}`} />
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {meta.label}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: colors.textTertiary }}>{inTier.length} accepted</span>
                </div>
                {extra > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedTiers((p) => ({ ...p, [tTier]: !open }))}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      border: `1px solid ${meta.color}`,
                      background: 'transparent',
                      color: meta.color,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {open ? 'Show less' : `View more (${extra})`}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(open ? inTier : inTier.slice(0, TIER_ROW)).map((c) => (
                  <CompactCandidateCard key={c.candidateId || c.photographerId} c={c} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  } else if (isMatchBooked(data)) {
    body = (
      <div style={{ textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 60, height: 60, borderRadius: '50%', background: colors.statusSuccessBg, color: colors.statusSuccess, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          <i className="bi bi-check-lg" />
        </span>
        <div style={{ fontWeight: 800, color: colors.textPrimary }}>A photographer is booked for this event</div>
        <p style={{ margin: 0, maxWidth: 420, fontSize: '0.86rem', color: colors.textSecondary }}>
          Answers are closed. The booking and its first payment are on the event page.
        </p>
        <button
          type="button"
          className="hy-focus"
          onClick={() => onPhotographerSelected('', null)}
          style={{ padding: '0.7rem 1.4rem', borderRadius: 12, border: 'none', background: colors.brandPrimary, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
        >
          Open the event <i className="bi bi-arrow-right" />
        </button>
      </div>
    );
  } else if (active) {
    body = (
      <div style={{ textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 60, height: 60, borderRadius: '50%', background: MODE_META.HYBRID.soft, color: MODE_META.HYBRID.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, animation: 'hy-pulse 1.8s infinite' }}>
          <i className="bi bi-broadcast" />
        </span>
        <div style={{ fontWeight: 800, color: colors.textPrimary }}>Waiting for photographers to answer</div>
        <p style={{ margin: 0, maxWidth: 420, fontSize: '0.86rem', color: colors.textSecondary }}>
          {data?.pendingCount ?? 0} photographer{data?.pendingCount === 1 ? ' is' : 's are'} deciding now. Anyone who passes is replaced by the next best match. We&apos;ll notify you as soon as someone says yes.
        </p>
      </div>
    );
  } else {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Notice tone="warning" icon="bi-hourglass-bottom">
          {data?.status === 'MATCHING_FAILED'
            ? 'Nobody fit this event when it was posted.'
            : 'Matching ended without a photographer saying yes.'}{' '}
          You can post it again with a wider area or budget, or book one yourself.
        </Notice>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {data?.canRepost && onRepost && (
            <button
              type="button"
              className="hy-focus"
              onClick={() => { onClose(); onRepost(); }}
              style={{ padding: 14, borderRadius: 14, border: `2px solid ${MODE_META.HYBRID.color}`, background: MODE_META.HYBRID.soft, color: colors.textPrimary, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ fontWeight: 800 }}>
                <i className="bi bi-broadcast" style={{ color: MODE_META.HYBRID.color }} /> Post again
              </div>
              <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>
                Change the area, budget or type and alert photographers again.
              </div>
            </button>
          )}
          {data?.canConvertToDirect && (
            <button
              type="button"
              className="hy-focus"
              onClick={switchToDirect}
              disabled={converting}
              style={{ padding: 14, borderRadius: 14, border: `2px solid ${MODE_META.DIRECT.color}`, background: MODE_META.DIRECT.soft, color: colors.textPrimary, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ fontWeight: 800 }}>
                <i className="bi bi-search" style={{ color: MODE_META.DIRECT.color }} /> {converting ? 'Switching…' : 'Find a Photographer instead'}
              </div>
              <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>
                Browse photographers and send a request yourself.
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hy-cands-title"
      className="ck-keep-radius"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bgOverlay,
        backdropFilter: 'blur(6px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <HybridStyles />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: colors.bgModal,
          borderRadius: 22,
          overflow: 'hidden',
          border: `1px solid ${colors.borderPrimary}`,
        }}
      >
        <header style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: MODE_META.HYBRID.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <i className="bi bi-broadcast" /> Post My Event · Photographers who said yes
              </div>
              <h2 id="hy-cands-title" style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary }}>
                {title}
              </h2>
              {data && (
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                  {data.eventDate && (
                    <span>
                      <i className="bi bi-calendar-event" /> {data.eventDate}
                      {data.startTime ? ` · ${hhmm(data.startTime)}–${hhmm(data.endTime)}` : ''}
                      {data.durationLabel ? ` · ${data.durationLabel}` : ''}
                    </span>
                  )}
                  {(data.venue || data.city) && (
                    <span>
                      <i className="bi bi-geo-alt" /> {data.city || data.venue}
                    </span>
                  )}
                  {budgetLabel(data.minBudget, data.maxBudget) && (
                    <span>
                      <i className="bi bi-cash" /> {budgetLabel(data.minBudget, data.maxBudget)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hy-focus"
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: colors.bgTertiary, color: colors.textSecondary, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}
            >
              <i className="bi bi-x" />
            </button>
          </div>

          {data && !booked && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {[
                [candidates.length, 'said yes', colors.statusSuccess],
                [data.pendingCount, 'deciding', colors.statusInfo],
                [data.declinedCount, 'passed', colors.textTertiary],
                [data.expiredCount + data.noLongerAvailableCount, 'missed it', colors.textTertiary],
              ].map(([n, l, c]) => (
                <span key={l as string} style={{ padding: '4px 10px', borderRadius: 999, background: colors.bgTertiary, fontSize: '0.76rem', color: colors.textSecondary }}>
                  <strong style={{ color: c as string }}>{n as number}</strong> {l as string}
                </span>
              ))}
              {active && data.windowExpiresAt && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: MODE_META.HYBRID.soft, fontSize: '0.76rem', color: MODE_META.HYBRID.color, fontWeight: 700 }}>
                  <i className="bi bi-clock" /> Answers close in <CountdownText to={data.windowExpiresAt} doneText="a moment" />
                </span>
              )}
            </div>
          )}
        </header>

        <div style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
          {body}
        </div>

        {booked && (
          <footer style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${colors.borderPrimary}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="hy-focus"
              onClick={() => onPhotographerSelected(booked.candidate.photographerId, booked.result, booked.candidate)}
              style={{ padding: '0.7rem 1.4rem', borderRadius: 12, border: 'none', background: colors.brandPrimary, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
            >
              Continue to payment <i className="bi bi-arrow-right" />
            </button>
          </footer>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {detail && (() => {
        const charging = candidateChargingSummary(detail, eventBudget);
        const profileUrl = detail.slug
          ? `${getLandingUrl()}/${detail.slug}`
          : `${getLandingUrl()}/user/photographers/view-profile?id=${encodeURIComponent(detail.photographerId)}`;
        return (
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => { e.stopPropagation(); setDetail(null); }}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: 16 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 440, background: colors.bgModal, borderRadius: 20, padding: 20, border: `1px solid ${colors.borderPrimary}`, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.textPrimary }}>
                    {detail.name || detail.photographerName}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginTop: 2 }}>
                    {[
                      detail.primarySpecialty,
                      `${TIER_META[smartTierOf(detail)].label}${detail.matchScore != null ? ` · Score ${detail.matchScore}` : ''}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: colors.bgTertiary, color: colors.textSecondary, cursor: 'pointer' }}
                >
                  <i className="bi bi-x" />
                </button>
              </div>

              <div style={{ padding: 12, borderRadius: 12, background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}` }}>
                <div style={{ fontSize: '0.76rem', color: colors.textSecondary }}>
                  {[detail.photographerType === 'STUDIO' ? 'Company / Studio' : 'Freelancer', detail.distanceLabel || detail.city]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {charging.amount != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: colors.textPrimary }}>{charging.label}</span>
                    <span style={{ fontWeight: 900, fontSize: '0.95rem', color: charging.isSuggestedPackage ? MODE_META.HYBRID.color : colors.brandPrimary }}>
                      {formatMoney(charging.amount, charging.currency)}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: '0.74rem', color: colors.textTertiary, marginTop: 4 }}>
                  {detail.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE'
                    ? `Delivery${detail.packageDeliveryDays ? ` in ${detail.packageDeliveryDays} days` : ' by their package'}`
                    : 'Delivery as you requested'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cand = detail;
                  setDetail(null);
                  openChoosingModal(cand);
                }}
                style={{ padding: '12px 16px', borderRadius: 12, border: 'none', background: MODE_META.HYBRID.color, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                Confirm and Pay
              </button>

              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${colors.borderPrimary}`,
                  color: colors.textPrimary,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                }}
              >
                <span><i className="bi bi-images" style={{ color: colors.brandPrimary }} /> View portfolio</span>
                <i className="bi bi-box-arrow-up-right" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setPackagesFor(detail);
                  setDetail(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: 'transparent',
                  color: colors.textPrimary,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                <span><i className="bi bi-box-seam" style={{ color: colors.brandPrimary }} /> Packages and delivery</span>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Packages Sheet Modal */}
      {packagesFor && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { e.stopPropagation(); setPackagesFor(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', background: colors.bgModal, borderRadius: 20, padding: 20, border: `1px solid ${colors.borderPrimary}`, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: colors.textPrimary }}>
                {packagesFor.name || packagesFor.photographerName}: packages
              </h3>
              <button
                type="button"
                onClick={() => setPackagesFor(null)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: colors.bgTertiary, color: colors.textSecondary, cursor: 'pointer' }}
              >
                <i className="bi bi-x" />
              </button>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: colors.bgTertiary }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: colors.textTertiary }}>DELIVERY</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: colors.textPrimary }}>
                {packagesFor.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' ? 'Their package delivery' : 'As you requested'}
              </div>
              <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>
                {packagesFor.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE'
                  ? `${packagesFor.packageDeliveryDays ? `${packagesFor.packageDeliveryDays} days turnaround. ` : ''}${packagesFor.packageDeliveryDescription ?? ''}`.trim() || 'Delivered with their package.'
                  : 'Delivered on the dates you asked for.'}
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textTertiary }}>
              ALL PACKAGES (CLICK TO SELECT &amp; CONFIRM)
            </div>
            {packagesLoading && <div style={{ fontSize: '0.82rem', color: colors.textSecondary }}>Loading packages...</div>}
            {!packagesLoading && packages.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: colors.textTertiary }}>No other packages are listed yet.</div>
            )}
            {sortPackagesByBudget(packages, eventBudget, packagesFor.matchedPackageId).map((pk) => {
              const nearestId = nearestPackageIdToBudget(packages, eventBudget, packagesFor.matchedPackageId);
              const isNearest = String(pk.id) === nearestId;
              return (
                <button
                  key={String(pk.id)}
                  type="button"
                  data-ck-shape="card"
                  onClick={() => {
                    const cand = packagesFor;
                    setPackagesFor(null);
                    openChoosingModal(cand, String(pk.id));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${isNearest ? colors.brandPrimary : colors.borderPrimary}`,
                    background: colors.bgCard,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: colors.textPrimary }}>{pk.name}</div>
                    {isNearest && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: MODE_META.HYBRID.color }}>
                        Nearest to your budget
                      </div>
                    )}
                  </div>
                  {pk.price != null && (
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: colors.brandPrimary }}>
                      {formatMoney(pk.price, pk.currency)}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                const cand = packagesFor;
                setPackagesFor(null);
                openChoosingModal(cand);
              }}
              style={{ marginTop: 6, padding: '12px 16px', borderRadius: 12, border: 'none', background: MODE_META.HYBRID.color, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
            >
              Confirm and Pay
            </button>
          </div>
        </div>
      )}

      {/* Book {name}? Confirmation Modal with Package/Offer price choice + 50/70/100% escrow */}
      {choosing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hy-choose-title"
          onClick={(e) => {
            e.stopPropagation();
            if (!submitting) setChoosing(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: colors.bgModal,
              borderRadius: 20,
              padding: 20,
              border: `1px solid ${colors.borderPrimary}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 id="hy-choose-title" style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: colors.textPrimary }}>
              Book {choosing.name || choosing.photographerName}?
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: colors.textSecondary }}>
              We check they are still free for the whole event, then create your booking. Confirm your agreed price and first payment below.
            </p>

            {choosing.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' && (
              <Notice tone="info" icon="bi-box-seam">
                {choosing.pricingMode === 'CLIENT_OFFER'
                  ? `Accepted at your offer amount with their package delivery policy${choosing.packageDeliveryDays ? ` (${choosing.packageDeliveryDays} days)` : ''}.`
                  : `${choosing.name || choosing.photographerName} suggested a package price (${choosing.packageDeliveryDays ? `${choosing.packageDeliveryDays} days delivery` : 'package delivery'}). Choose a package below (sorted nearest to your budget) to confirm the agreed price.`}
              </Notice>
            )}

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textTertiary, letterSpacing: '0.06em', marginBottom: 6 }}>
                SELECT PACKAGE &amp; AGREED PRICE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 210, overflowY: 'auto' }}>
                {choosingPackages.map((pk) => {
                  const selected = selectedPackageChoice === pk.id;
                  const isSuggested =
                    choosing.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' &&
                    choosing.pricingMode !== 'CLIENT_OFFER' &&
                    (pk.id === choosing.matchedPackageId || pk.id === '__suggested_pkg__');
                  const isNearest = pk.id === nearestChoosingPkgId;
                  const inclusions = [
                    pk.durationHours ? `${pk.durationHours}h` : null,
                    pk.includedPhotos ? `${pk.includedPhotos} photos` : null,
                    pk.includedVideos ? `${pk.includedVideos} videos` : null,
                    pk.deliveryDays ? `${pk.deliveryDays}d delivery` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <button
                      key={pk.id}
                      type="button"
                      data-ck-shape="card"
                      onClick={() => setSelectedPackageChoice(pk.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: `1.5px solid ${selected ? colors.brandPrimary : colors.borderPrimary}`,
                        background: selected ? `${colors.brandPrimary}12` : colors.bgCard,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <i
                        className={`bi ${selected ? 'bi-record-circle-fill' : 'bi-circle'}`}
                        style={{ color: selected ? colors.brandPrimary : colors.textTertiary, marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.86rem', color: colors.textPrimary }}>{pk.name}</span>
                          {pk.price != null && (
                            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: colors.textPrimary }}>
                              {formatMoney(pk.price, pk.currency)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                          {isSuggested && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999, background: MODE_META.HYBRID.soft, color: MODE_META.HYBRID.color }}>
                              Suggested by photographer
                            </span>
                          )}
                          {isNearest && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999, background: `${colors.brandPrimary}18`, color: colors.brandPrimary }}>
                              Nearest to budget
                            </span>
                          )}
                        </div>
                        {inclusions && <div style={{ fontSize: '0.73rem', color: colors.textTertiary, marginTop: 2 }}>{inclusions}</div>}
                      </div>
                    </button>
                  );
                })}

                {eventBudget != null && eventBudget > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPackageChoice('CLIENT_OFFER')}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1.5px solid ${selectedPackageChoice === 'CLIENT_OFFER' ? colors.brandPrimary : colors.borderPrimary}`,
                      background: selectedPackageChoice === 'CLIENT_OFFER' ? `${colors.brandPrimary}12` : colors.bgCard,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <i
                      className={`bi ${selectedPackageChoice === 'CLIENT_OFFER' ? 'bi-record-circle-fill' : 'bi-circle'}`}
                      style={{ color: selectedPackageChoice === 'CLIENT_OFFER' ? colors.brandPrimary : colors.textTertiary, marginTop: 2 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: colors.textPrimary }}>
                          Your event offer amount
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: colors.textPrimary }}>
                          {formatMoney(eventBudget, 'RWF')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: colors.textTertiary }}>
                        {choosing.deliveryPolicy === 'CLIENT' || choosing.pricingMode === 'CLIENT_OFFER'
                          ? 'Accepted by photographer'
                          : 'Original published event offer'}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {agreedPrice != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: colors.bgTertiary }}>
                <span style={{ fontSize: '0.78rem', color: colors.textSecondary }}>
                  Agreed price ({selectedChoosingPkg ? selectedChoosingPkg.name : 'Event offer'})
                </span>
                <span style={{ fontWeight: 900, fontSize: '0.92rem', color: colors.textPrimary }}>
                  {formatMoney(agreedPrice, agreedCurrency)}
                </span>
              </div>
            )}

            <div role="radiogroup" aria-label="First payment" style={{ display: 'grid', gridTemplateColumns: `repeat(${escrowOptions.length}, 1fr)`, gap: 8 }}>
              {escrowOptions.map((p) => {
                const pctAmount =
                  agreedPrice != null && Number.isFinite(agreedPrice) && agreedPrice > 0
                    ? Math.round((agreedPrice * p) / 100)
                    : null;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={escrow === p}
                    onClick={() => setEscrow(p)}
                    className="hy-focus"
                    style={{
                      padding: '10px 6px',
                      borderRadius: 12,
                      border: `2px solid ${escrow === p ? colors.brandPrimary : colors.borderPrimary}`,
                      background: escrow === p ? `${colors.brandPrimary}12` : colors.bgCard,
                      cursor: 'pointer',
                      color: colors.textPrimary,
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{p}%</div>
                    {pctAmount != null && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: colors.textPrimary }}>
                        {formatMoney(pctAmount, agreedCurrency)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: colors.textTertiary }}>
                      {p === 100 ? 'Pay in full' : 'Now, rest later'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.76rem', color: colors.textTertiary }}>
              <i className="bi bi-shield-check" style={{ color: colors.statusSuccess }} /> Held by Connekyt and released by milestones: event day, then delivery.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="hy-focus"
                disabled={submitting}
                onClick={() => setChoosing(null)}
                style={{ padding: '0.6rem 1rem', borderRadius: 10, border: `1.5px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textSecondary, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hy-focus"
                disabled={submitting}
                onClick={confirmChoice}
                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: 'none', background: MODE_META.HYBRID.color, color: '#fff', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' }}
              >
                {submitting
                  ? 'Booking…'
                  : expectedDeposit != null
                    ? `Book and pay ${escrow}% · ${formatMoney(expectedDeposit, agreedCurrency)}`
                    : `Book and pay ${escrow}%`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
