import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getOwnedAlbum: vi.fn(),
  cancelInvite: vi.fn(),
  removeCollaborator: vi.fn(),
  reviewSubmissions: vi.fn(),
  createInvite: vi.fn(),
}));
vi.mock('@/app/lib/APIs/collab', () => api);
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

import OwnerAlbum from './OwnerAlbum';

/**
 * The owner's Progress tab: how each photographer who accepted the invitation is getting on with their photos for THIS
 * album, who needs the owner first, a way from each card to that person's photos, people who have left, and the empty
 * cases. Over a fake album (react-dom in happy-dom); it never talks to a backend.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const person = (id: string, name: string) => ({ id, name, avatar: null });
const collab = (id: string, name: string, joinedAt = '2026-10-01T09:00:00') => ({ ...person(id, name), membershipId: 'm-' + id, joinedAt });
let n = 0;
const sub = (by: { id: string; name: string }, status: string, submittedAt = '2026-10-10T10:00:00') => ({
  id: 's' + ++n, albumId: 'a1', imageUrl: 'https://img.test/' + n + '.jpg', thumbnailUrl: 'https://img.test/t' + n + '.jpg', status,
  submittedAt, reviewedAt: status === 'PENDING' ? null : '2026-10-11T10:00:00', collaborator: person(by.id, by.name),
});
const many = (by: { id: string; name: string }, status: string, count: number) => Array.from({ length: count }, () => sub(by, status));

const eric = collab('e', 'Eric Mugisha');
const chantal = collab('c', 'Chantal Ineza', '2026-10-02T09:00:00');
const olive = collab('o', 'Olive Kamali', '2026-10-03T09:00:00');
const gone = person('g', 'Gone Photographer');

function album(over: Record<string, unknown> = {}) {
  return {
    album: { id: 'a1', title: 'Wedding at the lake', coverImage: null, imageCount: 50, createdAt: '2026-09-01T00:00:00' },
    collaborators: [olive, eric, chantal],
    invites: [],
    submissions: [
      ...many(eric, 'APPROVED', 8), ...many(eric, 'PENDING', 4), ...many(eric, 'REJECTED', 1),
      ...many(chantal, 'APPROVED', 3),
      ...many(gone, 'APPROVED', 2),
    ],
    ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
async function mount(detail = album()) {
  api.getOwnedAlbum.mockResolvedValue(detail);
  await act(async () => { root.render(<OwnerAlbum albumId="a1" />); });
  await act(async () => {});
  await act(async () => {});
}
const text = () => host.textContent || '';
const tabs = () => Array.from(host.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
const tab = (label: string) => tabs().find((t) => (t.textContent || '').startsWith(label))!;
const buttons = () => Array.from(host.querySelectorAll('button'));
const byText = (t: string) => buttons().find((b) => (b.textContent || '').trim().startsWith(t));
async function click(el: HTMLElement | undefined) {
  if (!el) throw new Error('control not found');
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}
const cards = () => Array.from(host.querySelectorAll('[data-testid="contributor-card"]')) as HTMLElement[];
/** The current collaborators only: the list of people who left is a separate section. */
const currentCards = () => Array.from(host.querySelectorAll('ul[aria-label="Collaborators"] > li [data-testid="contributor-card"]')) as HTMLElement[];
const cardOf = (name: string) => cards().find((c) => (c.textContent || '').includes(name))!;

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset());
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('the Progress tab', () => {
  it('is its own tab, with the number of collaborators, between Review and History', async () => {
    await mount();
    expect(tabs().map((t) => (t.textContent || '').replace(/\d+$/, '').trim())).toEqual(['Review', 'Progress', 'History']);
    expect(tab('Progress').textContent).toContain('3');
  });

  it('summarises the whole album and says who is waiting', async () => {
    await mount();
    await click(tab('Progress'));
    const summary = host.querySelector('[data-testid="progress-summary"]')!.textContent || '';
    expect(summary).toContain('Collaboration progress');
    // 8 + 4 + 1 from Eric, 3 from Chantal, 2 from a photographer who has since left.
    expect(summary).toContain('Submitted18');
    expect(summary).toContain('Added to album13');
    expect(summary).toContain('Waiting for you4');
    expect(summary).toContain('Not accepted1');
    expect(summary).toContain('2 of 3 collaborators have submitted photos, and 1 is waiting for you.');
  });

  it('shows a card for each collaborator, those who need the owner first and those who have not started last', async () => {
    await mount();
    await click(tab('Progress'));
    expect(currentCards().map((c) => c.getAttribute('data-state'))).toEqual(['waiting', 'up_to_date', 'not_started']);
    expect(currentCards().map((c) => (c.querySelector('h3')!.textContent))).toEqual(['Eric Mugisha', 'Chantal Ineza', 'Olive Kamali']);
  });

  it('breaks a collaborator down in words and numbers, with their share of the album', async () => {
    await mount();
    await click(tab('Progress'));
    const eCard = cardOf('Eric Mugisha');
    expect(eCard.textContent).toContain('4 to review');
    expect(eCard.textContent).toContain('8 added');
    expect(eCard.textContent).toContain('4 waiting');
    expect(eCard.textContent).toContain('1 not accepted');
    expect(eCard.textContent).toContain('Accounts for 16% of this album');
    expect(eCard.textContent).toContain('89% of reviewed photos were added');
    // The bar is described for anyone who cannot see it.
    expect(eCard.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('8 photos added, 4 waiting, 1 not accepted');
    expect(cardOf('Chantal Ineza').textContent).toContain('Up to date');
  });

  it('says plainly that a collaborator who has not sent anything has not started', async () => {
    await mount();
    await click(tab('Progress'));
    const o = cardOf('Olive Kamali');
    expect(o.textContent).toContain('No photos yet');
    expect(o.textContent).toContain('Accepted your invitation but has not sent a photo yet.');
    expect(o.querySelector('[role="img"]')).toBeNull();
    expect(Array.from(o.querySelectorAll('button')).map((b) => (b.textContent || '').trim())).toEqual(['Remove']);
  });

  it('lists people who left apart, counts their photos, and offers nothing to manage', async () => {
    await mount();
    await click(tab('Progress'));
    const past = host.querySelector('[data-testid="former-contributors"]')!;
    expect(past.textContent).toContain('Past collaborators (1)');
    expect(past.textContent).toContain('Gone Photographer');
    expect(past.textContent).toContain('Their photos stay in the album and are counted above.');
    expect(Array.from(past.querySelectorAll('button')).map((b) => (b.textContent || '').trim())).not.toContain('Remove');
    // They are not among the current collaborators.
    expect(currentCards()).toHaveLength(3);
    expect(currentCards().some((c) => (c.textContent || '').includes('Gone Photographer'))).toBe(false);
  });

  it('opens a confirmation before removing, and only removes after it is confirmed', async () => {
    api.removeCollaborator.mockResolvedValue(undefined);
    await mount();
    await click(tab('Progress'));
    await click(host.querySelector('[aria-label="Remove Chantal Ineza"]') as HTMLElement);
    expect(text()).toContain('Remove Chantal Ineza?');
    expect(api.removeCollaborator).not.toHaveBeenCalled();
  });
});

describe('from a card to that person\'s photos', () => {
  it('"Review their photos" opens Review narrowed to them, and the tab counts stay whole', async () => {
    await mount();
    await click(tab('Progress'));
    await click(byText('Review their photos (4)'));
    expect(tab('Review').getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('[data-testid="contributor-filter"]')!.textContent).toContain('Showing only photos from Eric Mugisha');
    // Four of Eric's photos wait, and that is all that is shown; the tab still counts everything waiting.
    expect(host.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0);
    expect(tab('Review').textContent).toContain('4');
    expect(tab('History').textContent).toContain('14');
  });

  it('"All their photos" opens History narrowed to them', async () => {
    await mount();
    await click(tab('Progress'));
    await click(cardOf('Chantal Ineza').querySelector('button') as HTMLElement);
    expect(tab('History').getAttribute('aria-selected')).toBe('true');
    expect(host.querySelector('[data-testid="contributor-filter"]')!.textContent).toContain('Chantal Ineza');
    expect(host.querySelectorAll('button[aria-label^="Open photo from"]').length).toBe(3);
    expect(Array.from(host.querySelectorAll('button[aria-label^="Open photo from"]')).every((b) => (b.getAttribute('aria-label') || '').includes('Chantal'))).toBe(true);
  });

  it('shows everyone again from the filter, and says so when the person has nothing waiting', async () => {
    await mount();
    await click(tab('Progress'));
    await click(cardOf('Chantal Ineza').querySelector('button') as HTMLElement);
    await click(tab('Review'));
    expect(text()).toContain('Nothing from Chantal Ineza to review');
    expect(text()).toContain('Everything they sent has been decided.');
    await click(byText('Show everyone'));
    expect(host.querySelector('[data-testid="contributor-filter"]')).toBeNull();
    expect(host.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0);
  });

  it('shows no filter without one', async () => {
    await mount();
    expect(host.querySelector('[data-testid="contributor-filter"]')).toBeNull();
  });
});

describe('when there is nothing to track yet', () => {
  it('invites someone when there are no collaborators and nobody has ever sent photos', async () => {
    await mount(album({ collaborators: [], submissions: [] }));
    await click(tab('Progress'));
    expect(text()).toContain('No collaborators yet');
    expect(text()).toContain('you can follow their progress here');
    expect(host.querySelector('[data-testid="progress-summary"]')).toBeNull();
  });

  it('says nobody has submitted yet when collaborators have joined', async () => {
    await mount(album({ collaborators: [eric, chantal], submissions: [] }));
    await click(tab('Progress'));
    const summary = host.querySelector('[data-testid="progress-summary"]')!.textContent || '';
    expect(summary).toContain('2 photographers have joined. Nobody has submitted a photo yet.');
    expect(host.querySelector('[data-testid="progress-summary"] [role="img"]')!.getAttribute('aria-label')).toBe('No photos submitted yet');
    expect(cards().every((c) => c.getAttribute('data-state') === 'not_started')).toBe(true);
  });

  it('says you are all caught up when everything is decided', async () => {
    await mount(album({ collaborators: [chantal], submissions: many(chantal, 'APPROVED', 2) }));
    await click(tab('Progress'));
    expect(host.querySelector('[data-testid="progress-summary"]')!.textContent).toContain('You are all caught up.');
  });

  it('still shows the history of people who left when no one is left', async () => {
    await mount(album({ collaborators: [], submissions: many(gone, 'APPROVED', 2) }));
    await click(tab('Progress'));
    expect(host.querySelector('[data-testid="former-contributors"]')).not.toBeNull();
    expect(text()).not.toContain('No collaborators yet');
  });
});
