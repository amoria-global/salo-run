import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));

import GlassStreams from './GlassStreams';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const stream = (over: Record<string, unknown> = {}) => ({
  id: 's1', eventId: 'e1', eventTitle: 'Kigali Gala', eventType: 'Wedding', photographerName: 'Ada Lens', photographerImage: '', streamTitle: 'Gala live',
  description: '', streamDate: '2026-11-10', streamTime: '18:00', duration: '1h 20m', coverImage: '', totalViewers: 1200, peakViewers: 300, totalMessages: 4,
  totalVideoMessages: 2, replayUrl: '', messages: [], videoMessages: [{ id: 'v1', viewed: false }, { id: 'v2', viewed: true }], ...over,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctl(list: Record<string, unknown>[], over: Record<string, unknown> = {}): Record<string, any> {
  const fn = () => vi.fn();
  return {
    streamsLoaded: true, streamsError: false, fetchStreams: fn(), streams: list, filteredStreams: list, searchQuery: '', setSearchQuery: fn(),
    eventTypes: ['all', 'Wedding'], filterType: 'all', setFilterType: fn(), formatDate: (d: string) => d,
    getUnviewedVideoCount: (s: { videoMessages: { viewed: boolean }[] }) => s.videoMessages.filter((v) => !v.viewed).length,
    setSelectedStream: fn(), setShowMessagesModal: fn(), setShowVideosModal: fn(), setDeleteTarget: fn(), ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown) => { await act(async () => { root.render(<GlassStreams ctl={c as never} modals={<div data-stub="modals" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassStreams', () => {
  it('skeleton, error with retry, empty and no-match states', async () => {
    await render(ctl([], { streamsLoaded: false }));
    expect(text()).not.toContain('No completed streams yet');
    const e = ctl([], { streamsError: true });
    await render(e);
    await click(button(/Try again|Retry/));
    expect(e.fetchStreams).toHaveBeenCalled();
    await render(ctl([]));
    expect(text()).toContain('No completed streams yet');
    await render(ctl([stream()], { filteredStreams: [] }));
    expect(text()).toContain('No completed streams found');
  });

  it('totals, unseen videos, chats, videos, delete and the filter', async () => {
    const s = stream();
    const c = ctl([s]);
    await render(c);
    expect(text()).toContain('1 new video');
    expect(text()).toContain((1200).toLocaleString());
    await click(button(/^Chats$/));
    expect(c.setSelectedStream).toHaveBeenCalledWith(s);
    expect(c.setShowMessagesModal).toHaveBeenCalledWith(true);
    await click(button(/^Videos$/));
    expect(c.setShowVideosModal).toHaveBeenCalledWith(true);
    await click(button(/Delete Gala live/));
    expect(c.setDeleteTarget).toHaveBeenCalledWith(s);
    await click(button(/^Wedding$/));
    expect(c.setFilterType).toHaveBeenCalledWith('Wedding');
    expect(host.querySelector('[data-stub=modals]')).toBeTruthy();
  });
});
