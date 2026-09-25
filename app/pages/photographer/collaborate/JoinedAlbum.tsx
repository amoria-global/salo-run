"use client";

/**
 * A collaborator's workspace for an album someone else owns. They drop
 * photos in, each one waits for the owner's decision, and they can follow
 * what was added or not accepted (with the owner's note). They never see
 * or change the owner's album itself.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, EmptyState, Modal, Skeleton } from '@/app/components/ui';
import { AlbumCover, PersonChip, StatusBadge, timeAgo } from '@/app/components/collab/parts';
import {
  getJoinedAlbum, leaveAlbum, submitPhoto, withdrawSubmission,
  type JoinedAlbumDetail, type SubmissionStatus,
} from '@/app/lib/APIs/collab';

type Filter = 'ALL' | SubmissionStatus;
type QueueItem = { key: string; file: File; state: 'waiting' | 'uploading' | 'done' | 'failed'; error?: string };

const MAX_BYTES = 25 * 1024 * 1024;
const PARALLEL = 3;

export default function JoinedAlbum({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [data, setData] = useState<JoinedAlbumDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getJoinedAlbum(albumId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this album');
    }
  }, [albumId]);

  useEffect(() => { load(); }, [load]);

  const setItem = (key: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const addFiles = async (files: FileList | File[]) => {
    const items: QueueItem[] = Array.from(files).map((file, i) => {
      const key = `${Date.now()}-${i}-${file.name}`;
      if (!file.type.startsWith('image/')) return { key, file, state: 'failed', error: 'Not a photo' };
      if (file.size > MAX_BYTES) return { key, file, state: 'failed', error: 'Larger than 25 MB' };
      return { key, file, state: 'waiting' };
    });
    setQueue((q) => [...items, ...q]);

    const todo = items.filter((it) => it.state === 'waiting');
    let next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const it = todo[next++];
        setItem(it.key, { state: 'uploading' });
        try {
          await submitPhoto(albumId, it.file);
          setItem(it.key, { state: 'done' });
        } catch (e) {
          setItem(it.key, { state: 'failed', error: e instanceof Error ? e.message : 'Upload failed' });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, todo.length) }, worker));
    if (todo.length > 0) await load();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const withdraw = async (id: string) => {
    setBusy(true);
    try { await withdrawSubmission(id); await load(); } catch { /* the list reload shows the truth */ } finally { setBusy(false); }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await leaveAlbum(albumId);
      router.push('/user/photographer/collaborate?tab=joined');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not leave this album');
      setBusy(false);
    }
  };

  const subs = useMemo(() => data?.submissions ?? [], [data]);
  const counts = useMemo(() => ({
    ALL: subs.length,
    PENDING: subs.filter((s) => s.status === 'PENDING').length,
    APPROVED: subs.filter((s) => s.status === 'APPROVED').length,
    REJECTED: subs.filter((s) => s.status === 'REJECTED').length,
  }), [subs]);
  const shown = filter === 'ALL' ? subs : subs.filter((s) => s.status === filter);
  const uploading = queue.filter((q) => q.state === 'uploading' || q.state === 'waiting').length;
  const done = queue.filter((q) => q.state === 'done').length;
  const failed = queue.filter((q) => q.state === 'failed');

  if (error && !data) {
    return (
      <Shell>
        <Card>
          <EmptyState icon={<i className="bi bi-lock" aria-hidden />} title="You cannot open this album"
            description={error}
            action={<Link href="/user/photographer/collaborate?tab=joined"><Button>Back to joined albums</Button></Link>} />
        </Card>
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell>
        <div aria-busy="true" aria-label="Loading album" className="space-y-4">
          <Skeleton height={80} rounded={16} />
          <Skeleton height={160} rounded={16} />
        </div>
      </Shell>
    );
  }

  const { album, owner } = data;

  return (
    <Shell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--ck-surface-muted)]">
          <AlbumCover src={album.coverImage} title={album.title} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#F20C8F]">Collaborating</p>
            <h1 className="truncate text-2xl font-bold text-[var(--ck-text)]">{album.title || 'Untitled album'}</h1>
          </div>
          <PersonChip person={owner} caption="Owns this album and reviews what you submit" />
        </div>
        <Button variant="ghost" onClick={() => setLeaveOpen(true)} iconLeft={<i className="bi bi-box-arrow-right" aria-hidden />}>
          Leave album
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mb-6 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${dragging
          ? 'border-[#F20C8F] bg-[#F20C8F]/5' : 'border-[var(--ck-stroke)] bg-[var(--ck-surface)]'}`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#083A85]/10 text-xl text-[#083A85]">
          <i className="bi bi-cloud-arrow-up" aria-hidden />
        </div>
        <p className="text-base font-semibold text-[var(--ck-text)]">Drop photos here to submit them</p>
        <p className="mb-4 text-sm text-[var(--ck-text-soft)]">JPEG, PNG, WebP or HEIC, up to 25 MB each. {owner.name} decides what goes in.</p>
        <Button onClick={() => inputRef.current?.click()} iconLeft={<i className="bi bi-plus-lg" aria-hidden />}>Choose photos</Button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Choose photos to submit"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />

        {queue.length > 0 && (
          <div className="mx-auto mt-5 max-w-md text-left" aria-live="polite">
            <p className="mb-2 text-sm font-medium text-[var(--ck-text)]">
              {uploading > 0 ? `Uploading ${uploading} photo${uploading === 1 ? '' : 's'}…` : `${done} submitted`}
              {failed.length > 0 && <span className="text-red-600"> · {failed.length} failed</span>}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ck-surface-muted)]">
              <div className="h-full rounded-full bg-[#083A85] transition-all"
                style={{ width: `${Math.round(((done + failed.length) / queue.length) * 100)}%` }} />
            </div>
            {failed.length > 0 && (
              <ul className="mt-2 max-h-28 space-y-1 overflow-auto text-xs text-red-600">
                {failed.map((f) => <li key={f.key} className="truncate">{f.file.name}: {f.error}</li>)}
              </ul>
            )}
            {uploading === 0 && (
              <button className="mt-2 text-xs font-medium text-[var(--ck-text-soft)] underline" onClick={() => setQueue([])}>Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter your photos">
        {([['ALL', 'All'], ['PENDING', 'Waiting'], ['APPROVED', 'Added'], ['REJECTED', 'Not accepted']] as [Filter, string][]).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85] ${filter === key
              ? 'bg-[#083A85] text-white' : 'bg-[var(--ck-surface-muted)] text-[var(--ck-text-soft)] hover:text-[var(--ck-text)]'}`}>
            {label} <span className="opacity-70">{counts[key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState icon={<i className="bi bi-images" aria-hidden />}
            title={filter === 'ALL' ? 'You have not submitted anything yet' : 'Nothing here'}
            description={filter === 'ALL' ? 'Photos you submit show up here with their review status.' : undefined} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((s) => (
            <Card key={s.id} padding={0} className="overflow-hidden">
              <div className="aspect-square bg-[var(--ck-surface-muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.imageUrl && <img src={s.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="space-y-1.5 p-3">
                <StatusBadge status={s.status} />
                {s.reviewNote && <p className="line-clamp-2 text-xs text-[var(--ck-text-soft)]" title={s.reviewNote}>“{s.reviewNote}”</p>}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--ck-text-soft)]">{timeAgo(s.submittedAt)}</span>
                  {s.status === 'PENDING' && (
                    <button disabled={busy} onClick={() => withdraw(s.id)}
                      className="rounded text-xs font-medium text-[var(--ck-text-soft)] hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]">
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={leaveOpen} onClose={() => setLeaveOpen(false)} size="sm"
        title="Leave this album?"
        description={`You will no longer be able to submit photos to "${album.title}". Photos already added stay in the album. To come back, ${owner.name} has to send you a new link.`}
        footer={<>
          <Button variant="ghost" onClick={() => setLeaveOpen(false)}>Stay</Button>
          <Button variant="danger" loading={busy} onClick={leave}>Leave</Button>
        </>} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <Link href="/user/photographer/collaborate?tab=joined"
        className="mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-[var(--ck-text-soft)] hover:text-[#083A85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]">
        <i className="bi bi-arrow-left" aria-hidden /> Joined albums
      </Link>
      {children}
    </div>
  );
}
