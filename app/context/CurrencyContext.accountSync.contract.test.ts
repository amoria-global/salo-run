import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The selected currency is kept on the account so the dashboard and the mobile
 * app show the same one. The account's value wins on sign-in; a browser that
 * has a choice the account lacks saves it; picking a currency saves it.
 *
 * Reading the source checks this without a live session, the same approach as
 * WithdrawModal.twoFactor.contract.test.ts.
 */

const SRC = readFileSync(path.join(__dirname, 'CurrencyContext.tsx'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('currency preference sync', () => {
  it('uses the shared account endpoint the mobile app also uses', () => {
    expect(SRC).toContain('"/api/remote/customer/profile/display-currency"');
  });

  it('reads the account value only when signed in, and checks action rather than the HTTP status', () => {
    expect(SRC).toMatch(/if \(!isAuthenticated\) return;/);
    expect(SRC).toContain('result?.action !== 1');
  });

  it('saves a user pick to the account', () => {
    expect(SRC).toMatch(/if \(isAuthenticated\) saveToAccount\(code\);/);
    expect(SRC).toContain('method: "PUT"');
  });
});
