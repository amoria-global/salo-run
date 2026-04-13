'use client';

import { useEffect, useState } from 'react';
import PendingMilestonePaymentModal from '@/app/components/PendingMilestonePaymentModal';

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

  return (
    <>
      {children}
      <PendingMilestonePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </>
  );
}
