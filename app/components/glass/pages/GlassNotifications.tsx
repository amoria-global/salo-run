'use client';

import { BookImage, CalendarCheck, Gift, Radio, ShieldAlert, Star, Wallet } from 'lucide-react';
import { usePhotographerNotifications } from '../../notifications/usePhotographerNotifications';
import GlassNotificationsView, { type NotifController, type NotifMeta } from './GlassNotificationsView';

const META: NotifMeta = {
  payment: { icon: Wallet, tone: 'success', label: 'Payment' },
  tip: { icon: Gift, tone: 'pending', label: 'Tip' },
  bonus: { icon: Star, tone: 'info', label: 'Bonus' },
  security: { icon: ShieldAlert, tone: 'error', label: 'Security' },
  album: { icon: BookImage, tone: 'accent', label: 'Album' },
  review: { icon: Star, tone: 'pending', label: 'Review' },
  event: { icon: CalendarCheck, tone: 'info', label: 'Event' },
  photobook: { icon: BookImage, tone: 'accent', label: 'Photobook' },
  opportunity: { icon: Radio, tone: 'accent', label: 'Opportunity' },
};

/** Photographer Notifications in Compact Glass: the shared view over usePhotographerNotifications. */
export default function GlassNotifications() {
  const s = usePhotographerNotifications({ escapeHandledByView: true });
  return <GlassNotificationsView s={s as unknown as NotifController} meta={META} />;
}
