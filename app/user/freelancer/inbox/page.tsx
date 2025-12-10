import { Suspense } from 'react';
import Inbox from '@/app/pages/photographers/inbox';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Inbox userType="freelancer" />
    </Suspense>
  );
}
