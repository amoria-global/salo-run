'use client';

import GlassMyEvents from './GlassMyEvents';

/** Coordinator "My events" in Compact Glass: the shared view with this role's actions. */
export default function GlassCoordinatorEvents({ ctl, modals }: { ctl: unknown; modals: React.ReactNode }) {
  return <GlassMyEvents ctl={ctl} modals={modals} role="event-coordinator" />;
}
