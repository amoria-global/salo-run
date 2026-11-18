import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      bgCard: '#fff', bgInput: '#fff', bgModal: '#fff', textPrimary: '#000', textSecondary: '#444', textTertiary: '#666', textInverse: '#fff',
      borderPrimary: '#ccc', brandPrimary: '#083A85', statusError: '#dc2626', statusInfoBg: '#eef',
    },
  }),
}));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: vi.fn() }));
vi.mock('@/lib/donationApi', () => ({ getCurrencies: vi.fn().mockResolvedValue({ success: true, data: [] }) }));
// The money box is the kit's; here a plain input stands in for it.
vi.mock('./MoneyInput', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="price-input" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import LocationRulesField, { useLocationRules } from './LocationRulesField';
import { ruleKey, type LocationRule } from '@/lib/geoRules';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LOCATIONS = [
  { scopeType: 'COUNTRY', code: 'KE', name: 'Kenya', continentName: 'Africa' },
  { scopeType: 'COUNTRY', code: 'FR', name: 'France', continentName: 'Europe' },
  { scopeType: 'CONTINENT', code: 'EU', name: 'Europe', countryCount: 51 },
];
const fetchMock = vi.fn();
const CURRENCIES = [{ value: 'rwf', code: 'RWF', name: 'Rwandan franc' }];

const priced: LocationRule = { key: ruleKey('COUNTRY', 'KE'), id: 'a', scopeType: 'COUNTRY', scopeValue: 'KE', label: 'Kenya', action: 'PRICE', price: 150, currencyId: 'rwf', currencyCode: 'RWF' };

let latest: { payload: () => unknown } = { payload: () => [] };

function Harness({ rules = [], open = true, allowBlock = true }: { rules?: LocationRule[]; open?: boolean; allowBlock?: boolean }) {
  const geo = useLocationRules({ initiallyOpen: open });
  const [seeded, setSeeded] = useState(false);
  if (!seeded) {
    setSeeded(true);
    geo.hydrate(rules);
  }
  // A test probe: hands the hook value to the test body (not app code).
  // eslint-disable-next-line react-hooks/globals
  latest = { payload: geo.payload };
  return <LocationRulesField geo={geo} currencies={CURRENCIES} defaultCurrencyId="rwf" allowBlock={allowBlock} />;
}

let root: Root;
let host: HTMLDivElement;

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};
const mount = async (el: React.ReactElement) => {
  await act(async () => {
    root.render(el);
  });
  await flush();
};
const byText = (tag: string, text: string) => Array.from(host.querySelectorAll(tag)).find((n) => n.textContent?.trim() === text) as HTMLElement | undefined;
const click = async (el: Element | undefined) => {
  if (!el) throw new Error('nothing to click');
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};
const type = async (el: HTMLInputElement, value: string) => {
  await act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

beforeEach(() => {
  fetchMock.mockResolvedValue({ json: async () => ({ action: 1, data: { countries: LOCATIONS.filter((l) => l.scopeType === 'COUNTRY'), continents: LOCATIONS.filter((l) => l.scopeType === 'CONTINENT') } }) });
  vi.stubGlobal('fetch', fetchMock);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe('LocationRulesField', () => {
  it('collapsed it is one row with the summary and nothing else', async () => {
    await mount(<Harness open={false} rules={[priced]} />);
    expect(host.textContent).toContain('Location pricing & access (optional)');
    expect(host.textContent).toContain('1 price');
    expect(host.textContent).not.toContain('Add a location rule');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens on tap, loads the places once, and lists the rules', async () => {
    await mount(<Harness open={false} rules={[priced]} />);
    await click(host.querySelector('[data-testid="geo-rules-header"]')!);
    await flush();
    expect(host.textContent).toContain('Kenya');
    expect(host.textContent).toContain('RWF 150');
    expect(host.textContent).toContain('+ Add a location rule');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('adds a price rule inline and puts it in the payload', async () => {
    await mount(<Harness />);
    await click(host.querySelector('[data-testid="geo-rules-new"]')!);
    await click(host.querySelector('[aria-label="France, country"]')!);
    await type(host.querySelector('[data-testid="price-input"]') as HTMLInputElement, '3000');
    await click(host.querySelector('[data-testid="geo-rules-add"]')!);
    expect(latest.payload()).toEqual([{ scopeType: 'COUNTRY', scopeValue: 'FR', action: 'PRICE', price: 3000, currencyId: 'rwf' }]);
    expect(host.textContent).toContain('1 price');
  });

  it('blocks a continent with no price', async () => {
    await mount(<Harness />);
    await click(host.querySelector('[data-testid="geo-rules-new"]')!);
    await click(host.querySelector('[aria-label="Europe, continent"]')!);
    await click(byText('button', 'Block'));
    expect(host.textContent).toMatch(/will not be able to watch, buy, send gifts or donate/);
    await click(byText('button', 'Block place'));
    expect(latest.payload()).toEqual([{ scopeType: 'CONTINENT', scopeValue: 'EU', action: 'BLOCK' }]);
    expect(host.textContent).toContain('Blocked');
  });

  it('will not add with no place chosen, and says why', async () => {
    await mount(<Harness />);
    await click(host.querySelector('[data-testid="geo-rules-new"]')!);
    await click(host.querySelector('[data-testid="geo-rules-add"]')!);
    expect(host.textContent).toContain('Choose a country or continent first.');
    expect(latest.payload()).toEqual([]);
  });

  it('removes a rule', async () => {
    await mount(<Harness rules={[priced]} />);
    await click(host.querySelector('[aria-label="Remove Kenya"]')!);
    expect(latest.payload()).toEqual([]);
    expect(host.textContent).toContain('No location rules yet.');
  });

  it('a package takes prices only: no Price or Block switch', async () => {
    await mount(<Harness allowBlock={false} />);
    await click(host.querySelector('[data-testid="geo-rules-new"]')!);
    expect(host.querySelector('[role="group"][aria-label="Rule type"]')).toBeNull();
    expect(host.textContent).not.toMatch(/keep a place from watching/);
  });

  it('says so when the list of places will not load, with a retry', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await mount(<Harness />);
    await click(host.querySelector('[data-testid="geo-rules-new"]')!);
    await flush();
    expect(host.textContent).toContain('We could not load the list of places.');
    expect(byText('button', 'Retry')).toBeTruthy();
  });
});
