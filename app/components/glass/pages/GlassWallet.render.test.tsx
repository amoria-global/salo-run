import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/app/context/ThemeContext', () => ({ useTheme: () => ({ colors: {}, actualTheme: 'dark' }) }));
vi.mock('@/app/components/WalletPanel', () => ({ default: ({ title }: { title: string }) => <div data-stub="panel">{title}</div> }));
vi.mock('@/app/components/WalletMovementsTable', () => ({ default: () => <div data-stub="movements" /> }));
vi.mock('@/app/components/WithdrawModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-stub="withdraw" /> : null) }));
const allow = { value: true };
vi.mock('@/app/lib/usePermissions', () => ({ Can: ({ children }: { children: React.ReactNode }) => (allow.value ? <>{children}</> : null) }));

import GlassWallet from './GlassWallet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
const base = { role: 'client' as const, wallet: { id: 'w1' } as never, loading: false, error: null, reload: vi.fn(), subtitle: 'Your payments', panelTitle: 'My spending' };
const render = async (p: Partial<typeof base> & { shared?: boolean } = {}) => { await act(async () => { root.render(<GlassWallet {...base} {...p} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };

beforeEach(() => { allow.value = true; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassWallet', () => {
  it('loading, then an error with a retry that reloads', async () => {
    await render({ loading: true, wallet: null });
    expect(host.querySelector('[aria-busy=true]')).toBeTruthy();
    const reload = vi.fn();
    await render({ wallet: null, error: 'Failed to load wallet', reload });
    await click(button(/Try again|Retry/));
    expect(reload).toHaveBeenCalled();
  });

  it('balance and activity; Withdraw opens the dialog only with payments.manage', async () => {
    await render();
    expect(host.querySelector('[data-stub=panel]')?.textContent).toBe('My spending');
    expect(host.querySelector('[data-stub=movements]')).toBeTruthy();
    await click(button(/^Withdraw funds$/));
    expect(host.querySelector('[data-stub=withdraw]')).toBeTruthy();
    allow.value = false;
    await render();
    expect(button(/^Withdraw funds$/)).toBeFalsy();
  });

  it('in a shared workspace: no Withdraw, no history, a note instead', async () => {
    await render({ role: 'photographer' as never, shared: true });
    expect(button(/^Withdraw funds$/)).toBeFalsy();
    expect(host.querySelector('[data-stub=movements]')).toBeFalsy();
    expect(host.textContent).toContain('stay with the workspace owner');
  });
});
