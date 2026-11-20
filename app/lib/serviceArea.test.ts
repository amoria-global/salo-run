import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
const authFetch = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => authFetch(...a) }));

import { getAreaDetails, getServiceArea, parsePredictions, removeServiceArea, saveServiceArea, searchAreas, ServiceAreaError } from './serviceArea';

const fetchMock = vi.fn();
const reply = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('service area api (dashboard)', () => {
  it('does not search for fewer than two letters', async () => {
    expect(await searchAreas('G')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks our own area search with the text encoded', async () => {
    fetchMock.mockResolvedValue(reply({ action: 1, data: { predictions: [] } }));
    await searchAreas('Gis hushu&x=1');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/remote/public/places/areas?input=Gis%20hushu%26x%3D1');
  });

  it('keeps names and parents, drops duplicates and entries with no id or name', () => {
    expect(
      parsePredictions({
        predictions: [
          { placeId: 'a1', mainText: 'Gishushu', secondaryText: 'Kigali, Rwanda' },
          { placeId: 'a1', mainText: 'Gishushu' },
          { placeId: 'a2', description: 'Gisozi, Gasabo, Kigali' },
          { mainText: 'No id' },
        ],
      }),
    ).toEqual([
      { placeId: 'a1', name: 'Gishushu', secondary: 'Kigali, Rwanda' },
      { placeId: 'a2', name: 'Gisozi', secondary: 'Gasabo, Kigali' },
    ]);
  });

  it('treats a failed search as an error, never as "no results"', async () => {
    fetchMock.mockResolvedValue(reply({ action: 0, message: 'Location search is unavailable right now.' }, 503));
    await expect(searchAreas('Gis')).rejects.toBeInstanceOf(ServiceAreaError);
  });

  it('treats action 0 as a failure even on HTTP 200', async () => {
    authFetch.mockResolvedValue(reply({ action: 0, message: 'Choose an area or neighbourhood, not a street address.' }, 200));
    await expect(saveServiceArea('a1')).rejects.toThrow('Choose an area or neighbourhood');
  });

  it('reads an area as not allowed unless the server says so', async () => {
    fetchMock.mockResolvedValue(reply({ action: 1, data: { name: 'Somewhere' } }));
    const d = await getAreaDetails('x');
    expect(d.isArea).toBe(false);
    expect(d.supported).toBe(false);
    expect(d.latitude).toBeNull();
  });

  it('sends ONLY the place id when saving: no coordinates, no name', async () => {
    authFetch.mockResolvedValue(reply({ action: 1, data: { set: true, name: 'Gishushu', context: 'Gasabo, Kigali', country: 'RW', latitude: -1.954, longitude: 30.091 } }));
    const a = await saveServiceArea('a1');
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe('https://api.test/api/remote/photographer/service-area');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ placeId: 'a1' });
    expect(Object.keys(JSON.parse(init.body))).toEqual(['placeId']);
    expect(a).toMatchObject({ set: true, name: 'Gishushu' });
  });

  it('removes through DELETE and reads back "not set"', async () => {
    authFetch.mockResolvedValue(reply({ action: 1, data: { set: false } }));
    const a = await removeServiceArea();
    expect(authFetch.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
    expect(a.set).toBe(false);
  });

  it('reads the saved area', async () => {
    authFetch.mockResolvedValue(reply({ action: 1, data: { set: true, name: 'Gishushu', latitude: -1.954, longitude: 30.091 } }));
    expect(await getServiceArea()).toMatchObject({ set: true, name: 'Gishushu', latitude: -1.954 });
  });
});
