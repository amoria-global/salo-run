import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { bgSecondary: '#fff', bgTertiary: '#eee', textPrimary: '#000', textSecondary: '#444', borderPrimary: '#ccc' } }),
}));

import CurrencySelect from './CurrencySelect';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = [
  { value: 'id-rwf', code: 'RWF', name: 'Rwandan franc' },
  { value: 'id-usd', code: 'USD', name: 'US Dollar' },
];

function Harness({ onPick }: { onPick: (v: string) => void }) {
  const [v, setV] = useState('');
  return <CurrencySelect value={v} onChange={(x) => { setV(x); onPick(x); }} options={options} />;
}

let root: Root;
let host: HTMLDivElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('CurrencySelect', () => {
  it('lists every currency with its flag, and picking one shows its flag on the button', () => {
    const picked = vi.fn();
    act(() => root.render(<Harness onPick={picked} />));
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.querySelector('img')).toBeNull();
    act(() => button.click());
    const rows = [...host.querySelectorAll('[role=option]')];
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.querySelector('img')?.getAttribute('src'))).toEqual(['/flags/rw.svg', '/flags/us.svg']);
    act(() => (rows[1] as HTMLElement).click());
    expect(picked).toHaveBeenCalledWith('id-usd');
    expect(host.querySelector('[role=listbox]')).toBeNull();
    expect(button.querySelector('img')?.getAttribute('src')).toBe('/flags/us.svg');
    expect(button.textContent).toContain('USD');
  });
});
