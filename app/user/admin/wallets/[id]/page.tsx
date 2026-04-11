'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AdminWalletDetail from '@/app/pages/admin/wallet-detail';

export default function Page() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return null;
  return <AdminWalletDetail walletId={id} />;
}
