import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokenFromInput } from '../../lib/collabLink';

/**
 * The organization Team gave every account type a way to invite
 * sub-accounts into its own dashboard with permissions over it. It was
 * replaced by album collaboration, which is for photographers only: an
 * album owner invites fellow photographers with a link, they submit photos,
 * and the owner approves or rejects each one.
 *
 * Reading the source pins this without rendering pages that need a live
 * session, the same approach as WithdrawModal.contract.test.ts.
 */

const ROOT = path.resolve(__dirname, '../../..');

function code(file: string): string {
  return readFileSync(path.join(ROOT, file), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const SIDEBAR = code('app/components/sidebar.tsx');

function navFor(role: string): string {
  const start = SIDEBAR.indexOf(`${role}: [`);
  return SIDEBAR.slice(start, SIDEBAR.indexOf('],', start));
}

describe('the Team is gone', () => {
  it('has no Team entry and no Team pages', () => {
    expect(SIDEBAR).not.toMatch(/name: "Team"/);
    expect(SIDEBAR).not.toMatch(/\/user\/team/);
    expect(existsSync(path.join(ROOT, 'app/user/team'))).toBe(false);
    expect(existsSync(path.join(ROOT, 'app/lib/APIs/team.ts'))).toBe(false);
  });
});

describe('Collaborate is for photographers only', () => {
  it('appears in the photographer navigation', () => {
    expect(navFor('photographer')).toMatch(/name: "Collaborate", href: "\/user\/photographer\/collaborate"/);
  });

  it('does not appear for clients or coordinators', () => {
    expect(navFor('client')).not.toMatch(/Collaborate/);
    expect(navFor('"event-coordinator"')).not.toMatch(/Collaborate/);
  });

  it('lives under /user/photographer, behind the photographer layout gate', () => {
    for (const route of ['collaborate', 'collaborate/albums/[id]', 'collaborate/joined/[id]', 'collaborate/join/[token]']) {
      expect(existsSync(path.join(ROOT, 'app/user/photographer', route, 'page.tsx'))).toBe(true);
    }
  });
});

describe('the workflow', () => {
  const API = code('app/lib/APIs/collab.ts');
  const JOINED = code('app/pages/photographer/collaborate/JoinedAlbum.tsx');
  const OWNER = code('app/pages/photographer/collaborate/OwnerAlbum.tsx');

  it('treats action 0 as a failure even on HTTP 200', () => {
    expect(API).toMatch(/!res\.ok \|\| body\.action === 0/);
  });

  it('collaborators submit for review and never write to the album directly', () => {
    expect(JOINED).toMatch(/submitPhoto\(albumId/);
    expect(JOINED).not.toMatch(/photographer\/albums\//);
    expect(API).toMatch(/\/joined\/\$\{albumId\}\/submissions/);
  });

  it('choosing photos only stages them; nothing uploads until the collaborator presses Submit', () => {
    const addFiles = JOINED.slice(JOINED.indexOf('const addFiles'), JOINED.indexOf('const removeStaged'));
    expect(addFiles.length).toBeGreaterThan(0);
    expect(addFiles).not.toMatch(/submitPhoto/);
    expect(addFiles).toMatch(/state: 'staged'/);
    expect(JOINED).toMatch(/onClick=\{submitStaged\}/);
  });

  it('one link admits any number of photographers, and cancelling it is separate from removing someone', () => {
    const PARTS = code('app/components/collab/parts.tsx');
    expect(PARTS).toMatch(/Send it to as many photographers as you like/);
    expect(API).toMatch(/\/links\/\$\{inviteId\}/);
    expect(API).toMatch(/\/members\/\$\{membershipId\}/);
    expect(OWNER).toMatch(/cancelInvite\(inv\.id\)/);
    expect(OWNER).toMatch(/removeCollaborator\(removing\.membershipId\)/);
  });

  it('the owner approves or rejects, with an optional note on rejection', () => {
    expect(OWNER).toMatch(/decide\(Array\.from\(selected\), 'APPROVE'\)/);
    expect(OWNER).toMatch(/decide\(rejecting, 'REJECT', note\)/);
  });
});

describe('invite links', () => {
  it('accepts a full link or a bare code', () => {
    expect(tokenFromInput('https://dashboard.connekyt.com/user/photographer/collaborate/join/Ab_c-12')).toBe('Ab_c-12');
    expect(tokenFromInput('  Ab_c-12  ')).toBe('Ab_c-12');
    expect(tokenFromInput('https://dashboard.connekyt.com/user/photographer/collaborate/join/Ab_c-12?x=1')).toBe('Ab_c-12');
  });
});
