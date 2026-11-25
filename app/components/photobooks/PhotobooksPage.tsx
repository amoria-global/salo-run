'use client';

import PhotobooksShelf, { type PbRole } from './PhotobooksShelf';

/** The /photobooks page for a role: the same shelf as the Events area Photobooks tab, with its own header. */
export default function PhotobooksPage({ role }: { role: PbRole }) {
  return (
    <div className="gp-page">
      <PhotobooksShelf role={role} />
    </div>
  );
}
