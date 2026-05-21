'use client';

import { useEffect, useState } from 'react';
import PendingMilestonePaymentModal from '@/app/components/PendingMilestonePaymentModal';
import RouteGuard from '@/app/components/RouteGuard';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Show modal on page load (every navigation)
  useEffect(() => {
    setShowPaymentModal(true);
  }, []);

  // RouteGuard consults ROUTE_RULES and bounces restricted team
  // members to /user/not-authorized when the current pathname
  // requires permissions they don't hold. Owners pass every gate.
  return (
    <RouteGuard>
      {children}
      <PendingMilestonePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </RouteGuard>
  );
}
