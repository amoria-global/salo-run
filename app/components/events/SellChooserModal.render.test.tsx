import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SellChooserModal from './SellChooserModal';
import { CONTENT_PHOTOS_ERROR, CONTENT_SAVED_DRAFT, CONTENT_SUBMITTED, SELL_CHOICES, SELL_CHOOSER_TITLE, contentSubmitFailed, parseSellChoice } from '../../../lib/albums/sellPhotos';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * The Sell photos chooser on the web: every entry opens it before any form, each option opens the right flow, the last
 * choice is remembered, and the content album form never touches face indexing or credits.
 */
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  window.localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const mount = () => {
  const fns = { onPick: vi.fn(), onClose: vi.fn() };
  act(() => root.render(<SellChooserModal {...fns} />));
  return fns;
};
const choice = (key: string) => document.querySelector(`[data-testid="sell-choice-${key}"]`) as HTMLButtonElement;
// events.tsx's rules now live in the page and its extracted hook, so both are read.
const SRC = (f: string) => (readFileSync(path.join(__dirname, '..', '..', 'pages', 'photographer', f), 'utf8') + (f === 'events.tsx' ? '\n' + readFileSync(path.join(__dirname, 'photographer', 'usePhotographerEvents.tsx'), 'utf8') : '')).replace(/\r\n/g, '\n');

describe('Sell photos chooser (web)', () => {
  it('asks what you want to sell with both options and their one-line descriptions', () => {
    mount();
    const text = document.body.textContent ?? '';
    expect(SELL_CHOOSER_TITLE).toBe('What do you want to sell?');
    expect(text).toContain('What do you want to sell?');
    expect(text).toContain('Event photos');
    expect(text).toContain('People at an event find and buy their photos with face search on Find my photos.');
    expect(text).toContain('Stock & content');
    expect(text).toContain('Nature, portraits and other work to sell or showcase. Reviewed before going live.');
    expect(SELL_CHOICES.map((c) => c.key)).toEqual(['event', 'content']);
  });

  it('each option reports its own key', () => {
    const { onPick } = mount();
    act(() => choice('event').click());
    expect(onPick).toHaveBeenLastCalledWith('event');
    act(() => choice('content').click());
    expect(onPick).toHaveBeenLastCalledWith('content');
  });

  it('remembers the last choice and highlights it next time, and the chooser is still shown', () => {
    mount();
    act(() => choice('content').click());
    expect(window.localStorage.getItem('sell.lastChoice')).toBe('content');
    act(() => root.unmount());
    root = createRoot(host);
    mount();
    expect(document.body.textContent).toContain('What do you want to sell?');
    expect(choice('content').getAttribute('aria-pressed')).toBe('true');
    expect(choice('event').getAttribute('aria-pressed')).toBe('false');
    expect(document.body.textContent).toContain('Last used');
  });

  it('ignores a stored value it does not know', () => {
    expect(parseSellChoice('nonsense')).toBeNull();
    expect(parseSellChoice('event')).toBe('event');
  });
});

describe('every Sell photos entry opens the chooser, and each option opens the right flow', () => {
  const events = SRC('events.tsx');
  it('the header button, the deep link and the Get started row open the chooser, never a form directly', () => {
    expect(events).toContain('const handleSellPhotos = () => setShowSellChooser(true);');
    expect(events).toContain('onClick={handleSellPhotos} className="ck-btn ck-btn-primary" title={SELL_SUBTITLE}');
    expect(events).toContain("if (key === 'new-album') handleSellPhotos();");
    expect(events).toContain("params.get('sell') !== '1'");
    expect(SRC('dashboard.tsx')).toContain('/user/photographer/events?${SELL_PHOTOS_QUERY}');
  });
  it('Event photos opens the standalone PAID form; Stock & content opens the content album form on its tab', () => {
    expect(events).toContain("if (key === 'event') startEventSale();");
    expect(events).toContain('else startContentSale();');
    const content = events.slice(events.indexOf('const startContentSale'), events.indexOf('const handleSellPhotos'));
    expect(content).toContain("setActiveTab('content')");
    expect(content).toContain('setContentCreateSignal');
    expect(events).toContain('openCreateSignal={contentCreateSignal}');
  });
});

describe('content albums (web)', () => {
  const tab = SRC('ContentAlbumsTab.tsx');

  it('the form ends with Submit for review (create + submit) and Save as draft (create only)', () => {
    expect(tab).toContain('data-testid="content-submit"');
    expect(tab).toContain("'Submit for review'");
    expect(tab).toContain("'Save as draft'");
    expect(tab).toContain("void run('draft')");
    expect(tab).toContain("void run('submit')");
    const flow = tab.slice(tab.indexOf('const run = async'), tab.indexOf('const submit = (e'));
    const draftBranch = flow.slice(flow.indexOf("if (mode === 'draft')"), flow.indexOf('await submitForReview'));
    expect(draftBranch).toContain('CONTENT_SAVED_DRAFT');
    expect(draftBranch).not.toContain('/submit');
  });

  it('blocks 0 photos with the field error, in the form and on the card', () => {
    expect(CONTENT_PHOTOS_ERROR).toBe('Add at least 1 photo');
    expect(tab).toContain('if (images.length === 0) { setPhotosError(CONTENT_PHOTOS_ERROR); return; }');
    expect(tab).toContain('id="content-photos-error"');
    expect(tab).toContain("disabled={submittingId === a.id || (a.imageCount ?? 0) === 0}");
  });

  it('shows its own success states, and never mentions Find my photos or face search', () => {
    expect(CONTENT_SUBMITTED.headline).toBe('Submitted for review');
    expect(CONTENT_SUBMITTED.status).toBe("We'll notify you when it's live");
    expect(CONTENT_SAVED_DRAFT.headline).toBe('Saved as draft');
    expect(contentSubmitFailed('x').state).toBe('draft-submit-failed');
    for (const o of [CONTENT_SUBMITTED, CONTENT_SAVED_DRAFT]) expect(`${o.headline} ${o.status}`).not.toMatch(/Find my photos|face/i);
    expect(tab).toContain('View album');
  });

  it('never calls face indexing, publish or credits', () => {
    expect(tab).not.toMatch(/\/publish|face-status|face-search|faceRecognition|\bcredits?\b|Find my photos/i);
  });
});
