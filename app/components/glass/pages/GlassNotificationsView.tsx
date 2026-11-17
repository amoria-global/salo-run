'use client';

/**
 * Notifications in Compact Glass. Same behaviour as the classic page (usePhotographerNotifications is shared): the newest
 * 50, filter by type, open a notification to read it (closing marks it read), mark one or all as read, delete one, clear
 * the read ones, delete all, and the destination link of each type with the highlight parameter. Only presentation is new;
 * the two bulk deletes now ask through a dialog instead of acting at once or using a browser prompt.
 */
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Bell, Check, Trash2, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { Card, Chip, ConfirmDialog, EmptyState, GlassModal, PageHeader, RowsSkeleton, Segmented, type Tone } from '../ui';

function TypeIcon({ n, meta }: { n: Notif; meta: NotifMeta }) {
  const m = meta[n.type] ?? { icon: Bell, tone: 'neutral' as Tone, label: '' };
  const Icon = m.icon;
  return n.avatar
    ? <Image src={n.avatar} alt="" width={40} height={40} className="gp-n-avatar" />
    : <span className={`gp-n-icon gp-chip-${m.tone}`} aria-hidden><Icon size={18} /></span>;
}

/** The part of both notification hooks the glass page uses (usePhotographerNotifications and useClientNotifications have the same shape). */
export interface Notif { id: string; type: string; title: string; message: string; timestamp: string; read: boolean; avatar?: string; amount?: number; albumPreview?: string; referenceId?: string }
export type NotifMeta = Record<string, { icon: LucideIcon; tone: Tone; label: string }>;
export interface NotifController {
  notifications: Notif[]; activeFilter: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActiveFilter: (f: any) => void; loading: boolean; selectedNotif: Notif | null; // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedNotif: (n: any) => void;
  unreadCount: number; markAsRead: (id: string) => unknown; // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openNotifModal: (n: any) => void; closeNotifModal: () => void; // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getNotificationDest: (n: any) => string | null;
  markAllAsRead: () => unknown; deleteNotification: (id: string) => unknown; deleteAllRead: () => unknown; deleteAllNotificationsConfirmed: () => unknown;
  filteredNotifications: Notif[]; filterOptions: { value: string; label: string }[];
}

export default function GlassNotificationsView({ s, meta }: { s: NotifController; meta: NotifMeta }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [confirm, setConfirm] = useState<null | 'read' | 'all'>(null);
  const sel = s.selectedNotif;
  const dest = sel ? s.getNotificationDest(sel) : null;
  const refId = sel?.referenceId;
  const destWithHighlight = dest && refId ? `${dest}${dest.includes('?') ? '&' : '?'}highlight=${encodeURIComponent(refId)}` : dest;
  const readCount = s.notifications.filter((n) => n.read).length;

  return (
    <div className="gp-page gp-page-narrow">
      <PageHeader title="Notifications" subtitle={s.unreadCount > 0 ? `${s.unreadCount} ${t('unread')}` : 'You are all caught up.'}
        action={s.unreadCount > 0 ? <button type="button" className="g-btn g-btn-primary" onClick={s.markAllAsRead}><Check size={16} aria-hidden /> {t('Mark all as read')}</button> : undefined} />

      <div className="gp-toolbar">
        <Segmented<string> label="Notification type" value={s.activeFilter} onChange={(k) => s.setActiveFilter(k)}
          options={s.filterOptions.map((o) => ({ key: o.value, label: o.label }))} />
        <div className="gp-toolbar-actions">
          <button type="button" className="g-btn g-btn-ghost" disabled={readCount === 0} onClick={() => setConfirm('read')}>{t('Clear read')}</button>
          <button type="button" className="g-btn g-btn-ghost" disabled={s.notifications.length === 0} onClick={() => setConfirm('all')}>{t('Delete all')}</button>
        </div>
      </div>

      {s.loading ? (
        <RowsSkeleton rows={5} height={72} />
      ) : s.filteredNotifications.length === 0 ? (
        <EmptyState icon={<Bell size={20} />} title="No notifications" body="New activity on your account shows up here." />
      ) : (
        <>
          <p className="gp-sub" aria-live="polite">{t('Showing')} {s.filteredNotifications.length}</p>
          <ul className="gp-list gp-list-spaced">
            {s.filteredNotifications.map((n) => (
              <li key={n.id} className="gp-n-item">
                <Card className={`gp-n${n.read ? '' : ' is-unread'}`}>
                  <button type="button" className="gp-n-main" onClick={() => s.openNotifModal(n)} aria-label={`${n.title}${n.read ? '' : `, ${t('unread')}`}`}>
                    <TypeIcon n={n} meta={meta} />
                    <span className="gp-row-text">
                      <strong className="gp-n-title">{n.title}</strong>
                      <small className="gp-n-msg">{n.message}</small>
                      <span className="gp-chips-inline">
                        <Chip tone={meta[n.type]?.tone ?? 'neutral'}>{t(meta[n.type]?.label ?? 'Notification')}</Chip>
                        {n.amount ? <Chip tone="success">+{formatPrice(n.amount)}</Chip> : null}
                        {!n.read && <Chip tone="accent">{t('New')}</Chip>}
                        <span className="gp-n-time">{n.timestamp}</span>
                      </span>
                    </span>
                  </button>
                  <div className="gp-n-actions">
                    {!n.read && <button type="button" className="g-icon-btn" aria-label={t('Mark as read')} onClick={() => s.markAsRead(n.id)}><Check size={16} aria-hidden /></button>}
                    <button type="button" className="g-icon-btn" aria-label={t('Delete notification')} onClick={() => s.deleteNotification(n.id)}><Trash2 size={16} aria-hidden /></button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {sel && (
        <GlassModal title={sel.title} onClose={s.closeNotifModal} width={520}
          footer={
            <>
              <button type="button" className="g-btn g-btn-ghost gp-btn-quiet-danger" onClick={async () => { const id = sel.id; s.setSelectedNotif(null); await s.deleteNotification(id); }}>{t('Delete')}</button>
              {!sel.read && <button type="button" className="g-btn g-btn-ghost" onClick={() => { s.markAsRead(sel.id); s.setSelectedNotif(null); }}>{t('Mark as read')}</button>}
              {destWithHighlight && <Link href={destWithHighlight} className="g-btn g-btn-primary" onClick={() => { if (!sel.read) s.markAsRead(sel.id); s.setSelectedNotif(null); }}>{t('View')}</Link>}
              <button type="button" className="g-btn g-btn-ghost" onClick={s.closeNotifModal}>{t('Close')}</button>
            </>
          }>
          <div className="gp-n-meta">
            <TypeIcon n={sel} meta={meta} />
            <span className="gp-chips-inline">
              <Chip tone={meta[sel.type]?.tone ?? 'neutral'}>{t(meta[sel.type]?.label ?? 'Notification')}</Chip>
              {sel.amount ? <Chip tone="success">+{formatPrice(sel.amount)}</Chip> : null}
              <span className="gp-n-time">{sel.timestamp}</span>
            </span>
          </div>
          <p className="gp-n-body">{sel.message}</p>
        </GlassModal>
      )}

      {confirm === 'read' && (
        <ConfirmDialog title="Clear read notifications?" body="The notifications you have already read will be deleted. Unread ones stay." confirmLabel="Clear read"
          onClose={() => setConfirm(null)} onConfirm={() => { setConfirm(null); void s.deleteAllRead(); }} />
      )}
      {confirm === 'all' && (
        <ConfirmDialog title="Delete all notifications?" body="This cannot be undone." confirmLabel="Delete all"
          onClose={() => setConfirm(null)} onConfirm={() => { setConfirm(null); void s.deleteAllNotificationsConfirmed(); }} />
      )}
    </div>
  );
}
