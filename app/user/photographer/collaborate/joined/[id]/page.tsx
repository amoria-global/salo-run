"use client";

import { useParams } from 'next/navigation';
import JoinedAlbum from '@/app/pages/photographer/collaborate/JoinedAlbum';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <JoinedAlbum albumId={id} />;
}
