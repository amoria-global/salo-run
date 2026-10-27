import { describe, expect, it, vi } from 'vitest';
import {
  bucketOf, createHostedEvent, getEligibility, listHostedEvents, parseEligibility, runHostFlow, validateHostForm,
  type HostDeps, type HostedEventInput,
} from './hostedEvents';

const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;
const input: HostedEventInput = { title: 'Rooftop set', eventDate: '2026-11-10' };
const cover = new File(['x'], 'c.jpg', { type: 'image/jpeg' });

function deps(over: Partial<HostDeps> = {}) {
  return {
    create: vi.fn().mockResolvedValue({ id: 'ev1' }),
    uploadCover: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    ...over,
  } as HostDeps & { create: ReturnType<typeof vi.fn>; uploadCover: ReturnType<typeof vi.fn>; publish: ReturnType<typeof vi.fn> };
}

describe('server answers', () => {
  it('reads eligibility, and an unknown reason or missing field means no', () => {
    expect(parseEligibility({ enabled: true, canHostFree: true, canHostPaid: false, reason: 'KYC_REQUIRED_FOR_PAID' }))
      .toEqual({ enabled: true, canHostFree: true, canHostPaid: false, reason: 'KYC_REQUIRED_FOR_PAID' });
    expect(parseEligibility({ reason: 'SOMETHING_NEW' })).toEqual({ enabled: false, canHostFree: false, canHostPaid: false, reason: null });
    expect(parseEligibility(undefined).canHostFree).toBe(false);
  });

  it('treats HTTP 200 with action 0 as a refusal and carries the server message', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 0, message: 'Hosting your own events is not available right now.' }));
    await expect(createHostedEvent('https://api', f, input)).rejects.toThrow('not available right now');
    await expect(getEligibility('https://api', f)).rejects.toThrow('not available');
  });

  it('lists events from the envelope and drops rows without an id', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 1, data: [{ id: 'a', title: 'One', eventStatus: 'ONGOING', streamFee: 5000 }, { title: 'no id' }] }));
    const list = await listHostedEvents('https://api', f);
    expect(list).toEqual([{ id: 'a', title: 'One', eventDate: undefined, status: 'ONGOING', streamFee: 5000 }]);
  });

  it('posts the new event as JSON to the hosted-events route', async () => {
    const f = vi.fn().mockResolvedValue(json({ action: 1, data: { id: 'ev9', title: 'Rooftop set' } }));
    const e = await createHostedEvent('https://api', f, input);
    expect(e.id).toBe('ev9');
    expect(f.mock.calls[0][0]).toBe('https://api/api/remote/photographer/hosted-events');
    expect(f.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });
});

describe('runHostFlow', () => {
  it('creates, uploads the cover, then publishes', async () => {
    const d = deps();
    expect(await runHostFlow(d, input, cover)).toMatchObject({ status: 'done', eventId: 'ev1' });
    expect(d.publish).toHaveBeenCalledWith('ev1');
  });

  it('a failed create stops there', async () => {
    const d = deps({ create: vi.fn().mockRejectedValue(new Error('Refused')) });
    expect(await runHostFlow(d, input, cover)).toMatchObject({ status: 'failed', step: 'create', message: 'Refused' });
    expect(d.uploadCover).not.toHaveBeenCalled();
  });

  it('a failed cover keeps the event and the retry never creates a second one', async () => {
    const d = deps({ uploadCover: vi.fn().mockRejectedValueOnce(new Error('Too large')).mockResolvedValue(undefined) });
    const first = await runHostFlow(d, input, cover);
    expect(first).toMatchObject({ status: 'failed', step: 'cover', progress: { eventId: 'ev1' } });
    expect(await runHostFlow(d, input, cover, first.progress)).toMatchObject({ status: 'done' });
    expect(d.create).toHaveBeenCalledTimes(1);
  });

  it('a failed publish retries only the publish', async () => {
    const d = deps({ publish: vi.fn().mockRejectedValueOnce(new Error('Not yet')).mockResolvedValue(undefined) });
    const first = await runHostFlow(d, input, cover);
    expect(first).toMatchObject({ step: 'publish', progress: { eventId: 'ev1', coverDone: true } });
    await runHostFlow(d, input, cover, first.progress);
    expect(d.uploadCover).toHaveBeenCalledTimes(1);
    expect(d.publish).toHaveBeenCalledTimes(2);
  });
});

describe('validateHostForm and bucketOf', () => {
  const ok = { title: 'Rooftop set', date: '2026-11-10', startTime: '', paid: false, price: '' };
  it('accepts a free event with a cover and asks for what is missing', () => {
    expect(validateHostForm(ok, true, '2026-11-01')).toEqual({});
    expect(Object.keys(validateHostForm({ ...ok, title: 'ab', date: '' }, false, '2026-11-01')).sort()).toEqual(['cover', 'date', 'title']);
  });
  it('refuses past dates, bad times and a paid event without a price', () => {
    expect(validateHostForm({ ...ok, date: '2026-10-01' }, true, '2026-11-01').date).toMatch(/past/);
    expect(validateHostForm({ ...ok, startTime: '25:00' }, true, '2026-11-01').startTime).toBeDefined();
    expect(validateHostForm({ ...ok, paid: true, price: '0' }, true, '2026-11-01').price).toBeDefined();
    expect(validateHostForm({ ...ok, paid: true, price: '5000' }, true, '2026-11-01').price).toBeUndefined();
  });
  it('sorts by status', () => {
    expect(bucketOf('ONGOING')).toBe('live');
    expect(bucketOf('COMPLETED')).toBe('ended');
    expect(bucketOf('PUBLISHED')).toBe('upcoming');
  });
});
