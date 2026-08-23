'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/lib/usePermissions';
import { getApiUrl } from '@/lib/api';

/**
 * Forced first-login password-change page.
 *
 * Reached when:
 *   • An invited team member signs in with the temp password from
 *     their invitation email - TeamService persists them with
 *     isPasswordChanged=false so the backend tells the frontend
 *     mustChangePassword=true via /api/remote/team/me/permissions.
 *   • PasswordChangeGate (in the root layout) catches that flag and
 *     replaces the URL with this page.
 *
 * Backend endpoint: POST /api/remote/auth/set-new-password
 * Body: { email, password, confirmPassword }. Side effect: sets
 * isPasswordChanged=true on the Customer.
 *
 * After success we refresh the permissions cache (so the gate stops
 * firing) and push the user to their role's home.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useDashboardAuth();
  const { refresh } = usePermissions();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Mirrors the server policy (letter + digit + symbol) so the form never
    // accepts something the backend will reject.
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@!#$%^&*=+]).{8,}$/.test(password || '')) { setError('Use at least 8 characters, including a letter, a number and one of @!#$%^&*=+'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!user?.email) { setError('Session missing email. Please sign out and back in.'); return; }
    setBusy(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/remote/auth/set-new-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password, confirmPassword: confirm }),
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({} as Record<string, unknown>));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = body;
      if (!res.ok || b.action === 0) {
        throw new Error(b.message || `Failed (HTTP ${res.status})`);
      }
      await refresh();
      const type = (user.customerType || '').toUpperCase();
      const home =
        type === 'PHOTOGRAPHER' || type === 'VIDEOGRAPHER' ? '/user/photographer/dashboard' :
        type === 'EVENT_COORDINATOR' ? '/user/event-coordinator/home' :
        '/user/client/home';
      router.replace(home);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#fafafa',
    }}>
      <section style={{
        maxWidth: 440, width: '100%', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 14, padding: '32px 28px',
        boxShadow: '0 12px 30px -12px rgba(0,0,0,0.10)',
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
          Set a new password
        </h1>
        <p style={{ margin: '8px 0 18px', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>
          You signed in with a temporary password from your invitation email.
          Choose your own password to continue.
        </p>

        <form onSubmit={onSubmit} autoComplete="off">
          <label style={lbl}>Email
            <input type="email" value={user?.email || ''} disabled style={{ ...inp, background: '#f3f4f6', color: '#6b7280' }} />
          </label>
          <label style={lbl}>New password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
              minLength={8}
              autoComplete="new-password"
              style={inp}
              placeholder="8+ chars, a letter, a number and a symbol"
            />
          </label>
          <label style={lbl}>Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={inp}
              placeholder="Type it again"
            />
          </label>

          {error && (
            <div style={{
              padding: 10, marginTop: 8, borderRadius: 6,
              background: '#fef2f2', color: '#991b1b', fontSize: 13, border: '1px solid #fecaca',
            }}>{error}</div>
          )}

          <button type="submit" disabled={busy} style={{
            marginTop: 16, width: '100%',
            padding: '11px 16px', fontSize: 14, fontWeight: 700, borderRadius: 8,
            background: '#F20C8F', color: '#fff', border: 'none',
            cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.65 : 1,
          }}>
            {busy ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </section>
    </main>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151',
  marginTop: 12,
};
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
  border: '1px solid #e5e7eb', outline: 'none', marginTop: 4,
};
