'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePermissions } from '@/app/lib/usePermissions';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

/**
 * Landing page for a denied {@link RouteGuard} bounce.
 *
 * Shows the specific permission(s) the original page required so the
 * user can ask the right owner / admin for them, plus the originating
 * URL and a back button. Owners only ever land here when a rule was
 * mis-configured (they hold every permission by design) - the page
 * still works for them and surfaces the misconfiguration.
 */
export default function NotAuthorizedPage() {
  const params = useSearchParams();
  const { roleName, organizationName, isOwner } = usePermissions();
  const required = (params.get('required') || '').split(',').filter(Boolean);
  const from = params.get('from') || '';
  const { active, switchTo } = useWorkspace();
  // Sent here from a shared workspace: money, account and notification pages are not part of it.
  const sharedWorkspace = required.includes('workspace');

  return (
    <main style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#fafafa',
    }}>
      <section style={{
        maxWidth: 520, width: '100%', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 14, padding: '32px 28px',
        boxShadow: '0 12px 30px -12px rgba(0,0,0,0.10)', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(242,12,143,0.10)', color: '#F20C8F',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 14,
        }} aria-hidden>
          <i className="bi bi-shield-lock" />
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>
          {sharedWorkspace ? 'Not available in a shared workspace' : "You don't have access to this page"}
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
          {sharedWorkspace
            ? <>You are working in {active ? <strong>{active.owner.name}</strong> : 'another photographer'}&apos;s workspace. The wallet page, withdrawals, transactions, account settings and notifications stay with its owner. Switch back to your own workspace to use them.</>
            : isOwner
            ? 'You are listed as an organization owner - this looks like a route configuration issue. Please contact support.'
            : <>Your current role <strong>{roleName || '-'}</strong>{organizationName ? <> in <strong>{organizationName}</strong></> : null} doesn&apos;t grant the permission this page requires.</>}
        </p>

        {!sharedWorkspace && required.length > 0 && (
          <div style={{
            marginTop: 18, padding: '12px 14px', background: '#f3f4f6', borderRadius: 8, textAlign: 'left',
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
              Required permission{required.length > 1 ? 's (any of)' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {required.map(r => (
                <code key={r} style={{
                  fontSize: 12, color: '#054d6f', background: '#eef6fb',
                  padding: '3px 9px', borderRadius: 999, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                }}>{r}</code>
              ))}
            </div>
          </div>
        )}

        {from && (
          <p style={{ marginTop: 14, fontSize: 12.5, color: '#9ca3af' }}>
            Tried to open <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{from}</code>
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 22 }}>
          {sharedWorkspace ? (
            <>
              <Link href="/user/photographer/dashboard" style={btnPrimary}>Workspace home</Link>
              <button type="button" onClick={() => switchTo(null)} style={btnSecondary}>Back to my workspace</button>
            </>
          ) : (
            <Link href="/" style={btnPrimary}>Go home</Link>
          )}
        </div>
      </section>
    </main>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '9px 18px', fontSize: 13.5, fontWeight: 600, borderRadius: 8,
  background: '#F20C8F', color: '#fff', textDecoration: 'none',
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 18px', fontSize: 13.5, fontWeight: 600, borderRadius: 8,
  background: '#fff', color: '#083A85', border: '1px solid #083A85', cursor: 'pointer',
};
