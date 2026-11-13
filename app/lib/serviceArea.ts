/**
 * Service area: the area or neighbourhood a photographer works in, shown to clients as an approximate position on the map.
 * Same contract as the mobile app (`features/serviceArea/api.ts`).
 *
 * Only the id of the chosen place is ever sent when saving. The server looks the area up itself and stores its centre, so a
 * position is never sent from here (and any that was sent would be ignored). Search, the confirm step and the saved area all come
 * from our own backend, which holds the Google key.
 */
import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';

export type AreaSuggestion = { placeId: string; name: string; secondary: string };

export type AreaDetails = {
  placeId: string;
  name: string;
  context: string;
  country: string | null;
  /** False for a street or a business: the picker only takes areas and neighbourhoods. */
  isArea: boolean;
  /** False for a country Connekyt does not support yet. */
  supported: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type ServiceArea = {
  set: boolean;
  name: string | null;
  context: string | null;
  country: string | null;
  setAt: string | null;
  latitude: number | null;
  longitude: number | null;
};

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** What a failed call looks like to the panel: a message it can show, and whether trying again can help. */
export class ServiceAreaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function readEnvelope(res: Response): Promise<{ data: Record<string, unknown> | undefined; raw: Record<string, unknown> }> {
  let raw: Record<string, unknown> = {};
  try {
    raw = (await res.json()) as Record<string, unknown>;
  } catch {
    raw = {};
  }
  // The backend answers some failures with HTTP 200 and action 0, so both the status and the action decide.
  if (!res.ok || raw.action !== 1) {
    const message = str(raw.message) || (res.status >= 500 ? 'The service is temporarily unavailable. Please try again shortly.' : 'Something went wrong. Please try again.');
    throw new ServiceAreaError(message, res.status || 0);
  }
  return { data: raw.data as Record<string, unknown> | undefined, raw };
}

export function parsePredictions(raw: unknown): AreaSuggestion[] {
  const list = Array.isArray((raw as { predictions?: unknown } | undefined)?.predictions)
    ? ((raw as { predictions: Record<string, unknown>[] }).predictions)
    : [];
  const seen = new Set<string>();
  const out: AreaSuggestion[] = [];
  for (const p of list) {
    const placeId = str(p?.placeId);
    const description = str(p?.description);
    const name = str(p?.mainText) || description.split(',')[0].trim();
    if (!placeId || !name || seen.has(placeId)) continue;
    seen.add(placeId);
    out.push({ placeId, name, secondary: str(p?.secondaryText) || description.split(',').slice(1).join(',').trim() });
  }
  return out;
}

export function parseDetails(placeId: string, d: Record<string, unknown> | undefined): AreaDetails {
  const x = d ?? {};
  return {
    placeId: str(x.placeId) || placeId,
    name: str(x.name),
    context: str(x.context),
    country: str(x.country) || null,
    isArea: x.isArea === true,
    supported: x.supported === true,
    latitude: num(x.latitude),
    longitude: num(x.longitude),
  };
}

export function parseArea(d: Record<string, unknown> | undefined): ServiceArea {
  const x = d ?? {};
  return {
    set: x.set === true,
    name: str(x.name) || null,
    context: str(x.context) || null,
    country: str(x.country) || null,
    setAt: str(x.setAt) || null,
    latitude: num(x.latitude),
    longitude: num(x.longitude),
  };
}

/** Areas and neighbourhoods matching what is being typed, in the countries Connekyt supports. Throws when search is unavailable. */
export async function searchAreas(query: string, signal?: AbortSignal): Promise<AreaSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`${getApiUrl()}/api/remote/public/places/areas?input=${encodeURIComponent(q)}`, { signal });
  const { data } = await readEnvelope(res);
  return parsePredictions(data);
}

/** The chosen area, with its centre for the preview. Nothing is saved yet. */
export async function getAreaDetails(placeId: string): Promise<AreaDetails> {
  const res = await fetch(`${getApiUrl()}/api/remote/public/places/area?placeId=${encodeURIComponent(placeId)}`);
  const { data } = await readEnvelope(res);
  return parseDetails(placeId, data);
}

export async function getServiceArea(): Promise<ServiceArea> {
  const { data } = await readEnvelope(await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/service-area`));
  return parseArea(data);
}

/** Saves the area. Only the place id is sent: the server looks the centre up itself. */
export async function saveServiceArea(placeId: string): Promise<ServiceArea> {
  const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/service-area`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeId }),
  });
  return parseArea((await readEnvelope(res)).data);
}

/** Takes the photographer off the map straight away. */
export async function removeServiceArea(): Promise<ServiceArea> {
  const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/service-area`, { method: 'DELETE' });
  return parseArea((await readEnvelope(res)).data);
}
