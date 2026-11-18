'use client';

/**
 * Inbox in Compact Glass (design reference: connekyt-web-inbox-reference.png), for photographers, clients and
 * coordinators. Behaviour comes from usePhotographerInbox / useClientInbox (the classic pages' logic, moved verbatim);
 * this file is presentation only.
 *
 * Desktop: two panes. List: search, All / Unread / Pinned with counts, rows with avatar or initials, bold name and a
 * magenta count when unread, last message and time. Thread: header with "Last seen yesterday at 4:50 PM" (the viewer's
 * timezone, never a raw timestamp), messages oldest first with a date divider above each day, own bubbles right in
 * brand blue with the time and ✓✓, theirs left on the surface, "Message removed" in italic muted text, and a composer
 * with attach (photographers), emoji, the field and a blue send button. Phones: the list, then a full-screen thread
 * with the composer pinned above the safe area. A message that fails to send stays on its bubble with Retry.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCheck, Clock, Image as ImageIcon, MessageSquarePlus, Pencil, Plus, RotateCw, Search, Send, Smile, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { emojiCategories } from '@/app/components/chat/chatData';
import { AlbumShareCard, ShareAlbumButton } from '@/app/components/chat/ChatAlbumShare';
import { lastMessagePreview, partnerProfileHref } from '@/app/components/chat/chatShared';
import { fmtDayDivider, fmtLastSeen, fmtListTime, fmtTime, parseServerDate } from '../format';
import { Avatar, ConfirmDialog, EmptyState, ErrorState, GlassModal, OverflowMenu, RowsSkeleton, Segmented, VirtualRows } from '../ui';

type Kind = 'photographer' | 'client' | 'event-coordinator';
type Msg = {
  id: string; senderId: string; content: string; type: string; isRead: boolean; createdAt: string; status?: 'sending' | 'failed';
  albumShare?: { albumIds: string[]; note?: string };
};
type Participant = { id: string; name: string; image: string; userType: string; isOnline: boolean; lastSeen?: string };
type Conv = { id: string; participants: Participant[]; lastMessage?: { content: string; type?: string; senderId: string; createdAt: string }; unreadCount: number; isPinned: boolean; messages: Msg[] };

/** The common shape of both inbox hooks (they differ only in role-specific extras). */
export interface InboxController {
  conversations: Conv[];
  conversationsLoaded: boolean;
  conversationsError: boolean;
  loadedThreads: string[];
  selectedConversation: string | null;
  setSelectedConversation: (id: string | null) => void;
  handleSelectConversation: (id: string) => void;
  searchQuery: string; setSearchQuery: (s: string) => void;
  activeFilter: 'all' | 'unread' | 'pinned'; setActiveFilter: (f: 'all' | 'unread' | 'pinned') => void;
  messageInput: string; setMessageInput: (s: string) => void;
  sendMessage: () => void | Promise<void>;
  retryMessage: (id: string) => void | Promise<void>;
  isSending: boolean;
  chatError: string | null; setChatError: (s: string | null) => void;
  contentWarning: string | null; setContentWarning: (s: string | null) => void;
  showEmojiPicker: boolean; setShowEmojiPicker: (b: boolean) => void;
  activeEmojiCategory: string; setActiveEmojiCategory: (s: string) => void;
  insertEmoji: (e: string) => void;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  editingMessageId: string | null;
  editMessageContent: string; setEditMessageContent: (s: string) => void;
  handleEditMessage: (id: string, content: string) => void;
  saveEditedMessage: () => void | Promise<void>;
  cancelEdit: () => void;
  handleDeleteMessage: (id: string) => void | Promise<void>;
  showNewChatModal: boolean; setShowNewChatModal: (b: boolean) => void;
  contacts: { id: string; name: string; image: string; speciality?: string }[];
  isLoadingContacts: boolean;
  contactSearchQuery: string; setContactSearchQuery: (s: string) => void;
  fetchContacts: () => void | Promise<void>;
  startConversation: (c: { id: string; name: string; image: string }) => void;
  getOtherParticipant: (c: Conv) => Participant | undefined;
  currentUserId: string;
  loadMessages: (id: string) => void | Promise<void>;
  fetchConversations: () => void | Promise<void>;
  canShareAlbums?: boolean;
}

const GALLERY: Record<Kind, string> = { photographer: '/user/photographer/events', client: '/user/client/gallery', 'event-coordinator': '/user/event-coordinator/gallery' };

function usePhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    // below 1024 px two panes are too tight: list first, then the thread on its own
    const m = window.matchMedia('(max-width: 1023.98px)');
    const on = () => setPhone(m.matches);
    on(); m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return phone;
}

function ConvRow({ c, ctl, selected }: { c: Conv; ctl: InboxController; selected: boolean }) {
  const { t, language } = useLanguage();
  const other = ctl.getOtherParticipant(c);
  const name = other?.name || t('Conversation');
  const unread = c.unreadCount > 0;
  const own = c.lastMessage?.senderId === ctl.currentUserId;
  const preview = lastMessagePreview(c.lastMessage);
  return (
    <button type="button" className={`gi-conv${selected ? ' is-on' : ''}${unread ? ' is-unread' : ''}`} aria-current={selected ? 'true' : undefined}
      onClick={() => ctl.handleSelectConversation(c.id)}>
      <Avatar name={name} src={other?.image} size={44} />
      <span className="gi-conv-text">
        <span className="gi-conv-top">
          <strong className="g-ellipsis">{name}</strong>
          <time className="gi-conv-time">{fmtListTime(c.lastMessage?.createdAt, t, language)}</time>
        </span>
        <span className="gi-conv-bottom">
          <span className="g-ellipsis gi-conv-preview">{preview ? (own ? `${t('You')}: ${t(preview)}` : t(preview)) : t('No messages yet')}</span>
          {unread ? <span className="gi-count" aria-label={`${c.unreadCount} ${t(c.unreadCount === 1 ? 'unread message' : 'unread messages')}`}>{c.unreadCount}</span> : null}
        </span>
      </span>
    </button>
  );
}

function Bubble({ m, own, ctl, onDelete }: { m: Msg; own: boolean; ctl: InboxController; onDelete: (id: string) => void }) {
  const { t, language } = useLanguage();
  const time = fmtTime(m.createdAt, language);
  if (m.type === 'removed') {
    return <div className={`gi-line${own ? ' is-own' : ''}`}><div className="gi-bubble gi-removed"><em>{t('Message removed')}</em><span className="gi-meta">{time}</span></div></div>;
  }
  if (m.type === 'album_share') {
    return (
      <div className={`gi-line${own ? ' is-own' : ''}`}>
        <div className="gi-share">
          {(m.albumShare?.albumIds ?? []).map((id) => <AlbumShareCard key={id} albumId={id} isOwn={own} />)}
          {m.albumShare?.note ? <div className={`gi-bubble${own ? ' is-own' : ''}`}>{m.albumShare.note}</div> : null}
          <span className="gi-meta gi-meta-out">{time}</span>
        </div>
      </div>
    );
  }
  const editing = ctl.editingMessageId === m.id;
  const temp = String(m.id).startsWith('temp-');
  return (
    <div className={`gi-line${own ? ' is-own' : ''}`}>
      {own && !editing && !temp && (
        <span className="gi-tools">
          <button type="button" className="g-icon-btn" aria-label={t('Edit message')} onClick={() => ctl.handleEditMessage(m.id, m.content)}><Pencil size={15} aria-hidden /></button>
          <button type="button" className="g-icon-btn" aria-label={t('Delete message')} onClick={() => onDelete(m.id)}><Trash2 size={15} aria-hidden /></button>
        </span>
      )}
      <div className={`gi-bubble${own ? ' is-own' : ''}${m.status === 'failed' ? ' is-failed' : ''}`}>
        {editing ? (
          <div className="gi-edit">
            <label className="sr-only" htmlFor={`edit-${m.id}`}>{t('Edit message')}</label>
            <textarea id={`edit-${m.id}`} value={ctl.editMessageContent} rows={2} autoFocus
              onChange={(e) => ctl.setEditMessageContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ctl.saveEditedMessage(); } if (e.key === 'Escape') ctl.cancelEdit(); }} />
            <span className="gi-edit-actions">
              <button type="button" className="g-btn g-btn-ghost" onClick={ctl.cancelEdit}>{t('Cancel')}</button>
              <button type="button" className="g-btn g-btn-primary" onClick={() => ctl.saveEditedMessage()}>{t('Save')}</button>
            </span>
          </div>
        ) : <span className="gi-text">{m.content}</span>}
        {!editing && (
          <span className="gi-meta">
            {time}
            {own ? (m.status === 'sending' ? <Clock size={12} aria-label={t('Sending')} /> : m.status === 'failed' ? null
              : m.isRead ? <CheckCheck size={14} aria-label={t('Read')} /> : <Check size={14} aria-label={t('Sent')} />) : null}
          </span>
        )}
      </div>
      {m.status === 'failed' && (
        <button type="button" className="gi-retry" onClick={() => ctl.retryMessage(m.id)}>
          <RotateCw size={14} aria-hidden /> {t('Not sent. Retry')}
        </button>
      )}
    </div>
  );
}

function Thread({ ctl, conv, kind, onBack, phone }: { ctl: InboxController; conv: Conv; kind: Kind; onBack: () => void; phone: boolean }) {
  const { t, language } = useLanguage();
  const other = ctl.getOtherParticipant(conv);
  const name = other?.name || t('Conversation');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const loaded = ctl.loadedThreads.includes(conv.id) || conv.messages.length > 0;
  const profile = other ? partnerProfileHref(other) : undefined;

  // oldest first, a divider above each day (viewer's timezone)
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Msg[] }[] = [];
    const sorted = [...conv.messages].sort((a, b) => (parseServerDate(a.createdAt)?.getTime() ?? 0) - (parseServerDate(b.createdAt)?.getTime() ?? 0));
    for (const m of sorted) {
      const d = parseServerDate(m.createdAt);
      const key = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : 'unknown';
      const last = out[out.length - 1];
      if (!last || last.key !== key) out.push({ key, label: d ? fmtDayDivider(d, t, language) : '', items: [m] });
      else last.items.push(m);
    }
    return out;
  }, [conv.messages, t, language]);

  useEffect(() => { ctl.messagesEndRef.current?.scrollIntoView({ block: 'end' }); }, [conv.messages.length, ctl.messagesEndRef]);

  const status = other?.isOnline ? t('Online') : other?.lastSeen ? fmtLastSeen(other.lastSeen, t, language) : '';
  const canSend = ctl.messageInput.trim().length > 0 && !ctl.isSending;
  return (
    <section className="gi-thread" aria-label={`${t('Conversation with')} ${name}`}>
      <header className="gi-thread-head">
        {phone && <button type="button" className="g-icon-btn" aria-label={t('Back to messages')} onClick={onBack}><ArrowLeft size={18} aria-hidden /></button>}
        <Avatar name={name} src={other?.image} size={40} />
        <span className="gi-who">
          <strong className="g-ellipsis">{name}</strong>
          {status ? <small className={`g-ellipsis${other?.isOnline ? ' gi-online' : ''}`}>{status}</small> : null}
        </span>
        <span className="gi-head-actions">
          <Link href={GALLERY[kind]} className="g-icon-btn" aria-label={t('Gallery')} title={t('Gallery')}><ImageIcon size={17} aria-hidden /></Link>
          <OverflowMenu label={`${t('More options for')} ${name}`} items={[
            ...(profile ? [{ key: 'profile', label: t('View profile'), onSelect: () => window.open(profile, '_blank', 'noopener') }] : []),
            { key: 'refresh', label: t('Refresh conversation'), onSelect: () => { void ctl.loadMessages(conv.id); } },
          ]} />
        </span>
      </header>

      <div className="gi-scroll" tabIndex={0} role="log" aria-label={`${t('Messages with')} ${name}`}>
        {!loaded ? (
          <div className="gi-skel" role="status" aria-busy="true" aria-label={t('Loading')}>
            {[0, 1, 2, 3].map((i) => <div key={i} className={`g-skeleton gi-skel-bubble${i % 2 ? ' is-own' : ''}`} />)}
          </div>
        ) : !conv.messages.length ? (
          <EmptyState title="Say hello" body={`${t('This is the start of your conversation with')} ${name}.`} />
        ) : (
          <div className="gi-messages">
            {groups.map((g) => (
              <div key={g.key} className="gi-day">
                {g.label ? <div className="gi-divider" role="separator"><span>{g.label}</span></div> : null}
                {g.items.map((m) => <Bubble key={m.id} m={m} own={m.senderId === ctl.currentUserId} ctl={ctl} onDelete={setConfirmDelete} />)}
              </div>
            ))}
          </div>
        )}
        <div ref={ctl.messagesEndRef} />
      </div>

      {(ctl.chatError || ctl.contentWarning) && (
        <div className="gi-notes">
          {ctl.chatError && <p role="alert" className="gi-note gi-note-error">{t(ctl.chatError)}<button type="button" className="g-icon-btn" aria-label={t('Dismiss')} onClick={() => ctl.setChatError(null)}><X size={14} aria-hidden /></button></p>}
          {ctl.contentWarning && <p role="alert" className="gi-note gi-note-warn">{t(ctl.contentWarning)}<button type="button" className="g-icon-btn" aria-label={t('Dismiss')} onClick={() => ctl.setContentWarning(null)}><X size={14} aria-hidden /></button></p>}
        </div>
      )}

      <form className="gi-composer" onSubmit={(e) => { e.preventDefault(); if (canSend) ctl.sendMessage(); }}>
        {kind === 'photographer' && ctl.canShareAlbums && other ? (
          <span className="gi-attach"><ShareAlbumButton partnerId={other.id} partnerName={other.name} onSent={() => { void ctl.loadMessages(other.id); void ctl.fetchConversations(); }} /></span>
        ) : kind === 'photographer' ? null : null}
        <div className="gi-field" ref={ctl.emojiPickerRef}>
          <button type="button" className="g-icon-btn gi-emoji-btn" aria-label={t('Emoji')} aria-expanded={ctl.showEmojiPicker} onClick={() => ctl.setShowEmojiPicker(!ctl.showEmojiPicker)}><Smile size={18} aria-hidden /></button>
          <label className="sr-only" htmlFor="gi-input">{t('Type a message...')}</label>
          <textarea id="gi-input" ref={field} rows={1} value={ctl.messageInput} placeholder={t('Type a message...')}
            onChange={(e) => { ctl.setMessageInput(e.target.value); if (ctl.contentWarning) ctl.setContentWarning(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) ctl.sendMessage(); } }} />
          {ctl.showEmojiPicker && (
            <div className="g-panel gi-emoji" role="dialog" aria-label={t('Emoji')}>
              <div className="gi-emoji-tabs" role="tablist">
                {Object.keys(emojiCategories).map((c) => (
                  <button key={c} type="button" role="tab" aria-selected={ctl.activeEmojiCategory === c} className={`gi-emoji-tab${ctl.activeEmojiCategory === c ? ' is-on' : ''}`} onClick={() => ctl.setActiveEmojiCategory(c)}>{t(c)}</button>
                ))}
              </div>
              <div className="gi-emoji-grid">
                {emojiCategories[ctl.activeEmojiCategory as keyof typeof emojiCategories].map((e, i) => (
                  <button key={i} type="button" className="gi-emoji-cell" aria-label={e} onClick={() => { ctl.insertEmoji(e); field.current?.focus(); }}>{e}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button type="submit" className={`gi-send${canSend ? ' is-ready' : ''}`} disabled={!canSend} aria-label={t('Send')}><Send size={18} aria-hidden /></button>
      </form>

      {confirmDelete && (
        <ConfirmDialog title="Delete this message?" body="It is removed for both of you." confirmLabel="Delete"
          onClose={() => setConfirmDelete(null)} onConfirm={() => { const id = confirmDelete; setConfirmDelete(null); void ctl.handleDeleteMessage(id); }} />
      )}
    </section>
  );
}

function NewChat({ ctl }: { ctl: InboxController }) {
  const { t } = useLanguage();
  const q = ctl.contactSearchQuery.toLowerCase();
  const list = ctl.contacts.filter((c) => !q || c.name.toLowerCase().includes(q));
  return (
    <GlassModal title="New message" onClose={() => ctl.setShowNewChatModal(false)} width={480}>
      <label className="gc-search gi-modal-search">
        <Search size={15} aria-hidden />
        <span className="sr-only">{t('Search contacts')}</span>
        <input type="search" autoFocus value={ctl.contactSearchQuery} onChange={(e) => ctl.setContactSearchQuery(e.target.value)} placeholder={t('Search contacts')} />
      </label>
      {ctl.isLoadingContacts ? <RowsSkeleton rows={4} height={56} /> : !list.length ? (
        <EmptyState title={ctl.contacts.length ? 'No contacts match' : 'No contacts yet'} body={ctl.contacts.length ? 'Try another name.' : 'People you work with show up here.'} />
      ) : (
        <ul className="gi-contacts">
          {list.map((c) => (
            <li key={c.id}>
              <button type="button" className="gi-contact" onClick={() => ctl.startConversation(c)}>
                <Avatar name={c.name} src={c.image} size={40} />
                <span className="gc-two"><strong className="g-ellipsis">{c.name}</strong>{c.speciality ? <small className="g-ellipsis">{t(c.speciality)}</small> : null}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassModal>
  );
}

export default function GlassInbox({ ctl: raw, kind }: { ctl: unknown; kind: Kind }) {
  const ctl = raw as InboxController;
  const { t } = useLanguage();
  const phone = usePhone();
  const openNew = () => { ctl.setShowNewChatModal(true); ctl.setContactSearchQuery(''); void ctl.fetchContacts(); };
  const q = ctl.searchQuery.toLowerCase();
  const matches = (c: Conv) => !q || (ctl.getOtherParticipant(c)?.name || '').toLowerCase().includes(q);
  const unread = ctl.conversations.filter((c) => c.unreadCount > 0).length;
  const pinned = ctl.conversations.filter((c) => c.isPinned).length;
  const list = ctl.conversations.filter((c) => matches(c) && (ctl.activeFilter === 'unread' ? c.unreadCount > 0 : ctl.activeFilter === 'pinned' ? c.isPinned : true));
  const conv = ctl.conversations.find((c) => c.id === ctl.selectedConversation) ?? null;
  const threadOpen = !!conv;

  return (
    <div className={`gp-page gi-page${threadOpen ? ' has-thread' : ''}`}>
      <div className="g-panel gi-frame">
        <aside className="gi-list" aria-label={t('Conversations')}>
          <div className="gi-list-head">
            <div>
              <div className="gh-eyebrow">{t('Inbox')}</div>
              <h1 className="g-display gp-title gi-title">{t('Messages')}</h1>
            </div>
            <button type="button" className="g-btn g-btn-primary" onClick={openNew}><Plus size={16} aria-hidden /> {t('New')}</button>
          </div>
          <label className="gc-search gi-search">
            <Search size={15} aria-hidden />
            <span className="sr-only">{t('Search conversations')}</span>
            <input type="search" value={ctl.searchQuery} onChange={(e) => ctl.setSearchQuery(e.target.value)} placeholder={t('Search conversations')} />
          </label>
          <Segmented<'all' | 'unread' | 'pinned'> label="Filter conversations" value={ctl.activeFilter} onChange={ctl.setActiveFilter} options={[
            { key: 'all', label: 'All' }, { key: 'unread', label: 'Unread', count: unread }, { key: 'pinned', label: 'Pinned', count: pinned },
          ]} />
          <div className="gi-list-scroll">
            {!ctl.conversationsLoaded ? <RowsSkeleton rows={6} height={64} /> : ctl.conversationsError && !ctl.conversations.length ? (
              <ErrorState message="We could not load your messages." onRetry={() => { void ctl.fetchConversations(); }} />
            ) : !ctl.conversations.length ? (
              <EmptyState icon={<MessageSquarePlus size={20} />} title="No messages yet" body="Start a conversation and it will show up here."
                action={<button type="button" className="g-btn g-btn-primary" onClick={openNew}>{t('Start a conversation')}</button>} />
            ) : !list.length ? (
              <EmptyState title={ctl.activeFilter === 'pinned' ? 'No pinned conversations' : ctl.activeFilter === 'unread' ? 'You are all caught up' : 'No conversations match'} />
            ) : (
              <VirtualRows items={list} rowHeight={72} render={(c) => <ConvRow key={c.id} c={c} ctl={ctl} selected={c.id === ctl.selectedConversation} />} />
            )}
          </div>
        </aside>
        {conv ? <Thread ctl={ctl} conv={conv} kind={kind} phone={phone} onBack={() => ctl.setSelectedConversation(null)} /> : (
          <section className="gi-thread gi-placeholder" aria-label={t('Conversation')}>
            <EmptyState icon={<MessageSquarePlus size={20} />} title="Select a conversation" body="Pick a conversation on the left, or start a new one." />
          </section>
        )}
      </div>
      {ctl.showNewChatModal && <NewChat ctl={ctl} />}
    </div>
  );
}
