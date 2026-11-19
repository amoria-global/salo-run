'use client';

/**
 * Service area: the area or neighbourhood a photographer works in, shown to clients as an approximate position on the map.
 * The dashboard's panel version of the mobile screens (design/connekyt-service-area-reference.png, A to C), on the profile page.
 *
 *   - Not set: "you're not on the map", with a search for an area or neighbourhood (our own place search, never a street address).
 *   - Confirm: the chosen area, an approximate-circle preview when map tiles load, and Save.
 *   - Set: the saved area with Change and "Remove my area".
 *
 * Only the id of the chosen place is sent when saving; the server looks up the centre itself. No admin review is needed, and
 * removing the area takes the photographer off the map straight away. Without map tiles the panel still works: the preview is
 * simply absent, with no spinner left behind and no error.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { buildAreaPreviewHtml } from '@/app/lib/areaPreviewHtml';
import {
  getAreaDetails,
  getServiceArea,
  removeServiceArea,
  saveServiceArea,
  searchAreas,
  type AreaDetails,
  type AreaSuggestion,
  type ServiceArea,
} from '@/app/lib/serviceArea';

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY ?? '';

type SearchState = 'idle' | 'loading' | 'done' | 'error';

/** A small map of the area with a dashed circle of about 1 km. Drawn only once real tiles have loaded; otherwise nothing. */
function AreaPreview({ lat, lng }: { lat: number | null; lng: number | null }) {
  const { colors } = useTheme();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  const html = useMemo(
    () =>
      lat == null || lng == null
        ? null
        : buildAreaPreviewHtml({
            lat,
            lng,
            key: CARTO_KEY,
            colors: {
              background: colors.bgInput,
              circle: colors.brandPrimary,
              circleFill: colors.brandPrimary,
              centre: colors.brandPrimary,
              attribution: colors.textSecondary,
              attributionBg: colors.bgCard,
            },
          }),
    [lat, lng, colors],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data === 'area-preview:ready') setState('ready');
      else if (e.data === 'area-preview:failed') setState('failed');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!html || state === 'failed') return null;
  return (
    <div
      data-testid="area-preview"
      style={{ position: 'relative', height: 176, borderRadius: 14, overflow: 'hidden', border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgInput }}
    >
      {/* No allow-same-origin: the page is our own and needs only scripts. It tells us by message when tiles have loaded. */}
      <iframe
        title="Map of your service area, approximate"
        srcDoc={html}
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 0, opacity: state === 'ready' ? 1 : 0 }}
      />
      {state === 'ready' ? (
        <span style={{ position: 'absolute', left: 8, bottom: 8, padding: '3px 9px', borderRadius: 999, fontSize: 11, color: colors.textSecondary, backgroundColor: colors.bgCard, border: `1px solid ${colors.borderPrimary}` }}>
          Approximate area · about 1 km
        </span>
      ) : null}
    </div>
  );
}

export default function ServiceAreaPanel() {
  const { colors } = useTheme();

  const [saved, setSaved] = useState<ServiceArea | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [changing, setChanging] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AreaSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  const [picked, setPicked] = useState<AreaSuggestion | null>(null);
  const [details, setDetails] = useState<AreaDetails | null>(null);
  const [detailsState, setDetailsState] = useState<'idle' | 'loading' | 'error'>('idle');

  const [busy, setBusy] = useState<'save' | 'remove' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setSaved(await getServiceArea());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // Search runs from the input (debounced); each keystroke cancels the one before it.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const runSearch = useCallback((text: string, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    abort.current?.abort();
    if (text.trim().length < 2) {
      setResults([]);
      setSearchState('idle');
      return;
    }
    setSearchState('loading');
    const ac = new AbortController();
    abort.current = ac;
    timer.current = setTimeout(async () => {
      try {
        const r = await searchAreas(text, ac.signal);
        if (ac.signal.aborted) return;
        setResults(r);
        setSearchState('done');
      } catch {
        if (!ac.signal.aborted) setSearchState('error');
      }
    }, delay);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      abort.current?.abort();
    },
    [],
  );

  const choose = async (s: AreaSuggestion) => {
    setNotice(null);
    setActionError(null);
    setDone(null);
    setPicked(s);
    setDetails(null);
    setDetailsState('loading');
    try {
      const d = await getAreaDetails(s.placeId);
      if (!d.isArea) {
        setPicked(null);
        setDetailsState('idle');
        setNotice('Choose an area or neighbourhood, not a street address.');
        return;
      }
      if (!d.supported) {
        setPicked(null);
        setDetailsState('idle');
        setNotice('Connekyt is not available in that country yet.');
        return;
      }
      setDetails(d);
      setDetailsState('idle');
    } catch {
      setDetailsState('error');
    }
  };

  const save = async () => {
    if (!picked || busy) return;
    setBusy('save');
    setActionError(null);
    try {
      const a = await saveServiceArea(picked.placeId);
      setSaved(a);
      setDone(`You're on the map in ${a.name ?? picked.name}`);
      setPicked(null);
      setDetails(null);
      setChanging(false);
      setQuery('');
      setResults([]);
      setSearchState('idle');
    } catch (e) {
      setActionError(e instanceof Error && e.message ? e.message : 'We could not save your service area. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy('remove');
    setActionError(null);
    try {
      setSaved(await removeServiceArea());
      setDone("You're off the map");
      setChanging(false);
    } catch (e) {
      setActionError(e instanceof Error && e.message ? e.message : 'We could not remove your service area. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const hasSaved = !!saved?.set;
  const confirming = picked !== null || (hasSaved && !changing);
  const cardName = details?.name || picked?.name || saved?.name || '';
  const cardContext = details?.context || (picked ? picked.secondary : saved?.context) || '';
  const lat = details ? details.latitude : saved?.latitude ?? null;
  const lng = details ? details.longitude : saved?.longitude ?? null;

  const card: React.CSSProperties = { backgroundColor: colors.bgCard, border: `1px solid ${colors.borderPrimary}`, borderRadius: 16, padding: '1rem 1.25rem' };
  const note: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '0.65rem 0.85rem', borderRadius: 10, backgroundColor: colors.statusInfoBg, color: colors.textSecondary, fontSize: 13 };
  const primary: React.CSSProperties = { padding: '0.6rem 1.1rem', borderRadius: 10, border: 0, backgroundColor: colors.brandPrimary, color: colors.textInverse, fontWeight: 600, cursor: 'pointer' };
  const secondary: React.CSSProperties = { padding: '0.5rem 0.9rem', borderRadius: 10, border: `1px solid ${colors.borderPrimary}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: 'pointer' };

  const inlineError = (message: string, onRetry: () => void) => (
    <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '0.65rem 0.85rem', borderRadius: 10, border: `1px solid ${colors.statusError}`, color: colors.statusError, fontSize: 13 }}>
      <span style={{ flex: 1, minWidth: 180 }}>{message}</span>
      <button type="button" onClick={onRetry} style={secondary}>Try again</button>
    </div>
  );

  return (
    <section aria-labelledby="service-area-title" style={{ ...card, display: 'grid', gap: '0.85rem' }}>
      <div>
        <h3 id="service-area-title" style={{ margin: 0, fontSize: 16, color: colors.textPrimary }}>Service area</h3>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textSecondary }}>
          {loadState === 'ready' && !hasSaved
            ? "Not set · you're not on the map. Clients searching nearby will find you once you choose an area."
            : 'Where you appear on the map. Clients see an approximate area, never your address.'}
        </p>
      </div>

      {done ? <div role="status" style={{ ...note, color: colors.textPrimary }}>{done}</div> : null}

      {loadState === 'loading' ? (
        <p style={{ margin: 0, fontSize: 13, color: colors.textTertiary }}>Loading your service area…</p>
      ) : loadState === 'error' ? (
        inlineError("We could not load your service area.", () => void load())
      ) : confirming ? (
        // ─────────── Confirm / saved ───────────
        detailsState === 'loading' ? (
          <p style={{ margin: 0, fontSize: 13, color: colors.textTertiary }}>Checking this area…</p>
        ) : detailsState === 'error' && picked ? (
          inlineError("We could not check that area right now.", () => void choose(picked))
        ) : (
          <>
            <AreaPreview lat={lat} lng={lng} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgInput }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: colors.textPrimary }}>{cardName}</div>
                {cardContext ? <div style={{ fontSize: 13, color: colors.textSecondary }}>{cardContext}</div> : null}
                <div style={{ fontSize: 11, color: colors.textTertiary }}>approximate area</div>
              </div>
              <button
                type="button"
                style={secondary}
                onClick={() => {
                  setChanging(true);
                  setPicked(null);
                  setDetails(null);
                  setActionError(null);
                  setDone(null);
                }}
              >
                Change
              </button>
            </div>
            <div style={note}>
              <span aria-hidden>👁</span>
              <span>Clients see this approximate area and a rounded distance. Your address is never shown.</span>
            </div>
            {actionError ? inlineError(actionError, () => void (picked ? save() : remove())) : null}
            {picked ? (
              <button type="button" style={{ ...primary, opacity: !details || busy ? 0.7 : 1 }} disabled={!details || busy !== null} onClick={save}>
                {busy === 'save' ? 'Saving…' : 'Save service area'}
              </button>
            ) : null}
            {hasSaved ? (
              <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
                <button type="button" style={{ ...secondary, color: colors.statusError }} disabled={busy !== null} onClick={remove}>
                  {busy === 'remove' ? 'Removing…' : 'Remove my area'}
                </button>
                <span style={{ fontSize: 12, color: colors.textTertiary }}>Removing takes you off the map straight away.</span>
              </div>
            ) : null}
          </>
        )
      ) : (
        // ─────────── Search ───────────
        <>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: colors.textSecondary }}>
            Choose the area or neighbourhood where you usually work. We place you on the map at its centre.
            <input
              type="search"
              value={query}
              placeholder="Search area or neighbourhood"
              aria-label="Search area or neighbourhood"
              autoComplete="off"
              onChange={(e) => {
                setQuery(e.target.value);
                setNotice(null);
                setDone(null);
                runSearch(e.target.value, 300);
              }}
              style={{ padding: '0.6rem 0.8rem', borderRadius: 10, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgInput, color: colors.textPrimary, fontSize: 14 }}
            />
          </label>

          {notice ? <div role="alert" style={{ ...note, color: colors.statusError }}>{notice}</div> : null}

          {searchState === 'loading' ? (
            <p style={{ margin: 0, fontSize: 13, color: colors.textTertiary }}>Searching…</p>
          ) : searchState === 'error' ? (
            // eslint-disable-next-line react-hooks/refs -- the retry handler runs on click, after render
            inlineError("Area search is unavailable right now.", () => runSearch(query, 0))
          ) : searchState === 'done' && results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '0.75rem', fontSize: 13, color: colors.textSecondary }}>
              <div style={{ fontWeight: 600, color: colors.textPrimary }}>{`No areas match "${query.trim()}"`}</div>
              <div>Try a nearby neighbourhood or district.</div>
            </div>
          ) : results.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, overflow: 'hidden' }}>
              {results.map((r, i) => (
                <li key={r.placeId} style={{ borderTop: i ? `1px solid ${colors.borderPrimary}` : 0 }}>
                  <button
                    type="button"
                    aria-label={`${r.name}, ${r.secondary}`}
                    onClick={() => void choose(r)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.65rem 0.9rem', border: 0, backgroundColor: 'transparent', cursor: 'pointer' }}
                  >
                    <span style={{ display: 'block', fontWeight: 600, color: colors.textPrimary }}>{r.name}</span>
                    {r.secondary ? <span style={{ display: 'block', fontSize: 12, color: colors.textSecondary }}>{r.secondary}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div style={{ ...note, backgroundColor: 'transparent', padding: 0 }}>
            <span>Areas only, no street addresses. Only areas in countries Connekyt supports are listed.</span>
          </div>
        </>
      )}
    </section>
  );
}
