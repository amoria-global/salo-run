import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The photographer Home carries the same entries as the mobile Home: Sell photos (which opens the album form preset to
 * a PAID album on the Events page), and the Go live / My hosted events tiles. Reading the source checks this without a
 * signed-in session, as the archived-albums contract does.
 */
const SOURCE = readFileSync(path.join(__dirname, 'dashboard.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('photographer Home: mobile parity', () => {
  it('has a Sell photos button that opens the sell preset, and no Create event button', () => {
    expect(SOURCE).toContain('/user/photographer/events?${SELL_PHOTOS_QUERY}');
    expect(SOURCE).toContain('Sell photos');
    expect(SOURCE).not.toContain('Create event');
  });

  it('shows the Go live and My hosted events tiles when the server lets this account host', () => {
    expect(SOURCE).toContain('{canHost && !isShared ? <HostEntryTiles caption={hostedCaption} /> : null}');
  });

  it('offers Sell photos only to accounts that may create', () => {
    expect(SOURCE).toContain("hasPermission('events.create') && !isShared");
  });
});
