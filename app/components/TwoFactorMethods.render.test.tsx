import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.mock('../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

import TwoFactorMethods from './TwoFactorMethods';

/**
 * The security card over a fake server. The fake says what the real one would (status, send, verify);
 * the card must show those answers and must never decide whether a code is right.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const theme = { colors: { textPrimary: '#000', textSecondary: '#555', borderPrimary: '#ccc', bgTertiary: '#eee' }, dark: false };
const json = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
const status = (o: Record<string, unknown> = {}) => ({
  action: 1, twoFactorEnabled: true, twoFactorRequired: false, totpEnabled: true, emailEnabled: false, maskedEmail: 'jo•••@mail.com', ...o,
});
const sent = (resendIn = 180) => ({
  action: 1,
  data: {
    maskedEmail: 'jo•••@mail.com',
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    resendAvailableAt: new Date(Date.now() + resendIn * 1000).toISOString(),
    serverTime: new Date().toISOString(),
  },
});

let routes: Record<string, () => unknown>;
let host: HTMLDivElement;
let root: Root;
const onStatus = vi.fn();

beforeEach(() => {
  routes = { '2fa/status': () => status() };
  fetchMock.mockImplementation((url: string) => {
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    return json(key ? routes[key]() : { action: 0, message: 'no route' });
  });
  onStatus.mockReset();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  fetchMock.mockReset();
});

async function mount() {
  await act(async () => {
    root.render(<TwoFactorMethods theme={theme} onStatus={onStatus} />);
  });
}
const buttons = () => Array.from(host.querySelectorAll('button'));
const click = async (label: string, nth = 0) => {
  const b = buttons().filter((x) => x.textContent?.includes(label))[nth];
  expect(b, `button "${label}"`).toBeTruthy();
  await act(async () => {
    b.click();
  });
};
const field = () => host.querySelector('input[autocomplete="one-time-code"]') as HTMLInputElement;
async function type(value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setter.call(field(), value);
    field().dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('methods list', () => {
  it('shows each method with its state and tells the page what the account has', async () => {
    await mount();
    expect(host.textContent).toContain('Authenticator app');
    expect(host.textContent).toContain('Email code');
    expect(host.textContent).toContain('A code sent to jo•••@mail.com');
    expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, totpEnabled: true, emailEnabled: false }));
  });

  it('warns a funded account without 2FA that withdrawals need it', async () => {
    routes['2fa/status'] = () => status({ twoFactorEnabled: false, twoFactorRequired: true, totpEnabled: false });
    await mount();
    expect(host.textContent).toContain('Your wallet has funds');
  });
});

describe('email method setup', () => {
  it('sends a code, names the address and holds Resend until the server timer ends', async () => {
    routes['2fa/email/send'] = () => sent(180);
    await mount();
    await click('Set up'); // the Email code row is the second Set up (authenticator is on)
    expect(host.textContent).toContain('We sent a 6-digit code to jo•••@mail.com');
    expect(host.textContent).toContain('Resend code in 3:00');
    expect(buttons().find((b) => b.textContent?.startsWith('Resend code in'))?.disabled).toBe(true);
  });

  it('a rate limit shows the server wait', async () => {
    routes['2fa/email/send'] = () => ({ action: 0, errorCode: 'RATE_LIMITED', retryAfterSeconds: 480, message: 'Too many codes. Try again later.' });
    await mount();
    await click('Set up');
    expect(host.textContent).toContain('Too many codes. Try again later.');
    expect(host.textContent).toContain('Resend code in 8:00');
  });

  it('a wrong code clears the field and shows the attempts the server says are left', async () => {
    routes['2fa/email/send'] = () => sent();
    routes['2fa/email/enable'] = () => ({ action: 0, errorCode: 'WRONG_CODE', attemptsLeft: 2, message: 'That code is not right.' });
    await mount();
    await click('Set up');
    await type('000000');
    expect(field().value).toBe('');
    expect(host.textContent).toContain('That code is not right.');
    expect(host.textContent).toContain('2 attempts left');
  });

  it('a lock shows the remaining time and stops input', async () => {
    routes['2fa/email/send'] = () => sent();
    routes['2fa/email/enable'] = () => ({ action: 0, errorCode: 'LOCKED', retryAfterSeconds: 900, message: 'Locked' });
    await mount();
    await click('Set up');
    await type('000000');
    expect(host.textContent).toContain('Try again in 15:00');
    expect(field().disabled).toBe(true);
  });

  it('the right code turns the method on and refreshes the status', async () => {
    routes['2fa/email/send'] = () => sent();
    routes['2fa/email/enable'] = () => ({ action: 1 });
    await mount();
    await click('Set up');
    routes['2fa/status'] = () => status({ emailEnabled: true });
    await type('123456');
    expect(onStatus).toHaveBeenLastCalledWith(expect.objectContaining({ emailEnabled: true }));
    expect(host.textContent).toContain('Two-factor authentication is on.');
  });
});

describe('turning a method off', () => {
  it('warns that withdrawals stop when it is the only method', async () => {
    routes['2fa/email/send'] = () => sent();
    await mount();
    await click('Turn off');
    expect(host.textContent).toContain('Turning this off will disable withdrawals');
  });

  it('gives no warning while another method stays on', async () => {
    routes['2fa/status'] = () => status({ emailEnabled: true });
    routes['2fa/email/send'] = () => sent();
    await mount();
    await click('Turn off', 0); // authenticator
    expect(host.textContent).not.toContain('Turning this off will disable withdrawals');
  });
});
