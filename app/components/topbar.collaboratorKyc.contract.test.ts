import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** A workspace collaborator has no identity check of its own, so the top bar never asks it to verify. */
// The top bar's logic lives in topbarState.ts (shared with the Compact Glass bar), its markup in topbar.tsx.
const SOURCE = ['topbar.tsx', 'topbarState.ts']
  .map((f) => readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n'))
  .join('\n');

describe('KYC banner and workspace collaborators', () => {
  it('reads the collaborator flag from the workspace provider', () => {
    expect(SOURCE).toContain('const { isCollaborator } = useWorkspace();');
  });

  it('does not draw the verify-your-identity banner for a collaborator', () => {
    expect(SOURCE).toContain("user.customerType !== 'Viewer' && !isCollaborator && !pendingPaymentWarning");
  });
});
