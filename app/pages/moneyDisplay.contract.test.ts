import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/**
 * 2026-10-11 financial audit, P1-J: dashboard screens showed invented or wrong
 * money. The photographer report was a hardcoded sample, the client report kept
 * that sample whenever /stats failed, coordinator Paid totals were always 0
 * because statuses never matched, stream revenue fell back to gross
 * booking-currency rows summed as USD, and gift earnings assumed a 65% share.
 */

vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: vi.fn() }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

const ROOT = path.resolve(__dirname, '../..');
const code = (file: string) => readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');

describe('dashboard money display', () => {
    it('never ships a hardcoded sample report', () => {
        for (const f of ['app/pages/photographer/transaction.tsx', 'app/pages/client/payments.tsx']) {
            const src = code(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
            expect(src, f).not.toContain('13 - 18 July 2025');
            expect(src, f).not.toContain('1200.13');
            expect(src, f).not.toContain('350.13');
        }
        expect(code('app/pages/photographer/transaction.tsx'))
            .toContain('available={totalCompleted} pending={totalPending} withdrawn={totalWithdrawn} transactions={transactions}');
    });

    it('client stats accept only action 1 and failed money is not part of the total', () => {
        const src = code('app/pages/client/payments.tsx');
        expect(src.match(/result\.action === 1 \? result\.data : null/g)?.length).toBeGreaterThanOrEqual(2);
        expect(src).not.toContain('reportData.pending + reportData.failed');
    });

    it('maps coordinator statuses onto the values the totals compare against', async () => {
        const { mapCoordinatorStatus } = await import('./event-coordinator/payments');
        expect(mapCoordinatorStatus('COMPLETED')).toBe('paid');
        expect(mapCoordinatorStatus('PARTIAL')).toBe('partially_paid');
        expect(mapCoordinatorStatus('PENDING')).toBe('pending');
        expect(mapCoordinatorStatus('FAILED')).toBe('failed');
        expect(mapCoordinatorStatus(undefined)).toBe('pending');
    });

    it('coordinator revenue comes from the backend, never a client-side guess', () => {
        const src = code('app/pages/event-coordinator/payments.tsx');
        expect(src).not.toMatch(/\* 0\.65/);
        expect(src).not.toContain('if (!result?.totalStreamingRevenue)');
        expect(src).toContain('netAmount: Number(p.withdrawableAmountInUsd ?? 0)');
        expect(src).toContain("if (!result || result.action !== 1) {");
        expect(src).toContain('{paymentsError} The totals below may be incomplete.');
    });

    it('a failed read is shown as a failure, never as $0', () => {
        expect(code('app/pages/photographer/transaction.tsx')).toContain('.catch(() => setWalletError(true))');
        expect(code('app/pages/photographer/payroll-report.tsx')).toContain('{loadError && !loading && (');
        expect(code('app/pages/photographer/dashboard.tsx'))
            .toContain("value={analyticsFailed ? 'Unavailable' : formatPrice(analytics?.totalEarnings || 0)}");
    });

    it('an unrated photographer is New, not an invented 5.0', () => {
        for (const f of ['app/components/RebookWizard.tsx', 'app/pages/client/photographers.tsx', 'app/pages/photographer/profile.tsx']) {
            const src = code(f);
            expect(src, f).not.toMatch(/rating \?\? 5\)|rating \|\| 5\b|\|\| '5\.0'/);
        }
    });
});
