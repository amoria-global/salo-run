'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '../lib/usePermissions';

/**
 * Forced-password-change gate.
 *
 * Wires the backend's `mustChangePassword` flag (returned by
 * /api/remote/team/me/permissions for any Customer whose
 * isPasswordChanged is false) into a global redirect to
 * /user/auth/change-password.
 *
 * Mounted once at the root layout under PermissionProvider so
 * EVERY dashboard route is covered without per-page glue.
 *
 * Exemptions:
 *   • /user/auth/* - the change-password page itself, and login/reset.
 *   • Permission load still in flight - we wait so an owner doesn't
 *     get a flash redirect.
 */
export default function PasswordChangeGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, mustChangePassword } = usePermissions();

  useEffect(() => {
    if (loading) return;
    if (!mustChangePassword) return;
    if (!pathname) return;
    // Already on an auth page (login, reset, change-password itself).
    if (pathname.startsWith('/user/auth/')) return;
    router.replace('/user/auth/change-password');
  }, [loading, mustChangePassword, pathname, router]);

  return null;
}
