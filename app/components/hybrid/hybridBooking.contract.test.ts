import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');

describe('Hybrid Booking Web Suite', () => {
  const CONTRACT_PATH = path.join(ROOT, 'contract/api-contract.json');
  const API_CODE_PATH = path.join(ROOT, 'app/lib/hybridBooking.ts');

  it('contract file exists', () => {
    expect(existsSync(CONTRACT_PATH)).toBe(true);
  });

  it('all 8 hybrid backend endpoints exist in the api-contract.json', () => {
    const raw = readFileSync(CONTRACT_PATH, 'utf8');
    const contract = JSON.parse(raw);
    const endpoints = (contract.routes || []).map((r: any) => `${r.method} ${r.path}`);

    const expectedHybridEndpoints = [
      'POST /api/remote/events/match-preview',
      'POST /api/remote/events/{id}/match-request',
      'GET /api/remote/photographer/opportunities',
      'POST /api/remote/opportunities/{candidateId}/approve',
      'POST /api/remote/opportunities/{candidateId}/reject',
      'GET /api/remote/events/{id}/candidates',
      'POST /api/remote/events/{id}/select-photographer',
      'POST /api/remote/events/{id}/convert-to-hybrid',
    ];

    for (const expected of expectedHybridEndpoints) {
      expect(endpoints, `Missing endpoint in contract: ${expected}`).toContain(expected);
    }
  });

  it('app/lib/hybridBooking.ts routes to each hybrid endpoint', () => {
    const apiCode = readFileSync(API_CODE_PATH, 'utf8');

    expect(apiCode).toContain('/events/match-preview');
    expect(apiCode).toContain('/match-request');
    expect(apiCode).toContain('/photographer/opportunities');
    expect(apiCode).toContain('/approve');
    expect(apiCode).toContain('/reject');
    expect(apiCode).toContain('/candidates');
    expect(apiCode).toContain('/select-photographer');
    expect(apiCode).toContain('/convert-to-hybrid');
    expect(apiCode).toContain('NO_LONGER_AVAILABLE');
  });

  it('every hybrid call goes to a route the backend has, under /api/remote', () => {
    // The proxy only forwards api/remote/ paths; these calls once used
    // `${base}/events/...` and every one was refused with a 403.
    const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
    const templates = (contract.routes || []).map((r: any) => ({
      method: r.method,
      regex: new RegExp('^' + r.path.split(/\{[^}]*\}/).map((x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+') + '$'),
    }));
    const src = readFileSync(API_CODE_PATH, 'utf8');
    const calls: string[] = [];
    const re = /\bcall(?:<.*?>)?\(\s*[`'"]([^`'"]+)[`'"],\s*\{\s*method:\s*'([A-Z]+)'/g;
    for (let m = re.exec(src); m; m = re.exec(src)) {
      calls.push(`${m[2]} /api/remote${m[1].replace(/\$\{[^}]*\}/g, 'X')}`);
    }
    // The prefix added above has to be the one the module actually sends.
    expect(src).toContain('`${getApiUrl()}/api/remote${path}`');
    expect(calls.length).toBeGreaterThanOrEqual(9);
    const missing = calls.filter((c) => {
      const [method, path] = c.split(' ');
      return !templates.some((t: any) => (t.method === method || t.method === 'ANY') && t.regex.test(path));
    });
    expect(missing).toEqual([]);
  });

  it('the hybrid wizard creates its event through the proxy-allowed booking route', () => {
    const wizard = readFileSync(path.join(ROOT, 'app/components/hybrid/HybridEventWizardModal.tsx'), 'utf8');
    expect(wizard).toContain('/api/remote/customer/events/book');
    expect(wizard).not.toMatch(/\$\{base\}\/events[`'"]/);
  });

  it('hybrid web components exist', () => {
    expect(existsSync(path.join(ROOT, 'app/components/hybrid/BookingModeSelectorModal.tsx'))).toBe(true);
    expect(existsSync(path.join(ROOT, 'app/components/hybrid/HybridEventWizardModal.tsx'))).toBe(true);
    expect(existsSync(path.join(ROOT, 'app/components/hybrid/CandidatesShortlistModal.tsx'))).toBe(true);
    expect(existsSync(path.join(ROOT, 'app/components/hybrid/PhotographerOpportunitiesView.tsx'))).toBe(true);
  });
});
