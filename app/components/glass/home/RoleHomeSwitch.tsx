'use client';

import dynamic from 'next/dynamic';
import { useUiGlass } from '@/app/lib/useUiGlass';

const RoleHome = dynamic(() => import('./RoleHome'), {
  ssr: false,
  loading: () => <div className="gh" aria-busy="true"><div className="g-skeleton" style={{ height: 220 }} /></div>,
});

/** The client or coordinator Home: Compact Glass under the flag, the old page unchanged otherwise. */
export default function RoleHomeSwitch({ role, children }: { role: 'client' | 'event-coordinator'; children: React.ReactNode }) {
  const glass = useUiGlass();
  if (glass) return <RoleHome role={role} />;
  return <div className="ck-classic-only" style={{ display: 'contents' }}>{children}</div>;
}
