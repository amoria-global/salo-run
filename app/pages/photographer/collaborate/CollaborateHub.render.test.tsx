import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ replace: vi.fn(), search: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('@/app/components/workspace/WorkspaceAccessTab', () => ({
  default: ({ inviteId, onInviteHandled }: { inviteId?: string | null; onInviteHandled?: () => void }) => (
    <div data-testid="workspace-tab" data-invite={inviteId ?? ''}>
      workspace panel
      <button type="button" data-testid="handled" onClick={() => onInviteHandled?.()}>handled</button>
    </div>
  ),
}));
vi.mock('@/app/components/collab/parts', () => ({
  AlbumCover: () => null,
  JoinWithLinkModal: () => null,
  PersonChip: () => null,
  Stat: ({ label }: { label: string }) => <span>{label}</span>,
}));
vi.mock('@/app/lib/APIs/collab', () => ({
  listOwnedAlbums: vi.fn(async () => [{ id: 'a1', title: 'Wedding at the lake', coverImage: null, imageCount: 12, collaboratorCount: 1, pendingCount: 2 }]),
  listJoinedAlbums: vi.fn(async () => []),
}));

import CollaborateHub from './CollaborateHub';

/**
 * The Collaborate page opens on Workspace access and a chooser says what is different about album collaboration.
 * The address decides where it opens, so a link back from an album can land on the albums side.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

async function mount(search = '') {
  nav.search = search;
  await act(async () => {
    root.render(<CollaborateHub />);
  });
  await act(async () => {});
}
const text = () => host.textContent || '';
const radios = () => Array.from(host.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];
const checked = () => radios().filter((r) => r.getAttribute('aria-checked') === 'true').map((r) => r.textContent || '');

beforeEach(() => {
  nav.replace.mockClear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('Collaborate page', () => {
  it('opens on Workspace access with both choices explained', async () => {
    await mount();
    expect(radios()).toHaveLength(2);
    expect(checked()).toHaveLength(1);
    expect(checked()[0]).toContain('Workspace access');
    expect(host.querySelector('[data-testid="workspace-tab"]')).not.toBeNull();
    // What tells the two apart is on the page before anyone clicks.
    expect(text()).toContain('Whole workspace');
    expect(text()).toContain('One album');
    expect(text()).toContain('Withdrawals and transactions stay with you');
    expect(text()).toContain('They never see your bookings, clients or money');
    // The album tabs and the search belong to the albums side only.
    expect(host.querySelector('[role="tablist"]')).toBeNull();
    expect(host.querySelector('input[aria-label="Search albums"]')).toBeNull();
  });

  it('still opens on the workspace for the old workspace address', async () => {
    await mount('tab=workspace');
    expect(checked()[0]).toContain('Workspace access');
  });

  it.each(['tab=mine', 'tab=joined'])('opens on the albums side for ?%s, so a link back from an album lands there', async (q) => {
    await mount(q);
    expect(checked()[0]).toContain('Album collaboration');
    expect(host.querySelector('[data-testid="workspace-tab"]')).toBeNull();
    expect(host.querySelector('[role="tablist"]')).not.toBeNull();
    expect(host.querySelector('input[aria-label="Search albums"]')).not.toBeNull();
    const tabs = Array.from(host.querySelectorAll('[role="tab"]')).map((t) => t.textContent);
    expect(tabs.join(' ')).toContain('My albums');
    expect(tabs.join(' ')).toContain('Joined');
    expect(tabs.join(' ')).not.toContain('Workspace access');
  });

  it('switching the choice swaps the content and updates the address', async () => {
    await mount();
    await act(async () => { radios()[1].click(); });
    expect(checked()[0]).toContain('Album collaboration');
    expect(host.querySelector('[data-testid="workspace-tab"]')).toBeNull();
    expect(text()).toContain('Wedding at the lake');
    expect(nav.replace).toHaveBeenLastCalledWith('/user/photographer/collaborate?tab=mine', { scroll: false });
    await act(async () => { radios()[0].click(); });
    expect(host.querySelector('[data-testid="workspace-tab"]')).not.toBeNull();
    expect(nav.replace).toHaveBeenLastCalledWith('/user/photographer/collaborate', { scroll: false });
  });

  it('remembers the album tab when going back to albums', async () => {
    await mount('tab=joined');
    await act(async () => { radios()[0].click(); });
    await act(async () => { radios()[1].click(); });
    expect(nav.replace).toHaveBeenLastCalledWith('/user/photographer/collaborate?tab=joined', { scroll: false });
  });

  it('offers a way across from each side', async () => {
    await mount();
    const cross = Array.from(host.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Use Album collaboration');
    expect(cross).toBeDefined();
    await act(async () => { cross!.click(); });
    expect(checked()[0]).toContain('Album collaboration');
    const back = Array.from(host.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Use Workspace access');
    expect(back).toBeDefined();
  });

  const INVITE = '3f2a9c1e-5b7d-4c8e-9a10-0b1c2d3e4f50';

  it('opens a workspace invitation link on the workspace side and hands the id to the tab', async () => {
    await mount('tab=workspace&invite=' + INVITE);
    expect(checked()[0]).toContain('Workspace access');
    expect(host.querySelector('[data-testid="workspace-tab"]')!.getAttribute('data-invite')).toBe(INVITE);
  });

  it('opens the workspace side for an invitation link even if the address also names an albums tab', async () => {
    await mount('tab=mine&invite=' + INVITE);
    expect(checked()[0]).toContain('Workspace access');
    expect(host.querySelector('[data-testid="workspace-tab"]')!.getAttribute('data-invite')).toBe(INVITE);
  });

  it('ignores an invite parameter that is not an invitation id', async () => {
    await mount('tab=workspace&invite=../../etc/passwd');
    expect(host.querySelector('[data-testid="workspace-tab"]')!.getAttribute('data-invite')).toBe('');
    await mount('invite=<script>');
    expect(host.querySelector('[data-testid="workspace-tab"]')!.getAttribute('data-invite')).toBe('');
  });

  it('drops the id from the address once the invitation has been handled', async () => {
    await mount('tab=workspace&invite=' + INVITE);
    await act(async () => { (host.querySelector('[data-testid="handled"]') as HTMLButtonElement).click(); });
    expect(nav.replace).toHaveBeenLastCalledWith('/user/photographer/collaborate', { scroll: false });
    expect(host.querySelector('[data-testid="workspace-tab"]')!.getAttribute('data-invite')).toBe('');
  });

  it('has no invitation without a link', async () => {
    await mount();
    expect(host.querySelector('[data-testid="workspace-tab"]')!.getAttribute('data-invite')).toBe('');
  });

  it('works from the keyboard: arrows move the choice, only the chosen one is in the tab order', async () => {
    await mount();
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1]);
    await act(async () => { radios()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
    expect(checked()[0]).toContain('Album collaboration');
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0]);
  });
});
