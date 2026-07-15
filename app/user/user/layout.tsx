'use client';

import { useEffect, useState } from 'react';
import PendingMilestonePaymentModal from '@/app/components/PendingMilestonePaymentModal';
import RouteGuard from '@/app/components/RouteGuard';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  useEffect(() => {
    setShowPaymentModal(true);
  }, []);
  return (
    <RouteGuard>
      {children}
      <PendingMilestonePaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </RouteGuard>
  );
}
