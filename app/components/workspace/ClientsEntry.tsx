'use client';

import React from 'react';
import Clients from '@/app/pages/photographer/clients';
import SharedClients from './SharedClients';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

/** The owner's Clients page for their own workspace; the money-free list inside a shared one. */
export default function ClientsEntry() {
  const { isShared } = useWorkspace();
  return isShared ? <SharedClients /> : <Clients />;
}
