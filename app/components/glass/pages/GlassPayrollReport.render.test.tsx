import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));

import GlassPayrollReport from './GlassPayrollReport';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const data = { period: 'Nov 2026', generatedDate: 'Nov 19, 2026', initial: 0, pending: 20, paid: 40, total: 60, transactions: [{ id: 1, date: 'Nov 18', description: 'Kigali Gala', type: 'Service Payment', amount: 60, status: 'Paid' }] };
const ctl = (over: Record<string, unknown> = {}) => ({ formatPrice: (n: number) => `USD ${n.toFixed(2)}`, user: null, reportRef: { current: null }, payrollData: data, loading: false, loadError: false, handlePrint: vi.fn(), handleDownloadPDF: vi.fn(), ...over });

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown) => { await act(async () => { root.render(<GlassPayrollReport ctl={c as never} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()));

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassPayrollReport', () => {
  it('prints the report area with totals and rows', async () => {
    const c = ctl();
    await render(c);
    expect(host.querySelector('#printable-report')).toBeTruthy();
    expect(host.textContent).toContain('USD 60.00');
    expect(host.textContent).toContain('Period: Nov 2026');
    await act(async () => { button(/^Print report$/)!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(c.handleDownloadPDF).toHaveBeenCalled();
  });

  it('a failed load is an error, never a $0 report, and Print is off', async () => {
    await render(ctl({ loadError: true }));
    expect(host.querySelector('#printable-report')).toBeFalsy();
    expect(host.textContent).not.toContain('USD 0.00');
    expect((button(/^Print report$/) as HTMLButtonElement).disabled).toBe(true);
  });
});
