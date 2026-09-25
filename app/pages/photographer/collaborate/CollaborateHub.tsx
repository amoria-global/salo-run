"use client";

/**
 * Collaborate hub. Two sides of one feature:
 *  - My albums: albums this photographer owns, how many collaborators each
 *    has and how many submitted photos wait for review.
 *  - Joined: albums other photographers invited them to, with how their
 *    own submissions stand.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, EmptyState, PageHeader, Search, Skeleton, Tabs } from '@/app/components/ui';
import { AlbumCover, JoinWithLinkModal, PersonChip, Stat } from '@/app/components/collab/parts';
import { listJoinedAlbums, listOwnedAlbums, type JoinedAlbum, type OwnedAlbum } from '@/app/lib/APIs/collab';

type TabKey = 'mine' | 'joined';

export default function CollaborateHub() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<TabKey>(params?.get('tab') === 'joined' ? 'joined' : 'mine');
  const [owned, setOwned] = useState<OwnedAlbum[] | null>(null);
  const [joined, setJoined] = useState<JoinedAlbum[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [o, j] = await Promise.all([listOwnedAlbums(), listJoinedAlbums()]);
      setOwned(o);
      setJoined(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your albums');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const switchTab = (key: string) => {
    setTab(key as TabKey);
    router.replace(`/user/photographer/collaborate${key === 'joined' ? '?tab=joined' : ''}`, { scroll: false });
  };

  const q = query.trim().toLowerCase();
  const ownedSorted = useMemo(() => (owned ?? [])
    .filter((a) => !q || a.title?.toLowerCase().includes(q))
    // Albums with photos to review first, then ones with collaborators.
    .sort((a, b) => (b.pendingCount - a.pendingCount) || (b.collaboratorCount - a.collaboratorCount)), [owned, q]);
  const joinedFiltered = useMemo(() => (joined ?? [])
    .filter((a) => !q || a.title?.toLowerCase().includes(q) || a.owner?.name?.toLowerCase().includes(q)), [joined, q]);

  const toReview = (owned ?? []).reduce((n, a) => n + a.pendingCount, 0);
  const collaborators = (owned ?? []).reduce((n, a) => n + a.collaboratorCount, 0);
  const loading = owned === null || joined === null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Collaborate"
        title="Work on albums together"
        subtitle="Invite fellow photographers to an album. They submit photos, and you choose what goes in."
        actions={<Button variant="soft" onClick={() => setJoinOpen(true)} iconLeft={<i className="bi bi-box-arrow-in-right" aria-hidden />}>Join with a link</Button>}
      />

      {!loading && !error && (
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-5 py-3.5">
          <Stat value={toReview} label={toReview === 1 ? 'photo to review' : 'photos to review'} tone="accent" />
          <Stat value={collaborators} label={collaborators === 1 ? 'collaborator' : 'collaborators'} />
          <Stat value={joined?.length ?? 0} label={(joined?.length ?? 0) === 1 ? 'album joined' : 'albums joined'} />
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { key: 'mine', label: 'My albums', count: owned?.length },
            { key: 'joined', label: 'Joined', count: joined?.length },
          ]}
          active={tab}
          onChange={switchTab}
        />
        <div className="w-full sm:w-72">
          <Search value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} aria-label="Search albums" placeholder={tab === 'mine' ? 'Search your albums' : 'Search albums or owners'} />
        </div>
      </div>

      {error ? (
        <Card>
          <EmptyState
            icon={<i className="bi bi-wifi-off" aria-hidden />}
            title="Could not load your albums"
            description={error}
            action={<Button onClick={load}>Try again</Button>}
          />
        </Card>
      ) : loading ? (
        <GridSkeleton />
      ) : tab === 'mine' ? (
        ownedSorted.length === 0 ? (
          <Card>
            <EmptyState
              icon={<i className="bi bi-images" aria-hidden />}
              title={q ? 'No album matches that search' : 'You have no albums yet'}
              description={q ? undefined : 'Create an album from Events. Then come back here to invite photographers to it.'}
              action={q ? undefined : <Link href="/user/photographer/events"><Button>Go to Events</Button></Link>}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownedSorted.map((a) => <OwnedAlbumCard key={a.id} album={a} />)}
          </div>
        )
      ) : joinedFiltered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<i className="bi bi-people" aria-hidden />}
            title={q ? 'No album matches that search' : 'You have not joined any albums'}
            description={q ? undefined : 'When a photographer sends you an invite link, open it or paste it here to start submitting photos.'}
            action={q ? undefined : <Button onClick={() => setJoinOpen(true)}>Join with a link</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {joinedFiltered.map((a) => <JoinedAlbumCard key={a.id} album={a} />)}
        </div>
      )}

      <JoinWithLinkModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}

function OwnedAlbumCard({ album }: { album: OwnedAlbum }) {
  return (
    <Link
      href={`/user/photographer/collaborate/albums/${album.id}`}
      className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85] focus-visible:ring-offset-2"
    >
      <Card hover padding={0} className="overflow-hidden">
        <div className="relative aspect-[16/9] bg-[var(--ck-surface-muted)]">
          <AlbumCover src={album.coverImage} title={album.title} />
          {album.pendingCount > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-[#F20C8F] px-2.5 py-1 text-xs font-bold text-white shadow">
              {album.pendingCount} to review
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="truncate text-base font-semibold text-[var(--ck-text)]">{album.title || 'Untitled album'}</h3>
          <div className="flex items-center justify-between text-sm text-[var(--ck-text-soft)]">
            <span><i className="bi bi-image mr-1.5" aria-hidden />{album.imageCount} photos</span>
            <span>
              <i className="bi bi-people mr-1.5" aria-hidden />
              {album.collaboratorCount === 0 ? 'No collaborators' : `${album.collaboratorCount} collaborator${album.collaboratorCount === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function JoinedAlbumCard({ album }: { album: JoinedAlbum }) {
  const { pending, approved, rejected } = album.counts;
  return (
    <Link
      href={`/user/photographer/collaborate/joined/${album.id}`}
      className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85] focus-visible:ring-offset-2"
    >
      <Card hover padding={0} className="overflow-hidden">
        <div className="relative aspect-[16/9] bg-[var(--ck-surface-muted)]">
          <AlbumCover src={album.coverImage} title={album.title} />
        </div>
        <div className="space-y-3 p-4">
          <h3 className="truncate text-base font-semibold text-[var(--ck-text)]">{album.title || 'Untitled album'}</h3>
          <PersonChip person={album.owner} caption="Album owner" />
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--ck-stroke-soft)] pt-3 text-xs">
            <span className="text-amber-600"><b>{pending}</b> waiting</span>
            <span className="text-emerald-600"><b>{approved}</b> added</span>
            <span className="text-[var(--ck-text-soft)]"><b>{rejected}</b> not accepted</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading albums">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} padding={0} className="overflow-hidden">
          <Skeleton height={180} rounded={0} />
          <div className="space-y-2 p-4">
            <Skeleton height={18} width="70%" />
            <Skeleton height={14} width="45%" />
          </div>
        </Card>
      ))}
    </div>
  );
}
