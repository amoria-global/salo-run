import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The payment sheet needs the whole dashboard (auth, currency, profile). Its own behaviour is not under test here.
vi.mock('./UnlockModal', () => ({
  default: ({ payment }: { payment: { eventType: string; eventId?: string; amountNum: number } }) => (
    <div data-testid="pay">{`pay ${payment.eventType} ${payment.eventId} ${payment.amountNum}`}</div>
  ),
}));

import ArchiveRestoreFlow, { type ArchivedAlbum } from './ArchiveRestoreFlow';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const colors = { bgCard: '#fff', borderPrimary: '#ccc', textPrimary: '#000', textSecondary: '#444' };
const album: ArchivedAlbum = {
  id: 'a1',
  title: 'Wedding',
  eventId: 'e1',
  photographer: 'Ada',
  lockedAt: '2026-10-30T10:00:00',
  archiveFee: 5000,
  archiveCurrency: 'RWF',
};

let root: Root;
let host: HTMLDivElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const button = (text: string) => [...document.body.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(text)) as HTMLButtonElement | undefined;

describe('ArchiveRestoreFlow', () => {
  it('confirms first, with the archive date, the price and the year of access, and charges nothing yet', () => {
    act(() => root.render(<ArchiveRestoreFlow album={album} colors={colors} actualTheme="light" onClose={() => {}} onRestored={() => {}} />));
    const text = document.body.textContent ?? '';
    expect(text).toContain('Restore this album?');
    expect(text).toContain('This album was archived on 30 October 2026. Restore it for RWF 5,000 to view and download again.');
    expect(text).toContain('You will pay RWF 5,000, and you will have access to the album again for 1 year.');
    expect(text).not.toMatch(/cold storage/i);
    expect(document.body.querySelector('[data-testid="pay"]')).toBeNull();
    expect(button('Restore for RWF 5,000')).toBeTruthy();
  });

  it('opens the archive payment for the album\'s event only after the owner confirms', () => {
    act(() => root.render(<ArchiveRestoreFlow album={album} colors={colors} actualTheme="light" onClose={() => {}} onRestored={() => {}} />));
    act(() => button('Restore for RWF 5,000')!.click());
    expect(document.body.querySelector('[data-testid="pay"]')?.textContent).toBe('pay Archive Unlock e1 5000');
  });

  it('can be dismissed without paying', () => {
    const onClose = vi.fn();
    act(() => root.render(<ArchiveRestoreFlow album={album} colors={colors} actualTheme="light" onClose={onClose} onRestored={() => {}} />));
    act(() => button('Not now')!.click());
    expect(onClose).toHaveBeenCalled();
    expect(document.body.querySelector('[data-testid="pay"]')).toBeNull();
  });

  it('says so, and offers no payment, when the album has no event to pay against', () => {
    act(() => root.render(<ArchiveRestoreFlow album={{ ...album, eventId: null }} colors={colors} actualTheme="light" onClose={() => {}} onRestored={() => {}} />));
    expect(document.body.textContent).toContain('cannot be restored online right now');
    expect(button('Restore for')).toBeUndefined();
  });
});
