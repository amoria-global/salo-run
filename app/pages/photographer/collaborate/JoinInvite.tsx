"use client";

/**
 * Where an invite link lands. Shows whose album it is and what joining
 * means before the photographer commits, then accepts and opens the
 * album. Every state the backend reports gets its own honest screen.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Skeleton } from '@/app/components/ui';
import { AlbumCover, PersonChip } from '@/app/components/collab/parts';
import { acceptInvite, previewInvite, type InvitePreview } from '@/app/lib/APIs/collab';

const BLOCKED: Record<string, { icon: string; title: string; body: string }> = {
  OWNER: { icon: 'bi-person-check', title: 'This is your own album', body: 'Send this link to the photographers you want to invite. Any number of them can join with it.' },
  REMOVED: { icon: 'bi-person-dash', title: 'You were removed from this album', body: 'The album owner removed you after this link was made. Ask them for a new link to rejoin.' },
  REVOKED: { icon: 'bi-slash-circle', title: 'This link was cancelled', body: 'The album owner cancelled it. Ask them for a new one if you should still join.' },
  EXPIRED: { icon: 'bi-clock', title: 'This link has expired', body: 'Invite links last 14 days. Ask the album owner for a new one.' },
};

export default function JoinInvite({ token }: { token: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    previewInvite(token).then(setPreview).catch((e) => setError(e instanceof Error ? e.message : 'This invite link is not valid'));
  }, [token]);

  const join = async () => {
    setJoining(true); setError(null);
    try {
      const album = await acceptInvite(token);
      router.replace(`/user/photographer/collaborate/joined/${album.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join this album');
      setJoining(false);
    }
  };

  const blocked = preview ? BLOCKED[preview.state] : undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card padding={0} className="w-full max-w-md overflow-hidden">
        {!preview && !error ? (
          <div aria-busy="true" aria-label="Loading invite">
            <Skeleton height={176} rounded={0} />
            <div className="space-y-3 p-6"><Skeleton height={22} width="80%" /><Skeleton height={14} width="60%" /><Skeleton height={44} rounded={999} /></div>
          </div>
        ) : !preview ? (
          <Blocked icon="bi-link-45deg" title="This invite link does not work" body={error ?? ''} />
        ) : blocked ? (
          <Blocked {...blocked} />
        ) : (
          <>
            <div className="relative h-44 bg-[var(--ck-surface-muted)]">
              <AlbumCover src={preview.album.coverImage} title={preview.album.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <p className="absolute bottom-3 left-5 right-5 truncate text-lg font-bold text-white">{preview.album.title}</p>
            </div>
            <div className="space-y-5 p-6">
              <PersonChip person={preview.owner} caption="invited you to collaborate on this album" />
              <ul className="space-y-2.5 text-sm text-[var(--ck-text)]">
                <Point icon="bi-cloud-arrow-up">You can submit your photos to this album.</Point>
                <Point icon="bi-check2-circle">{preview.owner.name} reviews each one and decides what is added.</Point>
                <Point icon="bi-shield-lock">You do not get access to their dashboard, clients or earnings, and they do not get access to yours.</Point>
              </ul>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              {preview.state === 'ALREADY_MEMBER' ? (
                <Link href={`/user/photographer/collaborate/joined/${preview.album.id}`}><Button fullWidth size="lg">Open album</Button></Link>
              ) : (
                <Button fullWidth size="lg" loading={joining} onClick={join}>Join album</Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Point({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <i className={`bi ${icon} mt-0.5 text-[#083A85]`} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function Blocked({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="space-y-4 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#083A85]/10 text-2xl text-[#083A85]">
        <i className={`bi ${icon}`} aria-hidden />
      </div>
      <h1 className="text-lg font-bold text-[var(--ck-text)]">{title}</h1>
      <p className="text-sm text-[var(--ck-text-soft)]">{body}</p>
      <Link href="/user/photographer/collaborate"><Button variant="soft">Go to Collaborate</Button></Link>
    </div>
  );
}
