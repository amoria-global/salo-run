'use client';

import GlassMyEvents from './GlassMyEvents';

/** Client "My events" in Compact Glass: the shared view with this role's actions. */
export default function GlassClientEvents({ ctl, modals }: { ctl: unknown; modals: React.ReactNode }) {
  return <GlassMyEvents ctl={ctl} modals={modals} role="client" />;
}
