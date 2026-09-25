import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Customers may turn 2FA off even with a balance, and doing so pauses
 * withdrawals. The backend refuses initiate and verify with
 * `twoFactorRequired: true`. The dashboard must say so plainly: the disable
 * step warns before it happens, the withdraw modal shows a "turn on 2FA"
 * panel instead of the form, and nothing forces a redirect to setup.
 *
 * Reading the source checks this without rendering modals that need a live
 * session, the same approach as WithdrawModal.contract.test.ts.
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
const PREFS = code(path.join(ROOT, 'app/pages/preferences.tsx'));
const AUTH = code(path.join(ROOT, 'app/providers/AuthProvider.tsx'));

describe('disabling 2FA', () => {
  it('is never blocked by a wallet balance in the UI', () => {
    expect(PREFS).not.toMatch(/disabled=\{totpRequired\}/);
    expect(PREFS).not.toMatch(/Cannot disable while your account has a balance/);
  });

  it('warns that withdrawals stop before the code is entered', () => {
    const confirm = PREFS.slice(PREFS.indexOf('{showDisableConfirm && ('));
    const warning = confirm.indexOf('Disabling 2FA will disable withdrawals');
    const codeEntry = confirm.indexOf('Enter a code from your authenticator app to disable 2FA');
    expect(warning).toBeGreaterThan(-1);
    expect(codeEntry).toBeGreaterThan(warning);
  });

  it('no longer forces funded accounts back to the setup screen', () => {
    expect(AUTH).not.toMatch(/setup2fa=true/);
  });
});

describe('WithdrawModal without 2FA', () => {
  it('checks 2FA status when opened and gates the form on it', () => {
    expect(MODAL).toMatch(/\/api\/remote\/customer\/totp\/status/);
    expect(MODAL).toMatch(/step === 'form' && twoFactorOn === true/);
    expect(MODAL).toMatch(/step === 'form' && twoFactorOn === false/);
  });

  it('offers a way to turn 2FA on', () => {
    expect(MODAL).toMatch(/preferences\?tab=security&setup2fa=true/);
    expect(MODAL).toMatch(/Turn on 2FA/);
  });

  it('switches to that panel when the server refuses initiate or verify', () => {
    const hits = MODAL.match(/result\.action === 0 && result\.twoFactorRequired\) \{\s*setTwoFactorOn\(false\)/g) ?? [];
    expect(hits).toHaveLength(2);
  });
});
