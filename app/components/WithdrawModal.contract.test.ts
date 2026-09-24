import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The withdraw modal must end at "submitted" once verification succeeds.
 *
 * A verified withdrawal is created as PENDING_APPROVAL: the funds are held,
 * finance is emailed, and an admin's approval fires the payout
 * (AdminWithdrawalApprovalApiController). The modal used to follow a
 * successful verify with a POST to the XentriPay process route, which refuses
 * any transaction that is not PENDING. So every successful request was shown
 * as "Withdrawal failed", with a "Try again" that started a second withdrawal
 * on top of the held one.
 *
 * Reading the source checks this without rendering a modal that needs a
 * camera, an OTP and a live verification.
 */

const ROOT = path.resolve(__dirname, '../..');

/** Source with CRLF normalized and comments removed, so only code is matched. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const MODAL = code(path.join(__dirname, 'WithdrawModal.tsx'));
const XENTRIPAY = code(path.join(ROOT, 'lib/xentripay.ts'));

/** The body of handleVerify, from its declaration to the next handler. */
function handleVerify(): string {
  const start = MODAL.indexOf('const handleVerify = async');
  const end = MODAL.indexOf('const handleResendOtp', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return MODAL.slice(start, end);
}

describe('WithdrawModal after a successful verification', () => {
  it('never calls the payout endpoint from the client', () => {
    expect(MODAL).not.toMatch(/xentripay\/process/);
    expect(MODAL).not.toMatch(/processWithdrawal\(/);
    expect(XENTRIPAY).not.toMatch(/xentripay\/process/);
  });

  it('goes straight to the success step once verify answers action 1', () => {
    const body = handleVerify();
    const failureBranch = body.indexOf('if (result.action === 0)');
    expect(failureBranch).toBeGreaterThan(-1);
    const rest = body.slice(failureBranch);
    // Everything after the failure branch's closing `return; }` is the success path.
    const successPart = rest.slice(rest.search(/return;\s*\}/));
    expect(successPart).toMatch(/setStep\('success'\)/);
    expect(successPart).not.toMatch(/setStep\('failed'\)/);
  });

  it('tells the user the request is reviewed before payout', () => {
    expect(MODAL).toMatch(/reviews each withdrawal before it is paid out/);
  });
});
