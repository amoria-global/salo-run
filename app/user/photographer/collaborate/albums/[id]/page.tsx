"use client";

import { useParams } from 'next/navigation';
import OwnerAlbum from '@/app/pages/photographer/collaborate/OwnerAlbum';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <OwnerAlbum albumId={id} />;
}
