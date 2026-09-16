import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CONN-TEST-4: the KYC wizard sends exactly what the backend accepts.
 *
 * CONN-ONB-1 is why this exists. A KYC client called GET /customer/kyc when the
 * route is /customer/kyc/status, and posted idType, idNumber, idFront, idBack
 * and selfie to an endpoint that requires fullLegalName, gender, documentType,
 * challengeToken, selfiePhoto and governmentIdDocument. Every required field was
 * missing or misnamed, it shipped, and it produced real 404s in production.
 *
 * contract/api-contract.json is generated from the backend's controllers by
 * ApiContractTest in amoria-connect and copied here by its
 * scripts/sync-api-contract.sh.
 *
 * The requests are read out of KycVerificationModal.tsx itself: for each call,
 * its URL, its method, and the FormData fields appended to the body it sends,
 * counted from the `new FormData()` that body was created by. Rendering the
 * wizard would need a camera, liveness frames and a challenge token; reading the
 * source checks the same thing, the literal names on the wire, without them.
 */

type Field = { name: string; required: boolean; file?: boolean };
type Route = { method: string; path: string; params?: Field[]; parts?: Field[] };

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT = path.join(ROOT, 'contract/api-contract.json');
const routes: Route[] = JSON.parse(readFileSync(CONTRACT, 'utf8')).routes;
const MODAL = readFileSync(path.join(__dirname, 'KycVerificationModal.tsx'), 'utf8');

type SentRequest = { path: string; method: string; fields: string[] | null; line: number };

/** Every backend request the modal makes, as it would appear on the wire. */
function requestsInModal(): SentRequest[] {
    const found: SentRequest[] = [];
    const call = /dashboardAuthFetch\(\s*`\$\{apiUrl\}(\/api\/[^`]+)`\s*(,\s*\{)?/g;
    for (let m = call.exec(MODAL); m; m = call.exec(MODAL)) {
        const options = m[2] ? MODAL.slice(m.index, MODAL.indexOf('}', m.index + m[0].length) + 1) : '';
        const method = /method:\s*'([A-Z]+)'/.exec(options)?.[1] ?? 'GET';
        const bodyVar = /body:\s*([A-Za-z_]\w*)/.exec(options)?.[1];

        let fields: string[] | null = null;
        if (bodyVar) {
            const before = MODAL.slice(0, m.index);
            const declared = before.lastIndexOf(`const ${bodyVar} = new FormData()`);
            if (declared >= 0) {
                const built = before.slice(declared);
                const append = new RegExp(`\\b${bodyVar}\\.append\\(\\s*'([^']+)'`, 'g');
                fields = [...new Set([...built.matchAll(append)].map((a) => a[1]))];
            }
        }
        found.push({
            path: m[1],
            method,
            fields,
            line: MODAL.slice(0, m.index).split('\n').length,
        });
    }
    return found;
}

const sent = requestsInModal();

function routeFor(req: SentRequest): Route | undefined {
    return routes.find((r) => r.path === req.path && (r.method === req.method || r.method === 'ANY'));
}

const fieldsOf = (r: Route) => [...(r.params ?? []), ...(r.parts ?? [])];

describe('KYC wizard against the backend contract', () => {
    it('finds the requests it is meant to check', () => {
        // If the modal is refactored so these patterns no longer match, the
        // assertions below would pass vacuously. Fail loudly instead.
        expect(sent.map((r) => `${r.method} ${r.path}`).sort()).toEqual([
            'GET /api/remote/customer/kyc/status',
            'POST /api/remote/customer/kyc/challenge-token',
            'POST /api/remote/customer/kyc/submit',
            'POST /api/remote/customer/kyc/validate-doc-side',
            'POST /api/remote/customer/kyc/validate-doc-type',
        ]);
    });

    it.each(sent.map((r) => [`${r.method} ${r.path}`, r] as const))('%s exists on the backend', (_label, req) => {
        expect(routeFor(req), `line ${req.line}: the backend has no ${req.method} ${req.path}`).toBeDefined();
    });

    it.each(sent.filter((r) => r.fields).map((r) => [`${r.method} ${r.path}`, r] as const))(
        '%s sends every required field',
        (_label, req) => {
            const required = fieldsOf(routeFor(req)!).filter((f) => f.required).map((f) => f.name);
            const missing = required.filter((name) => !req.fields!.includes(name));
            expect(missing, `line ${req.line}: the backend rejects a request without these`).toEqual([]);
        },
    );

    it.each(sent.filter((r) => r.fields).map((r) => [`${r.method} ${r.path}`, r] as const))(
        '%s sends no field the backend does not read',
        (_label, req) => {
            // A misnamed OPTIONAL field fails silently: the backend ignores it and
            // the data is lost. CONN-ONB-1's idBack was exactly this kind of name.
            const known = fieldsOf(routeFor(req)!).map((f) => f.name);
            const unknown = req.fields!.filter((name) => !known.includes(name));
            expect(unknown, `line ${req.line}: the backend ignores these names`).toEqual([]);
        },
    );

    it('submit carries the files under the part names the backend binds', () => {
        const submit = sent.find((r) => r.path.endsWith('/kyc/submit'))!;
        const fileParts = fieldsOf(routeFor(submit)!).filter((f) => f.file && f.required).map((f) => f.name);
        expect(fileParts).toEqual(expect.arrayContaining(['selfiePhoto', 'governmentIdDocument']));
        expect(submit.fields).toEqual(expect.arrayContaining(fileParts));
    });

    it.skipIf(!existsSync(path.join(ROOT, '../amoria-connect/src/test/resources/contract/api-contract.json')))(
        'this copy of the contract matches the backend checked out next to it',
        () => {
            // Monorepo machines only; skipped in CI, where the backend is elsewhere.
            const backend = readFileSync(
                path.join(ROOT, '../amoria-connect/src/test/resources/contract/api-contract.json'),
                'utf8',
            );
            expect(readFileSync(CONTRACT, 'utf8') === backend, 'run amoria-connect/scripts/sync-api-contract.sh').toBe(
                true,
            );
        },
    );
});
