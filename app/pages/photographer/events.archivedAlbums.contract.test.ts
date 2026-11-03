import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A photographer's archived standalone album is marked in the album list and can be restored from it. The list reads
 * isLocked and lockedAt (the backend's album summary now sends them), a click on the badge opens the restore flow without
 * opening the album, and a finished payment reloads the list. Reading the source checks this without a signed-in session.
 */
const SOURCE = readFileSync(path.join(__dirname, 'events.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('photographer albums: archived', () => {
  it('reads the archived state from the album summary', () => {
    expect(SOURCE).toContain('isLocked: a.isLocked === true');
    expect(SOURCE).toContain('lockedAt: a.lockedAt || null');
  });

  it('marks archived albums in both the grid and the list, without opening the album', () => {
    const badges = SOURCE.split('Archived · Restore').length - 1;
    expect(badges).toBe(2);
    expect(SOURCE.split('e.stopPropagation(); setRestoreAlbum(album);').length - 1).toBe(2);
  });

  it('runs the confirm-then-pay flow and reloads the albums when it finishes', () => {
    expect(SOURCE).toContain('<StandaloneAlbumRestore');
    expect(SOURCE).toContain('setAlbumsReload((n) => n + 1)');
    expect(SOURCE).toMatch(/\}, \[user\?\.id, apiUrl, albumsReload\]\);/);
  });
});
