import React, { Suspense } from 'react';
import PhotographerOpportunitiesPage from '@/app/pages/photographer/opportunities';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PhotographerOpportunitiesPage />
    </Suspense>
  );
}
