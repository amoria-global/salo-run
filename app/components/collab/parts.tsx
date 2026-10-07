"use client";

/**
 * Building blocks shared by the Collaborate screens: album cover, status
 * badge, person chip, and the two link modals (create an invite, join with
 * one). Presentational only; the pages own data and API calls.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Button, Modal } from '../ui';
import type { Invite, Person, SubmissionStatus } from '@/app/lib/APIs/collab';
import { createInvite, tokenFromInput } from '@/app/lib/APIs/collab';

export function AlbumCover({ src, title, className = '' }: { src?: string | null; title: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div
      aria-hidden
      className={`flex h-full w-full items-center justify-center text-white ${className}`}
      style={{ background: 'linear-gradient(135deg, #083A85 0%, #3B5FA8 55%, #F20C8F 130%)' }}
    >
      <span className="text-2xl font-bold opacity-90">{(title || '?').trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}

const STATUS: Record<SubmissionStatus, { tone: 'warning' | 'success' | 'error'; label: string; icon: string }> = {
  PENDING: { tone: 'warning', label: 'Waiting for review', icon: 'bi-hourglass-split' },
  APPROVED: { tone: 'success', label: 'Added to album', icon: 'bi-check-circle-fill' },
  REJECTED: { tone: 'error', label: 'Not accepted', icon: 'bi-x-circle-fill' },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone} icon={<i className={`bi ${s.icon}`} aria-hidden />}>{s.label}</Badge>;
}

export function PersonChip({ person, caption }: { person: Person; caption?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar src={person.avatar} name={person.name} size={32} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--ck-text)]">{person.name}</div>
        {caption && <div className="truncate text-xs text-[var(--ck-text-soft)]">{caption}</div>}
      </div>
    </div>
  );
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysLeft(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'expires today';
  return `expires in ${days} day${days === 1 ? '' : 's'}`;
}

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', text);
    }
  };
  return (
    <Button size="sm" variant={copied ? 'soft' : 'primary'} onClick={copy}
      iconLeft={<i className={`bi ${copied ? 'bi-check2' : 'bi-link-45deg'}`} aria-hidden />}>
      {copied ? 'Copied' : label}
    </Button>
  );
}

/** Two steps: an optional note, then the link to copy. */
export function InviteModal({ albumId, albumTitle, isOpen, onClose, onCreated }: {
  albumId: string; albumTitle: string; isOpen: boolean; onClose: () => void; onCreated: (invite: Invite) => void;
}) {
  const [note, setNote] = useState('');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setNote(''); setInvite(null); setError(null); }
  }, [isOpen]);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const created = await createInvite(albumId, note);
      setInvite(created);
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the link');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={invite ? 'Your invite link is ready' : 'Invite a photographer'}
      description={invite
        ? 'Send it to as many photographers as you like. Anyone with it can join until it expires in 14 days or you cancel it.'
        : `They will be able to submit photos to "${albumTitle}". Nothing is added until you approve it.`}
      footer={invite
        ? <Button onClick={onClose}>Done</Button>
        : <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={create} loading={busy} iconLeft={<i className="bi bi-link-45deg" aria-hidden />}>Create link</Button>
          </>}
    >
      {invite ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface-muted)] p-2 pl-3">
            <code className="min-w-0 flex-1 truncate text-sm text-[var(--ck-text)]" title={invite.link}>{invite.link}</code>
            <CopyButton text={invite.link} />
          </div>
          <p className="text-xs text-[var(--ck-text-soft)]">
            Share it in a group chat, a message or an email. If it reaches the wrong people, cancel it from the Collaborators tab; anyone who already joined stays until you remove them.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="invite-note" className="block text-sm font-semibold text-[var(--ck-text)]">
            Who is it for? <span className="font-normal text-[var(--ck-text-soft)]">(optional, only you see this)</span>
          </label>
          <input
            id="invite-note"
            value={note}
            maxLength={255}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Wedding crew, second shooters"
            className="w-full rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-3.5 py-2.5 text-sm text-[var(--ck-text)] outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20"
          />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

export function JoinWithLinkModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  useEffect(() => { if (isOpen) setValue(''); }, [isOpen]);
  const token = tokenFromInput(value);
  const go = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token) return;
    onClose();
    router.push(`/user/photographer/collaborate/join/${encodeURIComponent(token)}`);
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Join an album"
      description="Paste the invite link a photographer sent you."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => go()} disabled={!token}>Continue</Button>
      </>}
    >
      <form onSubmit={go}>
        <label htmlFor="join-link" className="sr-only">Invite link</label>
        <input
          id="join-link"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://dashboard.connekyt.com/user/photographer/collaborate/join/…"
          className="w-full rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-3.5 py-2.5 text-sm text-[var(--ck-text)] outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20"
        />
      </form>
    </Modal>
  );
}

/** A labelled number used in the summary strips. */
export function Stat({ value, label, tone = 'default' }: { value: number; label: string; tone?: 'default' | 'accent' }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-lg font-bold ${tone === 'accent' && value > 0 ? 'text-[#F20C8F]' : 'text-[var(--ck-text)]'}`}>{value}</span>
      <span className="text-sm text-[var(--ck-text-soft)]">{label}</span>
    </div>
  );
}
