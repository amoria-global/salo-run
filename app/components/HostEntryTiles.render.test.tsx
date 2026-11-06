import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HostEntryTiles from './HostEntryTiles';
import SelfStreamLink from './SelfStreamLink';

vi.mock('next/link', () => ({ default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => <a href={href} {...rest}>{children}</a> }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const hrefs = () => [...host.querySelectorAll('a')].map((a) => a.getAttribute('href'));

describe('Go live tiles, one component for every role', () => {
  it('default to the photographer routes exactly as before', () => {
    act(() => root.render(<HostEntryTiles caption="1 upcoming · 0 live" />));
    expect(hrefs()).toEqual(['/user/photographer/host?new=1', '/user/photographer/host']);
    expect(host.textContent).toContain('Go live');
    expect(host.textContent).toContain('My hosted events');
    expect(host.textContent).toContain('1 upcoming · 0 live');
  });

  it('open the client and coordinator routes when given their base path', () => {
    act(() => root.render(<HostEntryTiles caption="x" basePath="/user/client/host" />));
    expect(hrefs()).toEqual(['/user/client/host?new=1', '/user/client/host']);
    act(() => root.render(<HostEntryTiles caption="x" basePath="/user/event-coordinator/host" />));
    expect(hrefs()).toEqual(['/user/event-coordinator/host?new=1', '/user/event-coordinator/host']);
  });
});

describe('the create form link to Go live', () => {
  it('says "Want to stream it yourself?" and links to Host an event', () => {
    act(() => root.render(<SelfStreamLink href="/user/client/host?new=1" color="#444" linkColor="#F20C8F" />));
    expect(host.textContent).toContain('Want to stream it yourself?');
    expect(hrefs()).toEqual(['/user/client/host?new=1']);
  });
});
