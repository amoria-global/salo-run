import { describe, it, expect } from 'vitest';
import { describePublishFailure, LISTED_HEADLINE, notVisibleBadge, outcomeFromIndexing, preparingOutcome, publishOutcome, sellFieldErrors } from './sellPhotos';

const ok = { title: 'Kigali', price: '2000', currencyId: 'RWF', priceMsg: null, photoCount: 3 };

describe('sellFieldErrors: what stops an album reaching Find my photos, per field', () => {
  it('nothing missing is no errors', () => expect(sellFieldErrors(ok)).toEqual({}));
  it('names each missing field in plain words', () => {
    expect(sellFieldErrors({ ...ok, title: '  ' }).title).toBe('Add a title for this album.');
    expect(sellFieldErrors({ ...ok, price: '' }).price).toBe('Enter a price per photo and choose a currency.');
    expect(sellFieldErrors({ ...ok, currencyId: '' }).price).toBe('Enter a price per photo and choose a currency.');
    expect(sellFieldErrors({ ...ok, photoCount: 0 }).photos).toBe('Add at least one photo so buyers have something to find.');
  });
  it('a price below the currency minimum shows the minimum message the money field already computes', () => {
    expect(sellFieldErrors({ ...ok, priceMsg: 'The minimum is RWF 100.' }).price).toBe('The minimum is RWF 100.');
  });
  it('reports all problems at once, so one click shows everything to fix', () => {
    expect(Object.keys(sellFieldErrors({ title: '', price: '', currencyId: '', priceMsg: null, photoCount: 0 })).sort()).toEqual(['photos', 'price', 'title']);
  });
});

describe('describePublishFailure', () => {
  it('credits: names the shortfall and says to top up', () => {
    const f = describePublishFailure({ status: 402, body: { needed: 30, balance: 4 } });
    expect(f.kind).toBe('credits');
    expect(f.message).toContain('You need 30 credits and have 4');
    expect(f.message).toMatch(/Top up/);
  });
  it('a code alone is enough to know it is credits', () => {
    expect(describePublishFailure({ status: 400, body: { code: 'INSUFFICIENT_AI_CREDITS' } }).kind).toBe('credits');
  });
  it('a gateway timeout says the work continues and to retry, not to re-upload', () => {
    for (const status of [408, 502, 504]) {
      const f = describePublishFailure({ status });
      expect(f.kind).toBe('timeout');
      expect(f.message).toMatch(/keeps going/);
      expect(f.message).toMatch(/Retry publishing/);
    }
  });
  it('a dropped connection and a plain refusal each read clearly', () => {
    expect(describePublishFailure({ networkError: true }).message).toMatch(/lost the connection/);
    expect(describePublishFailure({ status: 400, body: { message: 'Price too low' } }).message).toBe('Price too low');
    expect(describePublishFailure({ status: 500 }).message).toMatch(/Retry publishing/);
  });
});

describe('publishOutcome', () => {
  it('listed with faces', () => {
    const o = publishOutcome({ published: true, facesIndexed: 1 });
    expect(o).toMatchObject({ state: 'listed', headline: LISTED_HEADLINE, warn: false });
    expect(o.status).toContain('1 face indexed');
  });
  it('listed without faces warns instead of claiming success', () => {
    expect(publishOutcome({ published: true, facesIndexed: 0 })).toMatchObject({ state: 'listed', warn: true });
    expect(publishOutcome({ published: true })).toMatchObject({ warn: true });
  });
  it('not published is a failure with the reason, never the success headline', () => {
    const o = publishOutcome({ failure: { kind: 'timeout', message: 'slow' } });
    expect(o).toMatchObject({ state: 'failed', status: 'slow' });
    expect(o.headline).not.toBe(LISTED_HEADLINE);
    expect(publishOutcome({}).state).toBe('failed');
  });
});

describe('notVisibleBadge', () => {
  it('flags a standalone PAID album that is not live', () => {
    expect(notVisibleBadge({ isStandalone: true, faceRecognitionEnabled: false })).toBe('Not visible on Find my photos');
    expect(notVisibleBadge({ albumType: 'standalone' })).toBe('Not visible on Find my photos');
  });
  it('says nothing for a live, FREE or event album', () => {
    expect(notVisibleBadge({ isStandalone: true, faceRecognitionEnabled: true })).toBeNull();
    expect(notVisibleBadge({ isStandalone: true, isFreeAlbum: true })).toBeNull();
    expect(notVisibleBadge({ albumType: 'event' })).toBeNull();
  });
});

describe('a large album indexed in the background', () => {
  it('a published album still being indexed says how far it got, not "no faces"', () => {
    const o = publishOutcome({ published: true, facesIndexed: 0, indexing: { total: 120, done: 15 } });
    expect(o).toMatchObject({ state: 'preparing', headline: LISTED_HEADLINE, total: 120, done: 15 });
    expect(o.status).toBe('Preparing 15 of 120 photos. Buyers can already find the ones that are ready.');
  });
  it('never shows more done than total, and an unknown total reads cleanly', () => {
    expect(preparingOutcome(10, 14).status).toContain('Preparing 10 of 10');
    expect(preparingOutcome(0, 0).status).toBe('Preparing your photos. Buyers can already find the ones that are ready.');
  });
  it('polling: INDEXING stays preparing, DONE is listed, FAILED is a failure with Retry publishing', () => {
    expect(outcomeFromIndexing({ status: 'INDEXING', total: 40, done: 20 })).toMatchObject({ state: 'preparing', done: 20 });
    expect(outcomeFromIndexing({ status: 'DONE', total: 40, done: 40 })).toMatchObject({ state: 'listed', warn: false, facesIndexed: 40 });
    const failed = outcomeFromIndexing({ status: 'FAILED', total: 40, done: 12 });
    expect(failed).toMatchObject({ state: 'failed' });
    expect(failed?.status).toMatch(/Retry publishing/);
  });
  it('a status that says nothing about background indexing changes nothing', () => {
    expect(outcomeFromIndexing(undefined)).toBeNull();
    expect(outcomeFromIndexing({ status: 'WHAT' })).toBeNull();
  });
});
