"use client";

import { useParams } from 'next/navigation';
import JoinedAlbum from '@/app/pages/photographer/collaborate/JoinedAlbum';
import CollabShell from '@/app/components/collab/CollabShell';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CollabShell><JoinedAlbum albumId={id} /></CollabShell>;
}
