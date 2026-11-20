'use client';

import { BookImage, CalendarCheck, Camera, Gift, ShieldAlert, Tv } from 'lucide-react';
import { useClientNotifications } from '../../notifications/useClientNotifications';
import GlassNotificationsView, { type NotifController, type NotifMeta } from './GlassNotificationsView';

const META: NotifMeta = {
  album: { icon: BookImage, tone: 'accent', label: 'Album' },
  gift: { icon: Gift, tone: 'success', label: 'Gift' },
  streamfee: { icon: Tv, tone: 'success', label: 'Stream fee' },
  security: { icon: ShieldAlert, tone: 'error', label: 'Security' },
  booking: { icon: CalendarCheck, tone: 'info', label: 'Booking' },
  photographer: { icon: Camera, tone: 'pending', label: 'Photographer' },
  photobook: { icon: BookImage, tone: 'accent', label: 'Photobook' },
};

/** Client and coordinator Notifications in Compact Glass: the shared view over useClientNotifications. */
export default function GlassClientNotifications({ userRole = 'client' }: { userRole?: 'client' | 'event-coordinator' }) {
  const s = useClientNotifications(userRole, { escapeHandledByView: true });
  return <GlassNotificationsView s={s as unknown as NotifController} meta={META} />;
}
