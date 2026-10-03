import { Suspense } from 'react';
import CollaborateHub from '@/app/pages/photographer/collaborate/CollaborateHub';
import CollabShell from '@/app/components/collab/CollabShell';

export default function Page() {
  return (
    <Suspense>
      <CollabShell>
        <CollaborateHub />
      </CollabShell>
    </Suspense>
  );
}
