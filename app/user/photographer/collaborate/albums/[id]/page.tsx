"use client";

import { useParams } from 'next/navigation';
import OwnerAlbum from '@/app/pages/photographer/collaborate/OwnerAlbum';
import CollabShell from '@/app/components/collab/CollabShell';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <CollabShell><OwnerAlbum albumId={id} /></CollabShell>;
}
