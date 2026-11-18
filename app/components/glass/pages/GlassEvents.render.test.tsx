import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/app/components/HostEntryTiles', () => ({ default: () => null }));
vi.mock('@/app/pages/photographer/ContentAlbumsTab', () => ({ default: () => <div data-stub="content" /> }));
vi.mock('./GlassOpportunities', () => ({ default: () => <div data-stub="opps" /> }));
vi.mock('@/app/components/events/EventsBrowser', () => ({
  EventsToolbar: () => <div data-stub="toolbar" />, EventsCalendar: () => null, EmptyResult: () => <div>empty-result</div>,
  GroupedEvents: ({ groups, renderRow }: { groups: { items: unknown[] }[]; renderRow: (i: unknown, s: string) => React.ReactNode }) => <div>{groups.flatMap((g) => g.items.map((i) => renderRow(i, 'upcoming')))}</div>,
  EventRowShell: ({ title, actions, onOpen }: { title: string; actions: React.ReactNode; onOpen: () => void }) => <div className="row"><button type="button" onClick={onOpen}>{title}</button>{actions}</div>,
}));

import GlassEvents from './GlassEvents';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const album = (over: Record<string, unknown>) => ({ id: 'a1', title: 'Ben & Raya', eventTitle: 'Ben & Raya Wedding', clientName: 'Raya', photoCount: 12, views: 3, shared: false, sharedWithClient: false, isStandalone: false, isLocked: false, faceRecognitionEnabled: false, inviteCode: '', coverImage: '', ...over });
const ev = { id: 'e1', title: 'Corporate · Jalia', date: '2026-12-01', startTime: '10:00', location: { address: 'Jalia Hall', city: 'Kigali' }, status: 'upcoming', bookingStatus: 'PENDING', isPublished: true, hasLiveStream: false };

function ctl(over: Record<string, unknown> = {}) {
  const fn = () => vi.fn();
  const albums = [album({}), album({ id: 'a2', title: 'Sent one', sharedWithClient: true, shared: true }), album({ id: 'a3', title: 'Locked one', isLocked: true })];
  return {
    activeTab: 'events', setActiveTab: fn(), canCreateEvents: true, canHost: false, hostedCaption: '', getStarted: { show: fn() },
    handleSellPhotos: fn(), setShowNewPhotobook: fn(), handleOpenCreateAlbum: fn(),
    eventCounts: {}, eventFilter: 'all', setEventFilter: fn(), eventDate: null, setEventDate: fn(), setEventsLayout: fn(), eventsLayout: 'list',
    eventSearch: '', setEventSearch: fn(), eventItems: [], calMode: 'month', setCalMode: fn(), events: [ev], visibleItems: [{}], emptyHelp: {},
    groupedItems: [{ items: [{ src: ev, eventDate: ev.date }] }], formatTime: (x: string) => x,
    setSelectedEvent: fn(), setShowEventDetailModal: fn(), openBookingAction: fn(), setQrEvent: fn(), setShowUnpublishedModal: fn(), setShowStreamPreview: fn(),
    canCreateAlbumForEvent: () => true, eventHasAlbum: () => ({ exists: false, sent: false }), setMarkCompleteTarget: fn(), canDismissEvent: () => false,
    setEventToDismiss: fn(), setShowDismissEventModal: fn(),
    albums, filteredAlbums: albums, albumFilter: 'all', setAlbumFilter: fn(), albumSearch: '', setAlbumSearch: fn(), albumViewMode: 'grid', setAlbumViewMode: fn(),
    buildAlbumLink: () => null, cardLinkCopiedId: null, setCardLinkCopiedId: fn(), copyToClipboard: fn(),
    canEditAlbum: () => true, getEditDaysRemaining: () => 5, handleOpenEdit: fn(), setAlbumToDelete: fn(), setShowDeleteConfirm: fn(), canDismissAlbum: () => true,
    setAlbumToDismiss: fn(), setShowDismissAlbumModal: fn(), setSelectedAlbum: fn(), setShowSendModal: fn(), handleOpenFaceAI: fn(), setRestoreAlbum: fn(),
    setViewerAlbum: fn(), setCurrentImageIndex: fn(), setShowAlbumBrowseModal: fn(),
    receivedPhotobooks: [], photobookSearch: '', setPhotobookSearch: fn(), nowMs: Date.now(), openPhotobookBrowse: fn(), setPhotobookToResubmit: fn(), downloadAllImages: fn(),
    setPhotobookToDelete: fn(), setShowDeletePhotobookModal: fn(), contentCreateSignal: 0, currencies: [], paidAlbumCurrencyId: '',
    ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: ReturnType<typeof ctl>) => { await act(async () => { root.render(<GlassEvents ctl={c as never} modals={<div data-stub="modals" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassEvents', () => {
  it('always renders the shared modals; a pending booking offers Accept and Decline', async () => {
    const c = ctl();
    await render(c);
    expect(document.querySelector('[data-stub=modals]')).toBeTruthy();
    await click(button(/^Accept$/));
    expect(c.openBookingAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), 'accept');
    await click(button(/^Sell photos$/));
    expect(c.handleSellPhotos).toHaveBeenCalled();
  });

  it('albums: Send before sharing, a Sent chip after, Restore when archived; Delete only before sending (via the menu)', async () => {
    const c = ctl({ activeTab: 'albums' });
    await render(c);
    const text = document.body.textContent || '';
    expect(text).toContain('Sent');
    await click(button(/^Send$/));
    expect(c.setShowSendModal).toHaveBeenCalledWith(true);
    await click(button(/^Restore$/));
    expect(c.setRestoreAlbum).toHaveBeenCalled();
    await click(button(/More options for Ben & Raya/));
    await click(button(/Delete album/));
    expect(c.setShowDeleteConfirm).toHaveBeenCalledWith(true);
    await click(button(/More options for Sent one/));
    expect(button(/Delete album/)).toBeUndefined();
    expect(button(/Dismiss album/)).toBeTruthy();
  });

  it('section switch, the Albums primary action and the photobooks empty state', async () => {
    const c = ctl({ activeTab: 'photobooks' });
    await render(c);
    expect(document.body.textContent).toContain('No photobooks yet');
    await click(button(/^Albums$/));
    expect(c.setActiveTab).toHaveBeenCalledWith('albums');
  });
});
