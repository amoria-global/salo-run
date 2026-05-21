'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/app/lib/usePermissions';

/**
 * /user/team root — bounces to the first tab the caller can see.
 * Users gets priority over Roles gets priority over Permissions to
 * match the tab order in the layout.
 */
export default function TeamIndex() {
  const router = useRouter();
  const { loading, hasPermission, hasAny } = usePermissions();

  useEffect(() => {
    if (loading) return;
    if (hasPermission('users.view')) router.replace('/user/team/users');
    else if (hasPermission('roles.view')) router.replace('/user/team/roles');
    else if (hasAny(['roles.view', 'users.view'])) router.replace('/user/team/permissions');
    else router.replace('/');
  }, [loading, hasPermission, hasAny, router]);

  return <div style={{ padding: 24, color: '#6b7280' }}>Loading team…</div>;
}
