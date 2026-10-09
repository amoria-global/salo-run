"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { getHybridOptions, getHybridProfile, saveHybridProfile, type HybridProfile } from '@/app/lib/hybridBooking';
import { FieldLabel, HybridStyles, MODE_META, Notice, useFieldStyle } from './hybridUi';

/** Why we ask, in the same words on every platform. */
export const INSTAGRAM_WHY = [
  'Clients who use Post My Event are matched with photographers automatically. A public Instagram profile helps Connekyt recommend you.',
  'We read only your public bio, follower and following counts, and profile photo. We never post, message or ask for your password.',
  'It is optional and you can remove it at any time.',
];

const DISMISS_KEY = 'connekyt.matchingPrompt.dismissedAt';
const SNOOZE_DAYS = 7;

const STATUS_COPY: Record<HybridProfile['instagramStatus'], { text: string; tone: 'success' | 'info' | 'warning' } | null> = {
  CONNECTED: { text: 'Connected. Your profile is used for matching.', tone: 'success' },
  PENDING: { text: "Saved. We'll check it shortly.", tone: 'info' },
  NOT_FOUND: { text: "We couldn't find that profile. Check the username, and make sure the account is public.", tone: 'warning' },
  NONE: null,
};

/**
 * The form: Instagram username or link, plus base city when Connekyt can't
 * tell where the photographer works from their address.
 */
export function MatchingProfileForm({ onSaved, compact }: { onSaved?: (p: HybridProfile) => void; compact?: boolean }) {
  const { colors } = useTheme();
  const field = useFieldStyle();
  const [profile, setProfile] = useState<HybridProfile | null>(null);
  const [handle, setHandle] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getHybridProfile().then((p) => { setProfile(p); setHandle(p.instagramHandle ? `@${p.instagramHandle}` : ''); setCity(p.city || ''); }).catch((e) => setError(e?.message));
    getHybridOptions().then((o) => setCities(o.cities.map((c) => c.name))).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const update: { instagramHandle?: string; city?: string } = { instagramHandle: handle.trim() };
      if (city || profile?.needsCity) update.city = city;
      const p = await saveHybridProfile(update);
      setProfile(p);
      setSaved(true);
      onSaved?.(p);
    } catch (e: any) {
      setError(e?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const status = profile ? STATUS_COPY[profile.instagramStatus] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <HybridStyles />
      {!compact && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INSTAGRAM_WHY.map((w, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.84rem', color: colors.textSecondary, lineHeight: 1.45 }}>
              <i className={`bi ${['bi-stars', 'bi-eye', 'bi-toggle-on'][i]}`} aria-hidden style={{ color: MODE_META.HYBRID.color, marginTop: 2 }} />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      <div>
        <FieldLabel htmlFor="hy-ig" hint="Your username or a link to your profile, e.g. @yourstudio or instagram.com/yourstudio">Instagram</FieldLabel>
        <div style={{ position: 'relative' }}>
          <i className="bi bi-instagram" aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textTertiary }} />
          <input id="hy-ig" className="hy-input" style={{ ...field, paddingLeft: 36 }} value={handle} onChange={(e) => { setHandle(e.target.value); setSaved(false); }}
            placeholder="@yourstudio" autoComplete="off" autoCapitalize="none" spellCheck={false} />
        </div>
      </div>
      {(profile?.needsCity || profile?.city) && (
        <div>
          <FieldLabel htmlFor="hy-base-city" hint={profile?.resolvedCity && !profile?.city ? `From your address we think ${profile.resolvedCity}.` : 'So we can send you events near you.'}>Where are you based?</FieldLabel>
          <select id="hy-base-city" className="hy-input" style={field} value={city} onChange={(e) => { setCity(e.target.value); setSaved(false); }}>
            <option value="">Choose your city</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {status && !error && <Notice tone={status.tone}>{saved && profile?.instagramStatus === 'PENDING' ? 'Saved. Thank you!' : status.text}</Notice>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={save} disabled={saving || !profile} className="hy-focus"
          style={{ padding: '0.65rem 1.3rem', borderRadius: 12, border: 'none', background: MODE_META.HYBRID.color, color: '#fff', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/** On the profile page: the same form as a card, anchored at #matching. */
export function MatchingProfileCard() {
  const { colors } = useTheme();
  return (
    <section id="matching" aria-labelledby="hy-matching-title"
      style={{ borderRadius: 18, border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden style={{ width: 36, height: 36, borderRadius: 12, background: MODE_META.HYBRID.soft, color: MODE_META.HYBRID.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-broadcast" />
        </span>
        <div>
          <h3 id="hy-matching-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: colors.textPrimary }}>Matching profile</h3>
          <span style={{ fontSize: '0.78rem', color: colors.textTertiary }}>Used to send you Post My Event opportunities</span>
        </div>
      </div>
      <MatchingProfileForm />
    </section>
  );
}

function snoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < SNOOZE_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * Asks registered photographers once for their Instagram (and city, when
 * unknown). "Later" hides it for a week on this browser.
 */
export function MatchingProfilePrompt() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (snoozed()) return;
    const t = setTimeout(() => {
      getHybridProfile().then((p) => { if (p.needsInstagram || p.needsCity) setOpen(true); }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;
  const later = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    setOpen(false);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hy-prompt-title" onClick={later}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bgOverlay, backdropFilter: 'blur(4px)', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', background: colors.bgModal, borderRadius: 22, padding: 22, border: `1px solid ${colors.borderPrimary}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#F20C8F,#083A85)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            <i className="bi bi-instagram" />
          </span>
          <div>
            <h2 id="hy-prompt-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary }}>Get matched with more events</h2>
            <span style={{ fontSize: '0.8rem', color: colors.textTertiary }}>Takes 20 seconds</span>
          </div>
        </div>
        <MatchingProfileForm onSaved={(p) => { if (!p.needsCity) setTimeout(() => setOpen(false), 1200); }} />
        <button type="button" onClick={later} className="hy-focus"
          style={{ alignSelf: 'center', background: 'none', border: 'none', color: colors.textTertiary, fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}>
          Remind me later
        </button>
      </div>
    </div>
  );
}
