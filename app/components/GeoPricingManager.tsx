'use client';

/**
 * Location pricing & access for an event or photographer package that already exists (kind="event" or "package"). It is the
 * same inline field the event forms use, in a window, with one Save that applies only what changed, one rule at a time (the
 * dedicated endpoints), and names each failure. An event's rules can also be edited in the event's own form, where they save
 * with the event. A package takes prices only (its endpoints have no block).
 *
 * Priority: a country rule beats its continent, which beats the default price. On an event a block beats a price in the
 * same place. Anywhere without a rule pays the default, so existing events and packages are unaffected until an owner opts in.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LocationRulesField, { fetchSavedRules, useCurrencyChoices, useLocationRules } from './LocationRulesField';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { useTheme } from '../context/ThemeContext';
import { diffRules, type LocationRule } from '@/lib/geoRules';

export default function GeoPricingManager({
  open,
  onClose,
  kind,
  targetId,
  name,
}: {
  open: boolean;
  onClose: () => void;
  kind: 'event' | 'package';
  targetId: string;
  name?: string;
}) {
  const { colors } = useTheme();
  const base = useMemo(
    () => `${getApiUrl()}/api/remote/${kind === 'package' ? 'packages' : 'events'}/${targetId}/geo-prices`,
    [kind, targetId],
  );
  const geo = useLocationRules({ initiallyOpen: true });
  const { hydrate } = geo;
  const currencies = useCurrencyChoices();

  const [saved, setSaved] = useState<LocationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rules = await fetchSavedRules(kind, targetId);
      setSaved(rules);
      hydrate(rules);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load the saved rules.');
    } finally {
      setLoading(false);
    }
  }, [kind, targetId, hydrate]);

  useEffect(() => {
    if (open && targetId) void load();
  }, [open, targetId, load]);

  const changes = useMemo(() => diffRules(saved, geo.rules), [saved, geo.rules]);
  const dirty = changes.upserts.length + changes.deletes.length > 0;

  const call = async (url: string, method: 'POST' | 'DELETE', body?: unknown) => {
    const res = await dashboardAuthFetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.action === 0) throw new Error(json?.message || 'That change could not be saved.');
  };

  const save = async () => {
    if (geo.blockSave() || !dirty) return;
    setSaving(true);
    setError(null);
    const jobs = [
      ...changes.upserts.map((r) =>
        call(
          base,
          'POST',
          kind === 'package' || r.action === 'PRICE'
            ? { scopeType: r.scopeType, scopeValue: r.scopeValue, ...(kind === 'event' ? { action: 'PRICE' } : {}), price: r.price ?? 0, currencyId: r.currencyId }
            : { scopeType: r.scopeType, scopeValue: r.scopeValue, action: 'BLOCK' },
        ),
      ),
      ...changes.deletes.map((r) => call(`${base}/${r.id}`, 'DELETE')),
    ];
    const results = await Promise.allSettled(jobs);
    const failed = results.filter((x): x is PromiseRejectedResult => x.status === 'rejected');
    if (failed.length > 0) {
      const why = failed[0].reason instanceof Error ? failed[0].reason.message : 'A change could not be saved.';
      setError(failed.length === 1 ? why : `${failed.length} changes could not be saved. ${why}`);
    }
    // Reload either way, so the window always shows what the server has.
    await load();
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ background: colors.bgOverlay }}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: colors.bgModal, color: colors.textPrimary }}
        role="dialog"
        aria-modal="true"
        aria-label="Location pricing and access"
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.brandPrimary }}>Location pricing &amp; access</h2>
            <p className="text-xs" style={{ color: colors.textTertiary }}>{name ? `${name} · ` : ''}Different prices by location{kind === 'event' ? ', or block a place' : ''}</p>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full" style={{ color: colors.textTertiary }} aria-label="Close">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loading && saved.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textTertiary }}>Loading…</p>
          ) : loadError ? (
            <p className="text-sm" style={{ color: colors.statusError }}>
              {loadError}{' '}
              <button type="button" onClick={() => void load()} style={{ color: colors.brandPrimary, fontWeight: 700 }}>Try again</button>
            </p>
          ) : (
            <LocationRulesField geo={geo} currencies={currencies} allowBlock={kind === 'event'} disabled={saving} id="geo-manager" />
          )}

          {error ? <p className="text-sm" style={{ color: colors.statusError }}>{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: colors.textSecondary }}>
              Close
            </button>
            <button
              onClick={() => void save()}
              disabled={!dirty || saving || !!loadError}
              data-testid="geo-manager-save"
              className="px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ background: colors.brandPrimary, color: colors.textInverse }}
            >
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
