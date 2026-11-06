import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GetStartedModal from './GetStartedModal';
import { getStartedActions } from '../../lib/getStarted';

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

const mount = (canHost = true) => {
  const fns = { onPick: vi.fn(), onClose: vi.fn(), onDismissChange: vi.fn() };
  act(() => root.render(<GetStartedModal actions={getStartedActions('photographer', { canHost })} createLabel="Create event" {...fns} />));
  return fns;
};
const button = (label: string) => [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label')?.startsWith(label) || b.textContent?.trim() === label) as HTMLButtonElement;

describe('Get started modal', () => {
  it('shows the title, subtitle, role rows, the tip and the checkbox in a labelled dialog', () => {
    mount();
    const text = document.body.textContent ?? '';
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull();
    expect(text).toContain('Get started with Events');
    expect(text).toContain('What would you like to do first?');
    expect(text).toContain('Host and stream an event yourself');
    expect(text).toContain('Upload, share or sell photos');
    expect(text).not.toContain('Book a photographer for your event');
    expect(text).toContain('+ Create event');
    expect(document.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(document.querySelector('[aria-label="Close"]')).not.toBeNull();
  });

  it('moves focus into the dialog', () => {
    mount();
    expect(document.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
  });

  it('a row picks its flow; the primary button runs the first action', () => {
    const { onPick } = mount();
    act(() => button('New album').click());
    expect(onPick).toHaveBeenLastCalledWith('new-album');
    act(() => button('Go live').click());
    expect(onPick).toHaveBeenLastCalledWith('go-live');
  });

  it('Explore on my own and the close button close for the session without saving anything', () => {
    const { onClose, onDismissChange } = mount();
    act(() => button('Explore on my own').click());
    act(() => (document.querySelector('[aria-label="Close"]') as HTMLButtonElement).click());
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onDismissChange).not.toHaveBeenCalled();
  });

  it('the checkbox reports ticking and clearing', () => {
    const { onDismissChange } = mount();
    const box = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    act(() => box.click());
    expect(onDismissChange).toHaveBeenLastCalledWith(true);
    act(() => box.click());
    expect(onDismissChange).toHaveBeenLastCalledWith(false);
  });
});
