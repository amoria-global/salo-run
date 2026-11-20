import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A workspace collaborator opening the owner's Home used to be sent to /profile (the check read the collaborator's
 * own review status) and then bounced by the shared-workspace guard. In a shared workspace both Homes skip that
 * redirect: the collaborator works in the owner's context.
 */
const read = (f: string) => readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n');

describe('Home inside a shared workspace', () => {
  it('the old Home does not redirect a collaborator to the profile page', () => {
    const src = read('dashboard.tsx');
    expect(src).toContain("if (!isShared && user && user.profileReviewStatus?.toUpperCase() !== 'ACCEPTED') {");
    expect(src).toContain('}, [user, router, isShared]);');
  });

  it('the glass Home applies the same rule', () => {
    const src = read('../../components/glass/home/GlassHome.tsx');
    expect(src).toContain("if (!isShared && user && user.profileReviewStatus?.toUpperCase() !== 'ACCEPTED') router.replace");
  });
});
