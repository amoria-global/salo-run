"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ChatRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Forward all params to the inbox page
    const params = new URLSearchParams(searchParams.toString());
    router.replace(`/user/client/inbox?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}

export default function Page() {
  return (
    <Suspense>
      <ChatRedirect />
    </Suspense>
  );
}
