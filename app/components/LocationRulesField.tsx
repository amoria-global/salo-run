'use client';

/**
 * "Location pricing & access (optional)": an inline, collapsible form field. Collapsed it is one row with a summary line;
 * open it lists the event's location rules and ONE inline row to add the next (search a country or continent, choose Price
 * or Block, enter the price). The form owns the rules, saves them WITH the event (`geoRules`), and shows the server's field
 * errors on the row they belong to. `useLocationRules` holds the state for a form that has one.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MoneyInput from './MoneyInput';
import { useTheme } from '../context/ThemeContext';
import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getCurrencies } from '@/lib/donationApi';
import {
  EMPTY_DRAFT,
  OPEN_RULE_HINT,
  PRECEDENCE_HINT,
  draftProblem,
  hasOpenDraft,
  ruleErrorIndex,
  ruleFromDraft,
  ruleFromServer,
  ruleValue,
  searchLocations,
  sortRules,
  summarize,
  toPayload,
  type GeoLocation,
  type LocationRule,
  type RuleAction,
  type RuleDraft,
} from '@/lib/geoRules';

export type LocationsStatus = 'loading' | 'ready' | 'error';
export type CurrencyChoice = { value: string; code: string; name?: string };

/** The countries and continents a rule can name: one list, served by the server, the same on every client. */
export async function fetchGeoLocations(): Promise<GeoLocation[]> {
  const res = await fetch(`${getApiUrl()}/api/remote/public/geo/locations`);
  const json = await res.json();
  if (json?.action !== 1) throw new Error('locations');
  const read = (rows: unknown, scopeType: GeoLocation['scopeType']): GeoLocation[] =>
    (Array.isArray(rows) ? rows : [])
      .map((r: Record<string, unknown>) => ({
        scopeType,
        code: typeof r.code === 'string' ? r.code : '',
        name: typeof r.name === 'string' ? r.name : '',
        continentName: typeof r.continentName === 'string' ? r.continentName : undefined,
        countryCount: typeof r.countryCount === 'number' ? r.countryCount : undefined,
      }))
      .filter((x) => x.code && x.name);
  return [...read(json.data?.countries, 'COUNTRY'), ...read(json.data?.continents, 'CONTINENT')];
}

/** The saved rules of an event or package, for an edit form or a manager. Throws when they cannot be read. */
export async function fetchSavedRules(kind: 'event' | 'package', id: string): Promise<LocationRule[]> {
  const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/${kind === 'package' ? 'packages' : 'events'}/${encodeURIComponent(id)}/geo-prices`);
  const json = await res.json();
  if (!res.ok || json?.action === 0) throw new Error(json?.message || 'Could not load the saved rules.');
  const rows: Record<string, unknown>[] = Array.isArray(json?.data?.rules) ? json.data.rules : [];
  return rows.map((r) =>
    ruleFromServer({
      id: String(r.id),
      scopeType: r.scopeType === 'CONTINENT' ? 'CONTINENT' : 'COUNTRY',
      scopeValue: String(r.scopeValue ?? ''),
      action: r.action === 'BLOCK' ? 'BLOCK' : 'PRICE',
      price: typeof r.price === 'number' ? r.price : undefined,
      currencyId: typeof r.currencyId === 'string' ? r.currencyId : undefined,
      currencyAbbreviation: typeof r.currencyAbbreviation === 'string' ? r.currencyAbbreviation : undefined,
    }),
  );
}

/** The currencies a price can be set in, from the server's list. */
export function useCurrencyChoices(): CurrencyChoice[] {
  const [list, setList] = useState<CurrencyChoice[]>([]);
  useEffect(() => {
    let live = true;
    getCurrencies().then((r) => {
      if (live && r.success && r.data) setList(r.data.map((c) => ({ value: c.id, code: c.code, name: c.name })));
    });
    return () => {
      live = false;
    };
  }, []);
  return list;
}

export function useLocationRules(options: { initiallyOpen?: boolean } = {}) {
  const [stored, setStored] = useState<LocationRule[]>([]);
  const [draft, setDraft] = useState<RuleDraft | null>(null);
  const [expanded, setExpanded] = useState(options.initiallyOpen ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [ruleErrors, setRuleErrors] = useState<Record<number, string>>({});
  const [locations, setLocations] = useState<GeoLocation[]>([]);
  const [status, setStatus] = useState<LocationsStatus>('loading');

  // Fetched once, when the field is first opened. A retry sets 'loading' again, which fetches again.
  useEffect(() => {
    if (!expanded || status !== 'loading' || locations.length > 0) return;
    let live = true;
    fetchGeoLocations()
      .then((list) => {
        if (!live) return;
        setLocations(list);
        setStatus('ready');
      })
      .catch(() => {
        if (live) setStatus('error');
      });
    return () => {
      live = false;
    };
  }, [expanded, status, locations.length]);

  // A saved rule only knows its code; its name comes from the list of places once that is here.
  const rules = useMemo(
    () =>
      locations.length === 0
        ? stored
        : stored.map((r) => {
            const hit = locations.find((l) => l.scopeType === r.scopeType && l.code === r.scopeValue);
            return hit && hit.name !== r.label ? { ...r, label: hit.name } : r;
          }),
    [stored, locations],
  );

  const hydrate = useCallback((saved: LocationRule[]) => setStored(saved), []);
  const setRules = useCallback((next: LocationRule[]) => {
    setStored(next);
    setMessage(null);
    setRuleErrors({});
  }, []);
  const onDraftChange = useCallback((d: RuleDraft | null) => {
    setDraft(d);
    if (d == null || !hasOpenDraft(d)) setMessage(null);
  }, []);

  /** True (and the field says why) when a rule is half typed: the save must wait. */
  const blockSave = useCallback((): boolean => {
    if (!hasOpenDraft(draft)) return false;
    setExpanded(true);
    setMessage(OPEN_RULE_HINT);
    return true;
  }, [draft]);

  /** Opens the field and puts the server's refusal on the rule it names (or under the field when it names none). */
  const showServerError = useCallback((field: string | undefined, text: string) => {
    const bad = ruleErrorIndex(field);
    setExpanded(true);
    if (bad) setRuleErrors({ [bad.index]: text });
    else setMessage(text);
  }, []);

  return {
    rules,
    setRules,
    hydrate,
    draft,
    onDraftChange,
    expanded,
    toggle: () => setExpanded((v) => !v),
    message,
    ruleErrors,
    locations,
    status,
    retry: () => setStatus('loading'),
    /** The `geoRules` to send with the event. */
    payload: () => toPayload(rules),
    blockSave,
    showServerError,
    /** Clears the field for the next event. */
    reset: () => {
      setStored([]);
      setDraft(null);
      setMessage(null);
      setRuleErrors({});
    },
  };
}

type Props = {
  geo: ReturnType<typeof useLocationRules>;
  currencies: CurrencyChoice[];
  /** The currency a new price starts in. */
  defaultCurrencyId?: string;
  /** False where the thing being priced cannot block a place (a photographer package): prices only. */
  allowBlock?: boolean;
  disabled?: boolean;
  id?: string;
};

export default function LocationRulesField({ geo, currencies, defaultCurrencyId, allowBlock = true, disabled, id = 'geo-rules' }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const { rules, draft, expanded, locations } = geo;

  const ordered = useMemo(() => sortRules(rules), [rules]);
  const matches = useMemo(
    () => (draft && !draft.location ? searchLocations(locations, query, rules) : []),
    [draft, locations, query, rules],
  );

  const box: React.CSSProperties = { border: `1px solid ${colors.borderPrimary}`, borderRadius: 14, background: colors.bgCard };
  const muted: React.CSSProperties = { color: colors.textTertiary, fontSize: 12, lineHeight: 1.5, margin: 0 };
  const link: React.CSSProperties = { background: 'none', border: 0, padding: 0, color: colors.brandPrimary, font: 'inherit', fontWeight: 600, cursor: 'pointer' };

  const openNew = () => {
    setProblem(null);
    setQuery('');
    const cur = currencies.find((c) => c.value === defaultCurrencyId) ?? currencies[0];
    geo.onDraftChange({ ...EMPTY_DRAFT, currencyId: cur?.value, currencyCode: cur?.code });
  };
  const cancel = () => {
    setProblem(null);
    setQuery('');
    geo.onDraftChange(null);
  };
  const add = () => {
    if (!draft) return;
    const why = draftProblem(draft, rules);
    if (why) return setProblem(why);
    const rule = ruleFromDraft(draft, rules);
    if (!rule) return;
    geo.setRules([...rules, rule]);
    cancel();
  };
  const edit = (rule: LocationRule) => {
    if (draft) return setProblem(OPEN_RULE_HINT);
    geo.setRules(rules.filter((r) => r.key !== rule.key));
    setQuery('');
    setProblem(null);
    geo.onDraftChange({
      location: { scopeType: rule.scopeType, code: rule.scopeValue, name: rule.label },
      action: rule.action,
      priceText: rule.price != null ? String(rule.price) : '',
      currencyId: rule.currencyId,
      currencyCode: rule.currencyCode,
    });
  };
  const setAction = (action: RuleAction) => draft && geo.onDraftChange({ ...draft, action });

  return (
    <div style={box} data-testid={id}>
      <button
        type="button"
        onClick={geo.toggle}
        aria-expanded={expanded}
        disabled={disabled}
        data-testid={`${id}-header`}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 14, background: 'none', border: 0, cursor: 'pointer', color: colors.textPrimary }}
      >
        <span style={{ width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: colors.statusInfoBg, color: colors.brandPrimary }}>
          <i className="bi bi-globe2" aria-hidden />
        </span>
        <span style={{ flex: 1, display: 'grid', gap: 2 }}>
          <strong style={{ fontSize: 14 }}>Location pricing &amp; access (optional)</strong>
          <span style={{ fontSize: 13, color: colors.textSecondary }} data-testid={`${id}-summary`}>{summarize(rules)}</span>
        </span>
        <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden style={{ color: colors.brandPrimary }} />
      </button>

      {expanded ? (
        <div style={{ display: 'grid', gap: 12, padding: '0 14px 14px' }}>
          <p style={muted}>
            {allowBlock
              ? `Charge a different price in some places, or keep a place from watching at all. ${PRECEDENCE_HINT}`
              : 'Charge a different price in some places. A country price wins over its continent, and a continent over the default price.'}
          </p>

          {ordered.length === 0 && !draft ? <p style={{ ...muted, fontSize: 13 }}>No location rules yet. Everyone pays the same price.</p> : null}

          {ordered.map((rule) => {
            const err = geo.ruleErrors[rules.indexOf(rule)];
            const blocked = rule.action === 'BLOCK';
            return (
              <div key={rule.key} data-testid={`${id}-row-${rule.key}`} style={{ border: `1px solid ${err ? colors.statusError : colors.borderPrimary}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => edit(rule)}
                    disabled={disabled}
                    aria-label={`Edit ${rule.label}, ${ruleValue(rule)}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '8px 12px', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', color: colors.textPrimary }}
                  >
                    <i className={`bi ${blocked ? 'bi-slash-circle' : rule.scopeType === 'COUNTRY' ? 'bi-flag' : 'bi-globe'}`} aria-hidden style={{ color: blocked ? colors.statusError : colors.brandPrimary }} />
                    <span style={{ flex: 1, display: 'grid' }}>
                      <strong style={{ fontSize: 14 }}>{rule.label}</strong>
                      <span style={{ fontSize: 12, color: colors.textTertiary }}>{rule.scopeType === 'COUNTRY' ? 'Country' : 'Continent'}</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: `1px solid ${blocked ? colors.statusError : colors.brandPrimary}`, color: blocked ? colors.statusError : colors.brandPrimary }}>
                      {ruleValue(rule)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => geo.setRules(rules.filter((r) => r.key !== rule.key))}
                    disabled={disabled}
                    aria-label={`Remove ${rule.label}`}
                    style={{ width: 44, height: 44, background: 'none', border: 0, cursor: 'pointer', color: colors.textTertiary }}
                  >
                    <i className="bi bi-x-lg" aria-hidden />
                  </button>
                </div>
                {err ? <p style={{ margin: 0, padding: '0 12px 10px', color: colors.statusError, fontSize: 12, fontWeight: 600 }}>{err}</p> : null}
              </div>
            );
          })}

          {draft ? (
            <div data-testid={`${id}-draft`} style={{ display: 'grid', gap: 12, border: `1px solid ${colors.brandPrimary}`, borderRadius: 12, padding: 12 }}>
              {draft.location ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
                  <i className={`bi ${draft.location.scopeType === 'COUNTRY' ? 'bi-flag' : 'bi-globe'}`} aria-hidden style={{ color: colors.brandPrimary }} />
                  <strong style={{ flex: 1, color: colors.textPrimary }}>{draft.location.name}</strong>
                  <button type="button" style={link} onClick={() => { setQuery(''); geo.onDraftChange({ ...draft, location: null }); }}>Change</button>
                </div>
              ) : (
                <div>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a country or continent"
                    aria-label="Search a country or continent"
                    data-testid={`${id}-search`}
                    autoFocus
                    style={{ width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, border: `1px solid ${colors.borderPrimary}`, background: colors.bgInput, color: colors.textPrimary }}
                  />
                  {geo.status === 'loading' ? (
                    <p style={{ ...muted, padding: '8px 0' }}>Loading places</p>
                  ) : geo.status === 'error' ? (
                    <p style={{ ...muted, padding: '8px 0' }}>
                      We could not load the list of places. <button type="button" style={link} onClick={geo.retry}>Retry</button>
                    </p>
                  ) : matches.length === 0 ? (
                    <p style={{ ...muted, padding: '8px 0' }}>{`No place matches "${query}".`}</p>
                  ) : (
                    <ul role="listbox" style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, maxHeight: 220, overflowY: 'auto', border: `1px solid ${colors.borderPrimary}`, borderRadius: 10 }}>
                      {matches.map((l) => (
                        <li key={`${l.scopeType}:${l.code}`} role="option" aria-selected={false}>
                          <button
                            type="button"
                            onClick={() => { setProblem(null); geo.onDraftChange({ ...draft, location: l }); }}
                            aria-label={`${l.name}, ${l.scopeType === 'COUNTRY' ? 'country' : 'continent'}`}
                            style={{ display: 'grid', width: '100%', textAlign: 'left', minHeight: 44, padding: '6px 12px', background: 'none', border: 0, borderBottom: `1px solid ${colors.borderPrimary}`, cursor: 'pointer', color: colors.textPrimary }}
                          >
                            <strong style={{ fontSize: 14 }}>{l.name}</strong>
                            <span style={{ fontSize: 12, color: colors.textTertiary }}>
                              {l.scopeType === 'COUNTRY' ? l.continentName ?? 'Country' : `Continent, ${l.countryCount ?? ''} countries`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {allowBlock ? (
                <div role="group" aria-label="Rule type" style={{ display: 'flex', padding: 4, gap: 4, borderRadius: 999, border: `1px solid ${colors.borderPrimary}` }}>
                  {(['PRICE', 'BLOCK'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={draft.action === a}
                      onClick={() => setAction(a)}
                      style={{ flex: 1, minHeight: 38, borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: 700, background: draft.action === a ? colors.brandPrimary : 'transparent', color: draft.action === a ? colors.textInverse : colors.textSecondary }}
                    >
                      {a === 'PRICE' ? 'Price' : 'Block'}
                    </button>
                  ))}
                </div>
              ) : null}

              {draft.action === 'PRICE' || !allowBlock ? (
                <MoneyInput
                  label={draft.location ? `Price for ${draft.location.name}` : 'Price'}
                  value={draft.priceText}
                  onChange={(priceText) => geo.onDraftChange({ ...draft, priceText })}
                  currencyId={draft.currencyId ?? ''}
                  onCurrencyChange={(cid) => geo.onDraftChange({ ...draft, currencyId: cid, currencyCode: currencies.find((c) => c.value === cid)?.code })}
                  currencies={currencies}
                  placeholder="0"
                  showLimits={false}
                />
              ) : (
                <p style={{ ...muted, fontSize: 13, color: colors.textSecondary }}>
                  {`People in ${draft.location?.name ?? 'this place'} will not be able to watch, buy, send gifts or donate for this event. Anyone who paid before the block keeps their access.`}
                </p>
              )}

              {problem ? <p style={{ margin: 0, color: colors.statusError, fontSize: 13, fontWeight: 600 }}>{problem}</p> : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={cancel} style={{ ...link, minHeight: 44, padding: '0 12px', color: colors.textSecondary }}>Cancel</button>
                <button type="button" onClick={add} data-testid={`${id}-add`} style={{ minHeight: 44, padding: '0 18px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700, background: colors.brandPrimary, color: colors.textInverse }}>
                  {draft.action === 'BLOCK' ? 'Block place' : 'Add price'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openNew}
              disabled={disabled}
              data-testid={`${id}-new`}
              style={{ minHeight: 48, borderRadius: 12, border: `1px dashed ${colors.brandPrimary}`, background: 'none', cursor: 'pointer', color: colors.brandPrimary, fontWeight: 700 }}
            >
              + Add a location rule
            </button>
          )}

          {geo.message ? <p style={{ margin: 0, color: colors.statusError, fontSize: 13, fontWeight: 600 }} data-testid={`${id}-message`}>{geo.message}</p> : null}
        </div>
      ) : geo.message ? (
        <p style={{ margin: 0, padding: '0 14px 14px', color: colors.statusError, fontSize: 13, fontWeight: 600 }} data-testid={`${id}-message`}>{geo.message}</p>
      ) : null}
    </div>
  );
}
