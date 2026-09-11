'use client';

/**
 * Geo-pricing manager (owner) — set different stream/package prices per
 * location. Works for both an event's stream price (kind="event") and a
 * photographer package (kind="package"). Priority: a country price beats a
 * continent price, which beats the default. Anywhere without a rule pays the
 * default, so existing events/packages are unaffected until an owner opts in.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { getCurrencies, type CurrencyInfo } from '@/lib/donationApi';

const NAVY = '#083A85';
const PINK = '#F20C8F';

type Scope = 'COUNTRY' | 'CONTINENT';

type Rule = {
  id: string;
  scopeType: Scope;
  scopeValue: string;
  price: number;
  currencyId?: string;
  currencyAbbreviation?: string;
  currencySymbol?: string;
};

const CONTINENTS: { code: string; label: string }[] = [
  { code: 'AF', label: 'Africa' },
  { code: 'AS', label: 'Asia' },
  { code: 'EU', label: 'Europe' },
  { code: 'NA', label: 'North America' },
  { code: 'SA', label: 'South America' },
  { code: 'OC', label: 'Oceania' },
];

const COUNTRIES: { code: string; label: string }[] = [
  { code: 'RW', label: 'Rwanda' }, { code: 'KE', label: 'Kenya' }, { code: 'UG', label: 'Uganda' },
  { code: 'TZ', label: 'Tanzania' }, { code: 'BI', label: 'Burundi' }, { code: 'CD', label: 'DR Congo' },
  { code: 'NG', label: 'Nigeria' }, { code: 'GH', label: 'Ghana' }, { code: 'ZA', label: 'South Africa' },
  { code: 'ET', label: 'Ethiopia' }, { code: 'EG', label: 'Egypt' }, { code: 'MA', label: 'Morocco' },
  { code: 'US', label: 'United States' }, { code: 'CA', label: 'Canada' }, { code: 'GB', label: 'United Kingdom' },
  { code: 'FR', label: 'France' }, { code: 'DE', label: 'Germany' }, { code: 'BE', label: 'Belgium' },
  { code: 'NL', label: 'Netherlands' }, { code: 'IT', label: 'Italy' }, { code: 'ES', label: 'Spain' },
  { code: 'SE', label: 'Sweden' }, { code: 'CH', label: 'Switzerland' }, { code: 'IE', label: 'Ireland' },
  { code: 'AE', label: 'United Arab Emirates' }, { code: 'SA', label: 'Saudi Arabia' }, { code: 'QA', label: 'Qatar' },
  { code: 'IN', label: 'India' }, { code: 'CN', label: 'China' }, { code: 'JP', label: 'Japan' },
  { code: 'SG', label: 'Singapore' }, { code: 'AU', label: 'Australia' }, { code: 'NZ', label: 'New Zealand' },
  { code: 'BR', label: 'Brazil' }, { code: 'MX', label: 'Mexico' },
];

const labelFor = (r: Rule) =>
  (r.scopeType === 'CONTINENT' ? CONTINENTS : COUNTRIES).find((o) => o.code === r.scopeValue)?.label ?? r.scopeValue;

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
  const base = useMemo(
    () => `${getApiUrl()}/api/remote/${kind === 'package' ? 'packages' : 'events'}/${targetId}/geo-prices`,
    [kind, targetId],
  );

  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [defaultPrice, setDefaultPrice] = useState<number | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<string | undefined>();
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);

  const [scope, setScope] = useState<Scope>('CONTINENT');
  const [scopeValue, setScopeValue] = useState('');
  const [price, setPrice] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAuthFetch(base);
      const json = await res.json();
      const d = json?.data ?? {};
      setDefaultPrice(typeof d.defaultPrice === 'number' ? d.defaultPrice : null);
      setDefaultCurrency(d.defaultCurrencyAbbreviation ?? undefined);
      setCurrencyId((prev) => prev || d.defaultCurrencyId || '');
      setRules(Array.isArray(d.rules) ? d.rules : []);
    } catch {
      setError('Could not load geo-pricing.');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    if (!open) return;
    load();
    getCurrencies().then((r) => r.success && r.data && setCurrencies(r.data));
  }, [open, load]);

  const options = scope === 'CONTINENT' ? CONTINENTS : COUNTRIES;
  const effectiveCurrencyId = currencyId;

  const save = async () => {
    setError(null);
    if (!scopeValue) return setError('Pick a region.');
    const p = Number(price);
    if (!price || Number.isNaN(p) || p < 0) return setError('Enter a valid price.');
    setSaving(true);
    try {
      const res = await dashboardAuthFetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeType: scope, scopeValue, price: p, currencyId: effectiveCurrencyId || undefined }),
      });
      const json = await res.json();
      if (json?.action !== 1) throw new Error(json?.message || 'Could not save the price.');
      setScopeValue('');
      setPrice('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the price.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rule: Rule) => {
    if (!confirm(`Remove the price for ${labelFor(rule)}?`)) return;
    try {
      const res = await dashboardAuthFetch(`${base}/${rule.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json?.action !== 1) throw new Error();
      load();
    } catch {
      setError('Could not remove the price.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ background: 'rgba(2,8,23,0.55)' }}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>Geo pricing</h2>
            <p className="text-xs text-slate-500">{name ? `${name} · ` : ''}Different prices by location</p>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Close">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="rounded-xl p-3 text-sm" style={{ background: '#EEF2FB', color: NAVY }}>
            A <b>country</b> price beats a <b>continent</b> price, which beats your{' '}
            <b>default{defaultPrice != null ? ` (${defaultPrice.toLocaleString()} ${defaultCurrency ?? ''})` : ''}</b>.
            Anywhere without a rule pays the default.
          </div>

          {/* Existing rules */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Location prices</h3>
            {loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : rules.length === 0 ? (
              <p className="text-sm text-slate-400">No location prices yet — everyone pays your default.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.scopeType === 'CONTINENT' ? '#EEF2FB' : '#FCE7F3', color: r.scopeType === 'CONTINENT' ? NAVY : PINK }}>
                      {r.scopeType === 'CONTINENT' ? 'Continent' : 'Country'}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-800 truncate">{labelFor(r)}</span>
                    <span className="text-sm font-bold" style={{ color: NAVY }}>
                      {r.price.toLocaleString()} {r.currencyAbbreviation ?? defaultCurrency ?? ''}
                    </span>
                    <button onClick={() => remove(r)} className="text-slate-400 hover:text-rose-600 text-sm" aria-label="Remove">🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add rule */}
          <div className="rounded-xl border border-slate-100 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Add a location price</h3>
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              {(['CONTINENT', 'COUNTRY'] as Scope[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setScope(s); setScopeValue(''); }}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition"
                  style={scope === s ? { background: 'white', color: NAVY, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#64748b' }}
                >
                  {s === 'CONTINENT' ? 'Continent' : 'Country'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <button
                  key={o.code}
                  onClick={() => setScopeValue(o.code)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
                  style={scopeValue === o.code ? { background: NAVY, color: 'white', borderColor: NAVY } : { background: 'white', color: '#334155', borderColor: '#e2e8f0' }}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="Price"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
              />
              <select
                value={effectiveCurrencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                {currencies.length === 0 ? <option value="">Currency</option> : null}
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </select>
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: NAVY }}
            >
              {saving ? 'Saving…' : 'Save price'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
