import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Where a tap on an album notification goes.
 *
 * The backend sends the ALBUM's id as the reference of an album notification (archived, expiring, face index). The bell
 * used to send a client to the albums list and a photographer to /events/<that id>, an event route that has no event
 * with an album's id. It now opens the album itself.
 */
// The top bar's logic lives in topbarState.ts (shared with the Compact Glass bar), its markup in topbar.tsx.
const SOURCE = ['topbar.tsx', 'topbarState.ts']
  .map((f) => readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n'))
  .join('\n');

describe('album notification routing', () => {
  it('opens the album for a client', () => {
    expect(SOURCE).toContain("case 'album': dest = refId ? `/user/client/gallery/albums/${refId}` : '/user/client/gallery'; break;");
  });

  it('opens the album for a coordinator', () => {
    expect(SOURCE).toContain("case 'album': dest = refId ? `/user/event-coordinator/gallery/albums/${refId}` : '/user/event-coordinator/gallery'; break;");
  });

  it('does not send a photographer to an event route with an album id', () => {
    const handler = SOURCE.slice(SOURCE.indexOf('const handleNotificationClick'));
    const photographer = handler.slice(handler.indexOf("if (userRole === 'photographer') {"), handler.indexOf("} else if (userRole === 'event-coordinator')"));
    expect(photographer).not.toMatch(/case 'album': case 'media'/);
    expect(photographer).toContain('/user/photographer/collaborate/albums/${refId}');
  });
});
