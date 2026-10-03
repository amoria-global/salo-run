"use client";

import { useParams } from 'next/navigation';
import JoinInvite from '@/app/pages/photographer/collaborate/JoinInvite';
import CollabShell from '@/app/components/collab/CollabShell';

export default function Page() {
  const { token } = useParams<{ token: string }>();
  return <CollabShell><JoinInvite token={decodeURIComponent(token)} /></CollabShell>;
}
