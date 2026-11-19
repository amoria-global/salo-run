import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/lib/events/ownerGoLive', () => ({ canOwnerGoLive: (e: { status: string }) => e.status === 'PUBLISHED' }));

import GlassMyEvents from './GlassMyEvents';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const base = { id: 'e1', title: 'Kigali Gala', status: 'UPCOMING', eventType: 'Gala', category: 'Corporate', date: '2026-12-01', time: '18:00', location: { city: 'Kigali', country: 'Rwanda' }, guestCount: 10, maxGuests: 200, hasPhotographer: true, photographerName: 'QA Photographer', photographerId: 'p1', bookingMode: 'DIRECT', isPublished: false, coverImage: 'x.jpg', bookingStatus: 'ACCEPTED' };
function ctl(events: Record<string, unknown>[], over: Record<string, unknown> = {}) {
  const fn = () => vi.fn();
  return {
    activeTab: 'all', setActiveTab: fn(), events, filteredEvents: events, upcomingCount: 1, publishedCount: 0, completedCount: 0, pastCount: 0,
    searchQuery: '', setSearchQuery: fn(), isLoadingEvents: false, eventsError: null, fetchMyEvents: fn(), getStarted: { show: fn() }, setShowBookingModeSelector: fn(),
    formatDate: (d: string) => d, setShowEventDetails: fn(), setGoLiveEvent: fn(), setRebookEvent: fn(), openPostWizard: fn(), convertingHybridId: null,
    setCandidateModalEvent: fn(), setQrEvent: fn(), unpublishingEventId: null, publishingEventId: null, setOngoingUnpublishBlock: fn(), setUnpublishConfirmEvent: fn(),
    handlePublishClick: fn(), setNoPhotoEvent: fn(), setNoPhotographerEvent: fn(), setPendingBookingEvent: fn(), setPublishConfirmEvent: fn(),
    setCompletionModalEvent: fn(), setCompletionFeedbackStatus: fn(), setCompletionComment: fn(), setShareEvent: fn(), setShowShareModal: fn(), setGeoEvent: fn(),
    openEditModal: fn(), isEventEditable: () => true, isEventPausable: () => false, isEventResumable: () => false, isEventDeletable: () => true, pausingEventId: null, resumingEventId: null,
    setPauseEvent: fn(), setShowPauseModal: fn(), handleResumeEvent: fn(), setDeleteEvent: fn(), setShowDeleteModal: fn(), ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown, role: 'client' | 'event-coordinator') => { await act(async () => { root.render(<GlassMyEvents ctl={c} role={role} modals={<div data-stub="modals" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassMyEvents', () => {
  it('client publish goes through the page handler; coordinator checks the photo first', async () => {
    const c1 = ctl([base]);
    await render(c1, 'client');
    expect(document.querySelector('[data-stub=modals]')).toBeTruthy();
    await click(button(/^Publish$/));
    expect(c1.handlePublishClick).toHaveBeenCalled();
    act(() => root.unmount()); root = createRoot(host);
    const c2 = ctl([{ ...base, coverImage: '' }]);
    await render(c2, 'event-coordinator');
    await click(button(/^Publish$/));
    expect(c2.setNoPhotoEvent).toHaveBeenCalled();
    expect(c2.setPublishConfirmEvent).not.toHaveBeenCalled();
  });

  it('a live event: Unpublish explains instead of asking; Go live is offered', async () => {
    const c = ctl([{ ...base, status: 'ONGOING', isPublished: true }]);
    await render(c, 'client');
    await click(button(/^Unpublish$/));
    expect(c.setOngoingUnpublishBlock).toHaveBeenCalledWith({ title: 'Kigali Gala', photographerName: 'QA Photographer' });
    expect(c.setUnpublishConfirmEvent).not.toHaveBeenCalled();
  });

  it('Geo pricing only for coordinators; Delete asks through the page dialog', async () => {
    const c = ctl([base]);
    await render(c, 'client');
    await click(button(/More options for Kigali Gala/));
    expect(button(/Geo pricing/)).toBeUndefined();
    await click(button(/^Delete$/));
    expect(c.setShowDeleteModal).toHaveBeenCalledWith(true);
    act(() => root.unmount()); root = createRoot(host);
    const k = ctl([base]);
    await render(k, 'event-coordinator');
    await click(button(/More options for Kigali Gala/));
    expect(button(/Geo pricing/)).toBeTruthy();
  });

  it('loading, error with Retry and empty states', async () => {
    await render(ctl([], { isLoadingEvents: true }), 'client');
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
    const c = ctl([], { eventsError: 'x' });
    await render(c, 'client');
    await click(button(/Retry/));
    expect(c.fetchMyEvents).toHaveBeenCalled();
    await render(ctl([]), 'client');
    expect(document.body.textContent).toContain('No events yet');
  });
});
