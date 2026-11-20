import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      bgCard: '#fff', bgInput: '#fff', textPrimary: '#000', textSecondary: '#444', textTertiary: '#666', textInverse: '#fff',
      borderPrimary: '#ccc', brandPrimary: '#083A85', statusError: '#dc2626', statusInfoBg: '#eef',
    },
  }),
}));
vi.mock('@/app/lib/serviceArea');

import ServiceAreaPanel from './ServiceAreaPanel';
import * as api from '@/app/lib/serviceArea';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const m = vi.mocked(api);
const NOT_SET: api.ServiceArea = { set: false, name: null, context: null, country: null, setAt: null, latitude: null, longitude: null };
const SAVED: api.ServiceArea = { set: true, name: 'Gishushu', context: 'Gasabo, Kigali', country: 'RW', setAt: '2026-11-13T10:00:00', latitude: -1.954, longitude: 30.091 };
const GISHUSHU: api.AreaDetails = { placeId: 'a1', name: 'Gishushu', context: 'Gasabo, Kigali', country: 'RW', isArea: true, supported: true, latitude: -1.954, longitude: 30.091 };
const RESULTS: api.AreaSuggestion[] = [
  { placeId: 'a1', name: 'Gishushu', secondary: 'Kigali, Rwanda' },
  { placeId: 'a2', name: 'Gisozi', secondary: 'Gasabo, Kigali' },
];

let host: HTMLDivElement;
let root: Root;

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};
const mount = async () => {
  await act(async () => {
    root.render(<ServiceAreaPanel />);
  });
  await flush();
};
const text = () => host.textContent ?? '';
const button = (label: RegExp | string) =>
  Array.from(host.querySelectorAll('button')).find((b) => (typeof label === 'string' ? b.textContent === label || b.getAttribute('aria-label') === label : label.test(b.textContent ?? '') || label.test(b.getAttribute('aria-label') ?? ''))) as HTMLButtonElement;
const click = async (label: RegExp | string) => {
  const b = button(label);
  expect(b, `button ${String(label)}`).toBeDefined();
  await act(async () => {
    b.click();
  });
  await flush();
};
const type = async (value: string) => {
  const input = host.querySelector('input') as HTMLInputElement;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
  await flush();
};

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  m.getServiceArea.mockResolvedValue(NOT_SET);
  m.searchAreas.mockResolvedValue(RESULTS);
  m.getAreaDetails.mockResolvedValue(GISHUSHU);
  m.saveServiceArea.mockResolvedValue(SAVED);
  m.removeServiceArea.mockResolvedValue(NOT_SET);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('service area panel', () => {
  it('says the photographer is not on the map and offers a search', async () => {
    await mount();
    expect(text()).toContain("Not set · you're not on the map");
    expect(host.querySelector('input')).not.toBeNull();
    expect(text()).toContain('Areas only, no street addresses');
  });

  it('lists matching areas with where they are', async () => {
    await mount();
    await type('Gis');
    expect(m.searchAreas).toHaveBeenCalledWith('Gis', expect.anything());
    expect(text()).toContain('Gishushu');
    expect(text()).toContain('Kigali, Rwanda');
    expect(text()).toContain('Gisozi');
  });

  it('does not search for one letter', async () => {
    await mount();
    await type('G');
    expect(m.searchAreas).not.toHaveBeenCalled();
  });

  it('has a no-results state with a way forward', async () => {
    m.searchAreas.mockResolvedValue([]);
    await mount();
    await type('Gisxx');
    expect(text()).toContain('No areas match "Gisxx"');
    expect(text()).toContain('Try a nearby neighbourhood or district.');
  });

  it('shows an error with "Try again" when search fails, not "no results"', async () => {
    m.searchAreas.mockRejectedValueOnce(new Error('down'));
    await mount();
    await type('Gis');
    expect(text()).toContain('Area search is unavailable right now.');
    expect(text()).not.toContain('No areas match');
    await click('Try again');
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    await flush();
    expect(text()).toContain('Gishushu');
  });

  it('confirms the chosen area with the privacy note and no map when tiles are unavailable', async () => {
    await mount();
    await type('Gis');
    await click(/^Gishushu, Kigali, Rwanda$/);
    expect(m.getAreaDetails).toHaveBeenCalledWith('a1');
    expect(text()).toContain('Gishushu');
    expect(text()).toContain('Gasabo, Kigali');
    expect(text()).toContain('Clients see this approximate area and a rounded distance. Your address is never shown.');
    expect(host.querySelector('[data-testid="area-preview"]')).toBeNull();
    expect(text()).not.toMatch(/could not|error/i);
  });

  it('saves with only the place id and says so', async () => {
    await mount();
    await type('Gis');
    await click(/^Gishushu, Kigali, Rwanda$/);
    await click('Save service area');
    expect(m.saveServiceArea).toHaveBeenCalledWith('a1');
    expect(text()).toContain("You're on the map in Gishushu");
    expect(text()).toContain('Remove my area');
  });

  it('shows an inline error with "Try again" when saving fails, and the choice stays', async () => {
    m.saveServiceArea.mockRejectedValueOnce(new Error('The service is temporarily unavailable. Please try again shortly.'));
    await mount();
    await type('Gis');
    await click(/^Gishushu, Kigali, Rwanda$/);
    await click('Save service area');
    expect(text()).toContain('temporarily unavailable');
    expect(text()).toContain('Gishushu');
    await click('Try again');
    expect(m.saveServiceArea).toHaveBeenCalledTimes(2);
    expect(text()).toContain("You're on the map in Gishushu");
  });

  it('refuses a street or a business, and a country Connekyt does not support, without saving', async () => {
    m.getAreaDetails.mockResolvedValueOnce({ ...GISHUSHU, isArea: false });
    await mount();
    await type('Gis');
    await click(/^Gishushu, Kigali, Rwanda$/);
    expect(text()).toContain('Choose an area or neighbourhood, not a street address.');

    m.getAreaDetails.mockResolvedValueOnce({ ...GISHUSHU, supported: false });
    await click(/^Gishushu, Kigali, Rwanda$/);
    expect(text()).toContain('Connekyt is not available in that country yet.');
    expect(m.saveServiceArea).not.toHaveBeenCalled();
  });

  it('shows an error with "Try again" when the area cannot be checked', async () => {
    m.getAreaDetails.mockRejectedValueOnce(new Error('down'));
    await mount();
    await type('Gis');
    await click(/^Gishushu, Kigali, Rwanda$/);
    expect(text()).toContain('We could not check that area right now.');
    await click('Try again');
    expect(text()).toContain('Clients see this approximate area');
  });

  it('shows an error with "Try again" when the saved area cannot be read, rather than claiming "not set"', async () => {
    m.getServiceArea.mockRejectedValueOnce(new Error('down'));
    await mount();
    expect(text()).toContain('We could not load your service area.');
    expect(text()).not.toContain("you're not on the map");
    await click('Try again');
    expect(text()).toContain("Not set · you're not on the map");
  });

  describe('an area already saved', () => {
    beforeEach(() => m.getServiceArea.mockResolvedValue(SAVED));

    it('opens on the saved area with Change and "Remove my area"', async () => {
      await mount();
      expect(text()).toContain('Gishushu');
      expect(text()).toContain('Gasabo, Kigali');
      expect(text()).toContain('Remove my area');
      expect(text()).toContain('Removing takes you off the map straight away.');
    });

    it('removes the area at once and says so', async () => {
      await mount();
      await click('Remove my area');
      expect(m.removeServiceArea).toHaveBeenCalledTimes(1);
      expect(text()).toContain("You're off the map");
      expect(text()).toContain("Not set · you're not on the map");
    });

    it('"Change" goes back to the search', async () => {
      await mount();
      await click('Change');
      expect(text()).toContain('Choose the area or neighbourhood where you usually work.');
    });
  });
});
