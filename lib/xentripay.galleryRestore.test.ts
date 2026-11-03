import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a) }));
vi.mock('./api', () => ({ getApiUrl: () => 'https://api.test' }));

import { initiateGalleryRestorePayment } from './xentripay';

beforeEach(() => fetchMock.mockReset());
const reply = (json: unknown) => fetchMock.mockResolvedValue({ json: async () => json });

describe('initiateGalleryRestorePayment', () => {
  it('posts to the album and never sends an amount', async () => {
    reply({ action: 1, message: 'ok', data: { refid: 'R1', tid: 'R1', paymentUrl: null, status: 'PENDING' } });
    const r = await initiateGalleryRestorePayment('g1', '0788000000', 'MTN', 'MOBILE_MONEY', undefined, 'RW');
    expect(r.success).toBe(true);
    expect(r.data?.refid).toBe('R1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/api/remote/photographer/albums/g1/restore-payment');
    const body = JSON.parse(init.body);
    expect(body).toEqual({ paymentMethod: 'MOBILE_MONEY', phone: '0788000000', telecomProvider: 'MTN', country: 'RW' });
    expect(Object.keys(body)).not.toContain('amount');
  });

  it('reports a refusal with the server message', async () => {
    reply({ action: 0, message: 'A restore payment for this album is already in progress. Check your phone before trying again.' });
    const r = await initiateGalleryRestorePayment('g1', '0788', 'MTN', 'MOBILE_MONEY');
    expect(r.success).toBe(false);
    expect(r.error).toContain('already in progress');
  });

  it('keeps the ambiguous-outcome message, which must not read as a plain failure to retry', async () => {
    reply({ action: 0, code: 'AMBIGUOUS', message: 'We could not confirm whether the payment prompt was sent. Check your phone before trying again.' });
    const r = await initiateGalleryRestorePayment('g1', '0788', 'MTN', 'MOBILE_MONEY');
    expect(r.error).toContain('Check your phone');
  });
});
