import { Suspense } from 'react';
import InboxPage from '@/app/pages/client/inbox';

export default function Page() {
  return (
    <Suspense>
      <InboxPage />
    </Suspense>
  );
}
