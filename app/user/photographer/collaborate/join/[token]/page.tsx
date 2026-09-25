"use client";

import { useParams } from 'next/navigation';
import JoinInvite from '@/app/pages/photographer/collaborate/JoinInvite';

export default function Page() {
  const { token } = useParams<{ token: string }>();
  return <JoinInvite token={decodeURIComponent(token)} />;
}
