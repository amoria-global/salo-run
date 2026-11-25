import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const fetchMock = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a) }));
vi.mock('../events/NewPhotobookModal', () => ({ default: () => null }));

import PhotobooksShelf from './PhotobooksShelf';

const book = (id: string, name: string, status: string, extra: Record<string, unknown> = {}) => ({
  id, name, status, mediaCount: 3, photographerName: 'Joseph M.', createdAt: '2026-11-02T10:00:00', sources: ['event'],
  mediaItems: [{ id: `${id}1`, fileUrl: 'https://x/1.jpg' }], ...extra,
});
const respond = (mine: unknown[], received: unknown[] = []) =>
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ action: 1, data: url.includes('/photographer/photobooks') ? received : mine }) }));

let root: Root;
let host: HTMLDivElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); fetchMock.mockReset(); push.mockReset(); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
const mount = async (role: 'client' | 'photographer' = 'client') => { act(() => root.render(<PhotobooksShelf role={role} />)); await flush(); };

describe('photobooks shelf', () => {
  it('a single book is one fixed-width card in a fixed-width grid, never a stretched block', async () => {
    respond([book('b1', 'Ben and Raya', 'RESUBMITTED')]);
    await mount();
    expect(document.querySelectorAll('.pbk-card').length).toBe(1);
    expect(document.querySelector('.pbk-grid')).not.toBeNull();
    expect(document.querySelector('.pbk-card')?.textContent).toContain('Ready to review');
    expect(document.querySelector('.pbk-card')?.textContent).toContain('Event album');
  });

  it('filters match the real statuses and have counts; there is no Published or Delivered filter', async () => {
    respond([book('b1', 'A', 'DRAFT'), book('b2', 'B', 'PENDING_PAYMENT'), book('b3', 'C', 'COMPLETED', { closedByPhotographer: true })]);
    await mount();
    const chips = [...document.querySelectorAll('.pbk-fchip')].map((c) => c.textContent);
    expect(chips).toEqual(['All 3', 'In progress 1', 'Needs you 1', 'Completed 1']);
    act(() => (document.querySelectorAll('.pbk-fchip')[2] as HTMLButtonElement).click());
    expect([...document.querySelectorAll('.pbk-card')].map((c) => c.textContent)).toEqual([expect.stringContaining('Payment needed')]);
    act(() => (document.querySelectorAll('.pbk-fchip')[3] as HTMLButtonElement).click());
    expect(document.querySelector('.pbk-card')?.textContent).toContain('Closed by photographer');
  });

  it('a photographer gets the My photobooks / Received switch with counts, and received books open through the received route', async () => {
    respond([book('b1', 'Mine', 'DRAFT')], [book('r1', 'From client', 'SENT_TO_PHOTOGRAPHER', { senderName: 'Aline U.' })]);
    await mount('photographer');
    const tabs = [...document.querySelectorAll('.pbk-switch button')].map((t) => t.textContent);
    expect(tabs).toEqual(['My photobooks 1', 'Received 1']);
    act(() => (document.querySelectorAll('.pbk-switch button')[1] as HTMLButtonElement).click());
    expect(document.querySelector('.pbk-card')?.textContent).toContain('New to edit');
    expect(document.querySelector('.pbk-card')?.textContent).toContain('From Aline U.');
    act(() => (document.querySelector('.pbk-card') as HTMLButtonElement).click());
    expect(push).toHaveBeenCalledWith('/user/photographer/photobooks/r1?received=1');
  });

  it('an empty shelf says what to do, and an empty book shows a No photos tile', async () => {
    respond([]);
    await mount();
    expect(document.body.textContent).toContain('No photobooks yet');
    act(() => root.unmount());
    root = createRoot(host);
    respond([book('b1', 'Empty', 'COMPLETED', { mediaCount: 0, mediaItems: [], closedByPhotographer: true })]);
    await mount();
    expect(document.querySelector('.pbk-empty')).not.toBeNull();
  });
});
