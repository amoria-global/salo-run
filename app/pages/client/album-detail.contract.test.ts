import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The client's album page.
 *
 * It used to offer "Archive Album" / "Unarchive Album", which called PUT and DELETE on
 * /api/remote/customer/albums/archives. The backend has no such endpoint: the path matched
 * PUT /{albumId} with the id "archives" and failed, and the page ignored the failure, so the button did nothing and said
 * nothing. Albums are archived by the system (locked when their year runs out), not by the owner. Delete also swallowed
 * failures. `isArchived` now means locked only; the event's completion is `isCompleted`.
 *
 * Reading the source checks this without a signed-in session against a live backend.
 */

const SOURCE = readFileSync(path.join(__dirname, 'album-detail.tsx'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('client album page', () => {
  it('has no Archive or Unarchive button and never calls the missing archives endpoint', () => {
    expect(SOURCE).not.toContain('albums/archives');
    expect(SOURCE).not.toMatch(/Archive Album|Unarchive Album/);
    expect(SOURCE).not.toMatch(/handleArchive|handleUnarchive/);
  });

  it('shows the reason when deleting fails instead of failing silently', () => {
    expect(SOURCE).toContain('setActionError(');
    expect(SOURCE).toMatch(/body\?\.action !== 0/);
    expect(SOURCE).toMatch(/role="alert"/);
  });

  it('reads isCompleted for the event and uses isLocked for the archived state', () => {
    expect(SOURCE).toContain('isCompleted: Boolean(data.isCompleted)');
    expect(SOURCE).toContain("album.isLocked ? 'Archived' : 'Unlocked'");
    expect(SOURCE).not.toContain("album.isArchived ? 'Yes' : 'No'");
  });
});
