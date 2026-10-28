import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ actualTheme: 'light', colors: { bgCard: '#fff', bgSecondary: '#eee', textPrimary: '#000', textSecondary: '#444', borderPrimary: '#ccc', brandAccent: '#F20C8F' } }),
}));

import { HostWishInvitesRow } from './HostWishInvitesRow';
import { WishInvitesField } from './WishInvitesField';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const ok = () => ({ ok: true, status: 200, json: async () => ({ action: 1, data: {} }) }) as Response;
const button = () => host.querySelector('button') as HTMLButtonElement;

describe('HostWishInvitesRow', () => {
  it('shows the current state and turns it off and on again, while live, with one PUT each', async () => {
    const fetcher = vi.fn(async () => ok());
    act(() => root.render(<HostWishInvitesRow eventId="e1" initial={true} fetcher={fetcher} />));
    expect(host.textContent).toContain('Wish invites: On');
    await act(async () => button().click());
    expect(host.textContent).toContain('Wish invites: Off');
    expect(fetcher).toHaveBeenLastCalledWith('https://api.test/api/remote/customer/events/e1/wish-invites', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ allowWishInvites: false }) }));
    await act(async () => button().click());
    expect(host.textContent).toContain('Wish invites: On');
    expect(fetcher).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ allowWishInvites: true }) }));
  });

  it('treats an older server with no value as on, and puts the state back when the change is refused', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ action: 0, message: 'Not yours' }) }) as Response);
    act(() => root.render(<HostWishInvitesRow eventId="e1" fetcher={fetcher} />));
    expect(host.textContent).toContain('Wish invites: On');
    await act(async () => button().click());
    expect(host.textContent).toContain('Wish invites: On');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Not yours');
  });
});

describe('WishInvitesField (dashboard)', () => {
  it('has nothing selected on a new event, shows the saved value when editing, and links its error', () => {
    act(() => root.render(<WishInvitesField value={null} onChange={() => {}} error="Choose whether viewers can invite others" />));
    const radios = [...host.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    expect(radios.some((r) => r.checked)).toBe(false);
    expect(host.querySelector('fieldset')?.getAttribute('aria-describedby')).toBe(host.querySelector('[role="alert"]')?.id);
    act(() => root.render(<WishInvitesField value={false} onChange={() => {}} />));
    expect(([...host.querySelectorAll('input[type="radio"]')] as HTMLInputElement[]).map((r) => r.checked)).toEqual([false, true]);
  });
});
