import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { bgSecondary: '#fff', bgTertiary: '#eee', textPrimary: '#000', textSecondary: '#444', borderPrimary: '#ccc' } }),
}));

import EventCoverageChoice from './EventCoverageChoice';
import type { EventCoverage } from '@/lib/events/selfStream';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const colors = { textPrimary: '#000', textSecondary: '#444', borderPrimary: '#ccc', bgTertiary: '#eee', bgSecondary: '#fff' };
const currencies = [{ code: 'RWF', name: 'Rwandan franc' }, { code: 'USD', name: 'US Dollar' }];

function Harness({ showFee, onPick }: { showFee: boolean; onPick?: (v: EventCoverage) => void }) {
  const [v, setV] = useState<EventCoverage>('PUBLIC');
  const [fee, setFee] = useState('');
  const [cur, setCur] = useState('RWF');
  return <EventCoverageChoice value={v} onChange={(x) => { setV(x); onPick?.(x); }} colors={colors} showFee={showFee} fee={fee} onFee={setFee} currencyCode={cur} onCurrency={setCur} currencies={currencies} />;
}

let root: Root;
let host: HTMLDivElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const button = (label: string) => [...host.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLButtonElement;

describe('EventCoverageChoice', () => {
  it('starts on a photographer, and the fee is not asked for', () => {
    act(() => root.render(<Harness showFee />));
    expect(button('A photographer').getAttribute('aria-pressed')).toBe('true');
    expect(button('I stream it myself').getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('input')).toBeNull();
    expect(host.textContent).toContain('A photographer covers your event');
  });

  it('streaming it yourself asks for the live stream fee and its currency', () => {
    const picked = vi.fn();
    act(() => root.render(<Harness showFee onPick={picked} />));
    act(() => button('I stream it myself').click());
    expect(picked).toHaveBeenCalledWith('PRIVATE');
    expect(host.querySelector('input')).not.toBeNull();
    expect(host.textContent).toContain('Live stream fee');
    expect(host.textContent).toContain('at least 100');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('/flags/rw.svg');
  });

  it('the coordinator form passes showFee false: the choice shows, the fee is its own section', () => {
    act(() => root.render(<Harness showFee={false} />));
    act(() => button('I stream it myself').click());
    expect(host.querySelector('input')).toBeNull();
    expect(host.textContent).toContain('go live yourself');
  });
});
