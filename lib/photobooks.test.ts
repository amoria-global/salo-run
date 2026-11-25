import { describe, expect, it } from 'vitest';
import { bucketCounts, filterBooks, mapPb, nextAction, sourcesOf, statusInfo, timelineOf } from './photobooks';
import { PHOTOBOOK_COPY_KEYS, PHOTOBOOK_DRAFTED, pbCopy } from './photobookCopy';

const b = (status: string, extra: Record<string, unknown> = {}) => mapPb({ id: 'x', name: 'Book', status, ...extra });

describe('web photobook model matches the mobile app', () => {
  it.each([
    ['DRAFT', 'st_draft', 'progress'],
    ['SENT_TO_PHOTOGRAPHER', 'st_with', 'progress'],
    ['PHOTOGRAPHER_EDITING', 'st_editing', 'progress'],
    ['PENDING_PAYMENT', 'st_pay', 'needs'],
    ['RESUBMITTED', 'st_review', 'needs'],
    ['COMPLETED', 'st_done', 'done'],
  ])('%s is %s in %s', (status, key, bucket) => {
    expect(statusInfo(b(status))).toMatchObject({ key, bucket });
  });

  it('a closed-by-photographer book is not Completed, and the photographer sees new and changes-requested as Needs you', () => {
    expect(statusInfo(b('COMPLETED', { closedByPhotographer: true }))).toMatchObject({ key: 'st_closed' });
    expect(statusInfo(b('SENT_TO_PHOTOGRAPHER'), 'received')).toMatchObject({ key: 'st_new', bucket: 'needs' });
    expect(statusInfo(b('SENT_TO_PHOTOGRAPHER', { changeRequestedAt: '2026-11-25' }), 'received')).toMatchObject({ key: 'st_changes' });
  });

  it('counts, filters and the one action', () => {
    const books = [b('DRAFT'), b('PENDING_PAYMENT', { name: 'Kigali' }), b('RESUBMITTED'), b('COMPLETED')];
    expect(bucketCounts(books, 'mine')).toEqual({ all: 4, progress: 1, needs: 2, done: 1 });
    expect(filterBooks(books, 'mine', 'all', 'kigali')).toHaveLength(1);
    expect(nextAction({ status: 'RESUBMITTED' }, 'mine', true)).toBe('review');
    expect(nextAction({ status: 'PENDING_PAYMENT' }, 'mine', true)).toBe('pay');
    expect(nextAction({ status: 'PHOTOGRAPHER_EDITING' }, 'received', true)).toBe('resubmit');
  });

  it('maps source-aware fields and never invents a url for a locked photo', () => {
    const d = b('RESUBMITTED', {
      sources: ['content', 'event'], photographerName: 'Joseph M.', changeRequestNote: 'Swap the cover',
      mediaItems: [{ id: 'p1', fileUrl: 'https://x/o.jpg', original: true }, { id: 'p2', fileUrl: null, original: false, watermarked: true }],
    });
    expect(sourcesOf(d)).toEqual(['event', 'content']);
    expect(d.toName).toBe('Joseph M.');
    expect(d.photos[1]).toMatchObject({ url: undefined, original: false, watermarked: true });
    expect(d.mediaCount).toBe(2);
  });

  it('timeline shows Payment only with extras and Closed for a closed book', () => {
    expect(timelineOf(b('RESUBMITTED')).map((s) => s.key)).toEqual(['tl_created', 'tl_sent', 'tl_edited', 'tl_review', 'tl_done']);
    expect(timelineOf(b('PENDING_PAYMENT', { extraPhotosAmount: 2000 })).map((s) => s.key)).toContain('tl_payment');
    const closed = timelineOf(b('COMPLETED', { closedByPhotographer: true }));
    expect(closed[closed.length - 1].key).toBe('tl_closed');
  });

  it('copy: every drafted language covers the core wording and there is no Delivered or Published status', () => {
    const core = PHOTOBOOK_COPY_KEYS.filter((k) => /^(st_|src_|f_|act_|tl_|chip_)/.test(k));
    for (const lang of ['sw', 'rw', 'fr', 'es'] as const) for (const k of core) expect(PHOTOBOOK_DRAFTED[lang]).toContain(k);
    expect(PHOTOBOOK_COPY_KEYS.join(' ')).not.toMatch(/deliver|publish/i);
    expect(pbCopy('en', 'act_pay', { price: 'RWF 2,000', n: 2 })).toBe('Pay RWF 2,000 for 2 extra photos');
  });
});
