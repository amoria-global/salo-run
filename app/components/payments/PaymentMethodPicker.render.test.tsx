import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Op = { id: string; name: string; iconKey: string };
let options: { operators: Op[]; supportsCard: boolean; currency: string } | null = null;
let supported = false;

vi.mock('@/lib/payments/usePaymentOptions', () => ({
  usePaymentOptions: () => ({ options, supported, loading: false, error: null }),
}));
vi.mock('./CountryPicker', () => ({ CountryPicker: () => <div data-testid="country-picker" /> }));
vi.mock('./PaymentMethodChooser', () => ({
  PaymentMethodChooser: (p: { methods: { id: string; name: string }[]; onSelect: (id: string) => void }) => (
    <div>{p.methods.map((m) => <button key={m.id} data-testid={`method-${m.id}`} onClick={() => p.onSelect(m.id)}>{m.name}</button>)}</div>
  ),
}));

import { PaymentMethodPicker } from './PaymentMethodPicker';

/**
 * The shared dashboard picker over a FAKE options lookup, once per market.
 * Cards stay in every market; mobile money only where the backend returned operators.
 */
let container: HTMLDivElement;
let root: Root;
const onSelect = vi.fn();

const ids = () =>
  Array.from(container.querySelectorAll('[data-testid^="method-"]')).map((b) => b.getAttribute('data-testid'));

async function render(country: string | null, allowCard = true) {
  await act(async () => {
    root.render(
      <PaymentMethodPicker country={country} onCountryChange={vi.fn()} selectedMethodId={null}
        onSelect={onSelect} allowCard={allowCard} />,
    );
  });
}

beforeEach(() => {
  options = null;
  supported = false;
  onSelect.mockReset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe('dashboard payment method picker by country', () => {
  it('Rwanda: backend operators and the card', async () => {
    options = {
      operators: [{ id: 'MTN', name: 'MTN Mobile Money', iconKey: 'mtn' }, { id: 'AIRTEL', name: 'Airtel Money', iconKey: 'airtel' }],
      supportsCard: true,
      currency: 'RWF',
    };
    supported = true;
    await render('RW');
    expect(ids()).toEqual(['method-mtn', 'method-airtel', 'method-card']);
  });

  it('United States: the card stays, no mobile money, and the card selects as a card', async () => {
    await render('US');
    expect(ids()).toEqual(['method-card']);
    await act(async () => { (container.querySelector('[data-testid="method-card"]') as HTMLElement).click(); });
    expect(onSelect).toHaveBeenCalledWith({ methodId: 'card', type: 'CARD', operator: null });
  });

  it('unknown country: the card stays and no operator is assumed', async () => {
    await render(null);
    expect(ids()).toEqual(['method-card']);
  });

  it('payout-style callers that turn the card off see no card', async () => {
    await render('US', false);
    expect(ids()).toEqual([]);
  });
});
