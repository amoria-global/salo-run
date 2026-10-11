import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * docs/PAYMENTS.md rule 2: never offer a retry after a charge may have landed.
 *
 * The client and coordinator booking-payment modals sent every poll outcome to
 * one "Payment Failed" screen with a Try Again button. A five-minute timeout or
 * a status-check error, where the buyer's money may already have left, was
 * shown as a failure with a retry that opens a second collection on the same
 * phone, and the decline text promised an automatic refund that no code path
 * performs. Card payments were also declared failed on the early FAILED a
 * fresh card session reports while the buyer is still on the gateway page.
 */

const mockFetch = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

const ROOT = path.resolve(__dirname, '../..');
const PAGES = [
  'app/pages/client/payments.tsx',
  'app/pages/event-coordinator/payments.tsx',
  'app/components/UnlockModal.tsx',
];

function code(file: string): string {
  return readFileSync(path.join(ROOT, file), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe.each(PAGES)('%s payment failure outcome', (file) => {
  const src = code(file);

  it('defaults to unknown and enters the failed step only through failPayment', () => {
    expect(src).toMatch(/useState<'declined' \| 'unknown'>\('unknown'\)/);
    expect(src.match(/setXentriPayStep\('failed'\)/g)).toHaveLength(1);
  });

  it('treats a poll timeout or status error as unknown, a gateway FAILED as declined', () => {
    expect(src).toMatch(/onFailure: \(\) => failPayment\('declined'/);
    expect(src).toMatch(/onError: \(\) => failPayment\('unknown'/);
    expect(src).toMatch(/catch \{\s*failPayment\('unknown'/);
  });

  it('offers no retry on the unknown screen and promises no automatic refund', () => {
    const start = src.indexOf("if (xentriPayStep === 'failed' && xentriPayFailure === 'unknown')");
    const end = src.indexOf("if (xentriPayStep === 'failed')", start + 1);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(src.slice(start, end)).not.toContain('handleRetryPayment');
    expect(src).not.toMatch(/refunded automatically/);
  });

  it('gives card payments the grace window', () => {
    expect(src).toMatch(/selectedPaymentMethod === 'card' \? 180_000 : 0/);
  });
});

describe('PendingMilestonePaymentModal payment failure outcome', () => {
  const src = code('app/components/PendingMilestonePaymentModal.tsx');

  it('sends timeouts, status errors and dropped connections to unconfirmed', () => {
    expect(src).toMatch(/onError: \(\) => \{ setStep\('unconfirmed'\)/);
    expect(src).toMatch(/catch \{\s*setStep\('unconfirmed'\)/);
  });

  it('keeps Try again off the unconfirmed footer and promises no refund', () => {
    const start = src.indexOf("if (step === 'unconfirmed')");
    const end = src.indexOf("if (step === 'failed')", start);
    expect(start).toBeGreaterThan(-1);
    expect(src.slice(start, end)).not.toMatch(/Try again/i);
    expect(src).not.toMatch(/refunded automatically/);
  });

  it('gives card payments the grace window', () => {
    expect(src).toMatch(/selectedMethod === 'card' \? 180_000 : 0/);
  });
});

describe('no dashboard source promises an automatic refund', () => {
  it('appears nowhere under app/ or lib/', async () => {
    const { execSync } = await import('node:child_process');
    const hits = execSync('git grep -l "refunded automatically" -- app lib', { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter((f) => f && !f.endsWith('.test.ts'));
    expect(hits).toEqual([]);
  });
});

describe('pollPaymentStatus card grace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ json: async () => ({ action: 1, data: { refid: 'r', status: 'FAILED' } }) });
  });
  afterEach(() => vi.useRealTimers());

  it('does not report an early FAILED inside the grace window', async () => {
    const { pollPaymentStatus } = await import('@/lib/xentripay');
    const cb = { onSuccess: vi.fn(), onFailure: vi.fn(), onError: vi.fn() };
    const stop = pollPaymentStatus('r', cb, 2000, 150, 180_000);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(cb.onFailure).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(125_000);
    expect(cb.onFailure).toHaveBeenCalledTimes(1);
    stop();
  });

  it('reports FAILED at once when there is no grace (mobile money)', async () => {
    const { pollPaymentStatus } = await import('@/lib/xentripay');
    const cb = { onSuccess: vi.fn(), onFailure: vi.fn(), onError: vi.fn() };
    pollPaymentStatus('r', cb);
    await vi.advanceTimersByTimeAsync(2_100);
    expect(cb.onFailure).toHaveBeenCalledTimes(1);
  });

  it('reports a pending timeout through onError, never onFailure', async () => {
    mockFetch.mockResolvedValue({ json: async () => ({ action: 1, data: { refid: 'r', status: 'PENDING' } }) });
    const { pollPaymentStatus } = await import('@/lib/xentripay');
    const cb = { onSuccess: vi.fn(), onFailure: vi.fn(), onError: vi.fn() };
    pollPaymentStatus('r', cb, 2000, 3);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(cb.onError).toHaveBeenCalledTimes(1);
    expect(cb.onFailure).not.toHaveBeenCalled();
  });
});
