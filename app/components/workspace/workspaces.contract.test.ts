import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every call the Workspace access client makes must hit a route the backend has, with the method it has. The contract
 * file is generated from the backend controllers (ApiContractTest) and copied here, so a renamed or removed route
 * fails this test instead of producing a 404 in production.
 */
const ROOT = path.resolve(__dirname, '../../..');
const contract = JSON.parse(readFileSync(path.join(ROOT, 'contract/api-contract.json'), 'utf8')) as { routes: { method: string; path: string }[] };
const templates = contract.routes.map((r) => ({
  method: r.method,
  regex: new RegExp('^' + r.path.split(/\{[^}]*\}/).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+') + '$'),
}));

const src = readFileSync(path.join(ROOT, 'app/lib/APIs/workspaces.ts'), 'utf8').replace(/\r\n/g, '\n');

/** Verb + concrete path (query and template holes replaced), as it hits the wire. */
const calls: { method: string; path: string }[] = [];
const re = /call<[^]*?>\(\s*(`[^`]*`|'[^']*')\s*(?:,\s*json\('([A-Z]+)')?/g;
for (let m = re.exec(src); m; m = re.exec(src)) {
  const raw = m[1].slice(1, -1).replace(/\$\{[^}]*\}/g, 'X').replace(/\?.*$/, '');
  calls.push({ method: m[2] ?? 'GET', path: '/api/remote/photographer/workspaces' + raw });
}

describe('workspace invitations client against the backend contract', () => {
  it('finds both sides of the workflow', () => {
    const paths = calls.map((c) => `${c.method} ${c.path}`);
    for (const expected of [
      'GET /api/remote/photographer/workspaces/lookup',
      'GET /api/remote/photographer/workspaces/sent',
      'POST /api/remote/photographer/workspaces/invitations',
      'POST /api/remote/photographer/workspaces/invitations/X/resend',
      'DELETE /api/remote/photographer/workspaces/invitations/X',
      'POST /api/remote/photographer/workspaces/invitations/X/revoke',
      'GET /api/remote/photographer/workspaces/received',
      'POST /api/remote/photographer/workspaces/received/X/accept',
      'POST /api/remote/photographer/workspaces/received/X/decline',
      'POST /api/remote/photographer/workspaces/received/X/leave',
      'GET /api/remote/photographer/workspaces/mine',
    ]) {
      expect(paths, expected).toContain(expected);
    }
  });

  it('every workspace call exists on the backend with that method', () => {
    const missing = calls.filter((c) => !templates.some((t) => t.method === c.method && t.regex.test(c.path))).map((c) => `${c.method} ${c.path}`);
    expect(missing).toEqual([]);
  });
});
