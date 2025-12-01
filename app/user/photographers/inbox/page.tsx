import { Suspense } from 'react';
import Inbox from '../../../pages/photographers/inbox';

export default function InboxPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Inbox />
    </Suspense>
  );
}
