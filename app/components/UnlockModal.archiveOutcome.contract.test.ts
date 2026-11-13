import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Restoring an archived album: when the server says the payment prompt may already be on the phone (AMBIGUOUS) or an
 * earlier attempt is still open (IN_PROGRESS), the modal shows the "not confirmed yet" view with no Retry button. A plain
 * refusal (wrong operator, a gateway that said no) is still a normal failure the owner can retry at once.
 */
const SOURCE = readFileSync(path.join(__dirname, 'UnlockModal.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('UnlockModal: archive payment outcomes', () => {
  it('maps an ambiguous or still-open attempt to the not-confirmed view, not a decline', () => {
    expect(SOURCE).toContain("failPayment(result.ambiguous ? 'unknown' : 'declined'");
  });

  it('the not-confirmed view offers no retry and tells the owner not to pay again', () => {
    const view = SOURCE.slice(SOURCE.indexOf("xentriPayFailure === 'unknown'"), SOURCE.indexOf('// XentriPay Failed View'));
    expect(view).toContain("please don&apos;t pay again yet");
    expect(view).not.toContain('handleRetryPayment');
  });

  it('a decline keeps its retry', () => {
    const view = SOURCE.slice(SOURCE.indexOf('// XentriPay Failed View'));
    expect(view).toContain('handleRetryPayment');
  });
});
