"use client";

/**
 * The owner's workspace for one album.
 *  - Review: photos collaborators submitted, waiting for a decision. Select
 *    any number and approve them into the album or reject them with a note.
 *  - Collaborators: who can submit, and invite links not used yet.
 *  - History: everything already decided.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, Card, EmptyState, Modal, Skeleton, Tabs } from '@/app/components/ui';
import { AlbumCover, CopyButton, InviteModal, StatusBadge, daysLeft, timeAgo } from '@/app/components/collab/parts';
import { ContributorList, ProgressSummaryCard } from '@/app/components/collab/ContributorProgress';
import { contributorProgress, fromContributor, type Contributor } from '@/app/lib/collabProgress';
import {
  cancelInvite, getOwnedAlbum, removeCollaborator, reviewSubmissions,
  type Collaborator, type Invite, type OwnedAlbumDetail, type Submission,
} from '@/app/lib/APIs/collab';

type TabKey = 'review' | 'people' | 'history';

export default function OwnerAlbum({ albumId }: { albumId: string }) {
  const [data, setData] = useState<OwnedAlbumDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('review');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Submission | null>(null);
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  const [removing, setRemoving] = useState<Collaborator | null>(null);
  // Narrows Review and History to one collaborator, when the owner comes from their progress card.
  const [contributorId, setContributorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getOwnedAlbum(albumId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this album');
    }
  }, [albumId]);

  useEffect(() => { load(); }, [load]);

  const pendingAll = useMemo(() => (data?.submissions ?? []).filter((s) => s.status === 'PENDING')
    .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '')), [data]);
  const decidedAll = useMemo(() => (data?.submissions ?? []).filter((s) => s.status !== 'PENDING'), [data]);
  // The tab counts stay whole; the lists below them can be narrowed to one person.
  const pending = useMemo(() => fromContributor(pendingAll, contributorId), [pendingAll, contributorId]);
  const decided = useMemo(() => fromContributor(decidedAll, contributorId), [decidedAll, contributorId]);
  const progress = useMemo(
    () => contributorProgress(data?.collaborators ?? [], data?.submissions ?? [], data?.album.imageCount ?? 0),
    [data],
  );
  const everyone = useMemo(() => [...progress.contributors, ...progress.former], [progress]);
  const filterName = contributorId ? everyone.find((c) => c.id === contributorId)?.name ?? 'this photographer' : null;
  const goTo = (key: TabKey, id: string) => { setContributorId(id); setTab(key); setSelected(new Set()); };

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allSelected = pending.length > 0 && pending.every((s) => selected.has(s.id));

  const decide = async (ids: string[], decision: 'APPROVE' | 'REJECT', note?: string) => {
    if (ids.length === 0) return;
    setBusy(true); setNotice(null);
    try {
      const r = await reviewSubmissions(ids, decision, note);
      const n = r.reviewed.length;
      let text = decision === 'APPROVE'
        ? `${n} photo${n === 1 ? '' : 's'} added to the album.`
        : `${n} photo${n === 1 ? '' : 's'} rejected.`;
      if (r.duplicates.length > 0) {
        text += ` ${r.duplicates.length} stayed in review because another photographer already published the same image.`;
      }
      setNotice({ tone: 'ok', text });
      setSelected(new Set());
      setPreview(null);
      setRejecting(null);
      await load();
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save your decision' });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (action: () => Promise<void>, message: string) => {
    setBusy(true); setNotice(null);
    try {
      await action();
      setNotice({ tone: 'ok', text: message });
      setRemoving(null);
      await load();
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Could not update collaborators' });
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Shell>
        <Card>
          <EmptyState icon={<i className="bi bi-exclamation-triangle" aria-hidden />} title="Could not open this album"
            description={error} action={<Button onClick={load}>Try again</Button>} />
        </Card>
      </Shell>
    );
  }
  if (!data) return <Shell><HeaderSkeleton /></Shell>;

  const { album, collaborators, invites } = data;

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--ck-surface-muted)]">
          <AlbumCover src={album.coverImage} title={album.title} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#F20C8F]">Your album</p>
          <h1 className="truncate text-2xl font-bold text-[var(--ck-text)]">{album.title || 'Untitled album'}</h1>
          <p className="text-sm text-[var(--ck-text-soft)]">
            {album.imageCount} photos · {collaborators.length} collaborator{collaborators.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} iconLeft={<i className="bi bi-person-plus" aria-hidden />}>
          Invite photographer
        </Button>
      </div>

      {notice && (
        <div role="status" className={`mb-4 flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm ${notice.tone === 'ok'
          ? 'ck-status-success' : 'ck-status-error'}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="opacity-70 hover:opacity-100"><i className="bi bi-x-lg" /></button>
        </div>
      )}

      <div className="mb-5">
        <Tabs
          items={[
            { key: 'review', label: 'Review', count: pendingAll.length },
            { key: 'people', label: 'Progress', count: collaborators.length },
            { key: 'history', label: 'History', count: decidedAll.length },
          ]}
          active={tab}
          onChange={(k) => { setTab(k as TabKey); setSelected(new Set()); }}
        />
      </div>

      {filterName && (tab === 'review' || tab === 'history') && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--ck-surface-soft)] px-3 py-2 text-sm text-[var(--ck-text)]" data-testid="contributor-filter">
          <i className="bi bi-funnel" aria-hidden />
          <span>Showing only photos from <b>{filterName}</b></span>
          <button type="button" onClick={() => { setContributorId(null); setSelected(new Set()); }}
            className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold text-[var(--ck-blue)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]">
            Show everyone
          </button>
        </div>
      )}

      {tab === 'review' && (
        pending.length === 0 ? (
          <Card>
            <EmptyState
              icon={<i className="bi bi-inbox" aria-hidden />}
              title={contributorId ? `Nothing from ${filterName} to review` : 'Nothing to review'}
              description={contributorId
                ? 'Everything they sent has been decided.'
                : collaborators.length === 0
                  ? 'Invite a photographer. Photos they submit will wait here for your decision.'
                  : 'You are all caught up. New photos from your collaborators will appear here.'}
              action={contributorId
                ? <Button onClick={() => setContributorId(null)}>Show everyone</Button>
                : collaborators.length === 0 ? <Button onClick={() => setInviteOpen(true)}>Invite photographer</Button> : undefined}
            />
          </Card>
        ) : (
          <>
            <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)]/95 px-4 py-3 backdrop-blur">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--ck-text)]">
                <input type="checkbox" className="h-4 w-4 accent-[#083A85]" checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(pending.map((s) => s.id)))} />
                {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
              </label>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" disabled={selected.size === 0 || busy}
                  onClick={() => setRejecting(Array.from(selected))}
                  iconLeft={<i className="bi bi-x-lg" aria-hidden />}>Reject</Button>
                <Button size="sm" disabled={selected.size === 0} loading={busy}
                  onClick={() => decide(Array.from(selected), 'APPROVE')}
                  iconLeft={<i className="bi bi-check2" aria-hidden />}>Add to album</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pending.map((s) => (
                <ReviewTile key={s.id} submission={s} selected={selected.has(s.id)}
                  onToggle={() => toggle(s.id)} onOpen={() => setPreview(s)} />
              ))}
            </div>
          </>
        )
      )}

      {tab === 'people' && (
        <div className="space-y-6">
          {collaborators.length === 0 && progress.former.length === 0 ? (
            <Card>
              <EmptyState icon={<i className="bi bi-people" aria-hidden />} title="No collaborators yet"
                description="Create an invite link and send it to a photographer you work with. Once they accept, you can follow their progress here."
                action={<Button onClick={() => setInviteOpen(true)}>Invite photographer</Button>} />
            </Card>
          ) : (
            <>
              <ProgressSummaryCard totals={progress.totals} />
              <ContributorList contributors={progress.contributors} former={progress.former}
                onReview={(id) => goTo('review', id)} onSeePhotos={(id) => goTo('history', id)}
                onRemove={(c: Contributor) => { const m = collaborators.find((x) => x.id === c.id); if (m) setRemoving(m); }} />
            </>
          )}

          <section aria-labelledby="links-h">
            <h2 id="links-h" className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--ck-text-soft)]">Open invite links</h2>
            {invites.length === 0 ? (
              <p className="text-sm text-[var(--ck-text-soft)]">None. One link can bring in as many photographers as you send it to.</p>
            ) : (
              <Card padding={0}>
                <ul className="divide-y divide-[var(--ck-stroke-soft)]">
                  {invites.map((inv) => <InviteRow key={inv.id} invite={inv} busy={busy}
                    onCancel={() => revoke(() => cancelInvite(inv.id), 'Invite link cancelled. Photographers who already joined stay.')} />)}
                </ul>
              </Card>
            )}
          </section>
        </div>
      )}

      {tab === 'history' && (
        decided.length === 0 ? (
          <Card>
            <EmptyState icon={<i className="bi bi-clock-history" aria-hidden />} title="No decisions yet"
              description="Photos you approve or reject are listed here." />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {decided.map((s) => (
              <Card key={s.id} padding={0} className="overflow-hidden">
                <button className="block aspect-square w-full bg-[var(--ck-surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]"
                  onClick={() => setPreview(s)} aria-label={`Open photo from ${s.collaborator.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {(s.thumbnailUrl || s.imageUrl) && (
                    <img
                      src={s.thumbnailUrl || s.imageUrl!}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const currentSrc = target.src;
                        if (currentSrc.includes('/gallery/images/')) {
                          const fallbackThumb = currentSrc.replace('/gallery/images/', '/gallery/thumbs/').replace(/\.[^.]+$/, '.jpg');
                          if (target.src !== fallbackThumb) {
                            target.src = fallbackThumb;
                          }
                        }
                      }}
                    />
                  )}
                </button>
                <div className="space-y-1.5 p-3">
                  <StatusBadge status={s.status} />
                  <p className="truncate text-xs text-[var(--ck-text-soft)]">{s.collaborator.name} · {timeAgo(s.reviewedAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <InviteModal albumId={album.id} albumTitle={album.title} isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)} onCreated={() => load()} />

      {/* Single photo preview with decision buttons */}
      <Modal isOpen={!!preview} onClose={() => setPreview(null)} size="lg"
        title={preview ? `From ${preview.collaborator.name}` : ''}
        description={preview ? `Submitted ${timeAgo(preview.submittedAt)}${preview.caption ? ` · ${preview.caption}` : ''}` : undefined}
        footer={preview?.status === 'PENDING' ? <>
          <Button variant="ghost" onClick={() => setRejecting([preview.id])}>Reject</Button>
          <Button loading={busy} onClick={() => decide([preview.id], 'APPROVE')}>Add to album</Button>
        </> : undefined}>
        {preview && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {(preview.thumbnailUrl || preview.imageUrl) && (
              <img
                src={preview.thumbnailUrl || preview.imageUrl!}
                alt=""
                className="max-h-[65vh] w-full rounded-xl bg-black/5 object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  const currentSrc = target.src;
                  if (currentSrc.includes('/gallery/images/')) {
                    const fallbackThumb = currentSrc.replace('/gallery/images/', '/gallery/thumbs/').replace(/\.[^.]+$/, '.jpg');
                    if (target.src !== fallbackThumb) {
                      target.src = fallbackThumb;
                    }
                  }
                }}
              />
            )}
            {preview.status !== 'PENDING' && <StatusBadge status={preview.status} />}
            {preview.reviewNote && <p className="text-sm text-[var(--ck-text-soft)]">Your note: {preview.reviewNote}</p>}
          </div>
        )}
      </Modal>

      <RejectModal ids={rejecting} busy={busy} onClose={() => setRejecting(null)}
        onConfirm={(note) => rejecting && decide(rejecting, 'REJECT', note)} />

      <Modal isOpen={!!removing} onClose={() => setRemoving(null)} size="sm"
        title={removing ? `Remove ${removing.name}?` : ''}
        description="They will no longer be able to submit photos to this album. Photos they already submitted stay in your review queue. To bring them back, send them a new link."
        footer={<>
          <Button variant="ghost" onClick={() => setRemoving(null)}>Keep</Button>
          <Button variant="danger" loading={busy}
            onClick={() => removing && revoke(() => removeCollaborator(removing.membershipId), `${removing.name} was removed from this album.`)}>Remove</Button>
        </>} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <Link href="/user/photographer/collaborate"
        className="mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-[var(--ck-text-soft)] hover:text-[#083A85] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]">
        <i className="bi bi-arrow-left" aria-hidden /> Collaborate
      </Link>
      {children}
    </div>
  );
}

function ReviewTile({ submission, selected, onToggle, onOpen }: {
  submission: Submission; selected: boolean; onToggle: () => void; onOpen: () => void;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-[var(--ck-surface)] transition ${selected
      ? 'border-[#083A85] ring-2 ring-[#083A85]/30' : 'border-[var(--ck-stroke)]'}`}>
      <button onClick={onOpen} className="block aspect-square w-full bg-[var(--ck-surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#083A85]"
        aria-label={`Open photo from ${submission.collaborator.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(submission.thumbnailUrl || submission.imageUrl) && (
          <img
            src={submission.thumbnailUrl || submission.imageUrl!}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              const currentSrc = target.src;
              if (currentSrc.includes('/gallery/images/')) {
                const fallbackThumb = currentSrc.replace('/gallery/images/', '/gallery/thumbs/').replace(/\.[^.]+$/, '.jpg');
                if (target.src !== fallbackThumb) {
                  target.src = fallbackThumb;
                }
              }
            }}
          />
        )}
      </button>
      <label className="absolute left-2.5 top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 shadow-sm">
        <span className="sr-only">Select photo</span>
        <input type="checkbox" className="h-4 w-4 accent-[#083A85]" checked={selected} onChange={onToggle} />
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar src={submission.collaborator.avatar} name={submission.collaborator.name} size={22} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--ck-text)]">{submission.collaborator.name}</span>
        <span className="shrink-0 text-[11px] text-[var(--ck-text-soft)]">{timeAgo(submission.submittedAt)}</span>
      </div>
    </div>
  );
}

function InviteRow({ invite, busy, onCancel }: { invite: Invite; busy: boolean; onCancel: () => void }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--ck-text)]">{invite.note || 'Invite link'}</p>
        <p className="text-xs text-[var(--ck-text-soft)]">
          {invite.joinedCount} joined · created {timeAgo(invite.createdAt)} · {daysLeft(invite.expiresAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <CopyButton text={invite.link} />
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </li>
  );
}

function RejectModal({ ids, busy, onClose, onConfirm }: {
  ids: string[] | null; busy: boolean; onClose: () => void; onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  useEffect(() => { if (ids) setNote(''); }, [ids]);
  const n = ids?.length ?? 0;
  return (
    <Modal isOpen={!!ids} onClose={onClose} size="sm"
      title={`Reject ${n} photo${n === 1 ? '' : 's'}?`}
      description="They stay out of the album. The photographer is told, with your note if you add one."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={busy} onClick={() => onConfirm(note)}>Reject</Button>
      </>}>
      <label htmlFor="reject-note" className="mb-1.5 block text-sm font-semibold text-[var(--ck-text)]">
        Note for the photographer <span className="font-normal text-[var(--ck-text-soft)]">(optional)</span>
      </label>
      <textarea id="reject-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Slightly out of focus, we have a sharper one"
        className="w-full resize-none rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-3.5 py-2.5 text-sm text-[var(--ck-text)] outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20" />
    </Modal>
  );
}

function HeaderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading album">
      <div className="mb-6 flex items-center gap-4">
        <Skeleton width={112} height={80} rounded={12} />
        <div className="flex-1 space-y-2"><Skeleton height={22} width="40%" /><Skeleton height={14} width="25%" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={220} rounded={16} />)}
      </div>
    </div>
  );
}
