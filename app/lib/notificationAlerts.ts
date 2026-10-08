/**
 * Sound and desktop alerts for new dashboard notifications.
 *
 * The dashboard has no push channel of its own: the top bar polls the
 * notifications list. When a poll brings in an unread notification it hadn't
 * seen, this decides whether it rings (a photographer has to act on it), chimes
 * (a booking or payment changed) or stays silent, and shows a browser
 * notification while the tab is in the background. The first poll after load
 * never alerts, so the backlog doesn't ring.
 */

export type AlertKind = 'ring' | 'chime';

export interface AlertableNotification {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  actionUrl?: string;
}

/** Titles that ring like an opportunity; mirrors NotificationService on the backend. */
const RINGING_TITLES = new Set(['New Booking Request']);

export function alertKind(n: AlertableNotification): AlertKind | null {
  const type = (n.type || '').toUpperCase();
  if (type === 'OPPORTUNITY' || type === 'HYBRID_OPPORTUNITY' || RINGING_TITLES.has(n.title || '')) return 'ring';
  if (type === 'BOOKING' || type === 'PAYMENT') return 'chime';
  return null;
}

/**
 * Unread notifications in `items` that weren't in the previous poll.
 * `seen` is null on the first poll, which returns nothing.
 */
export function freshUnread<T extends AlertableNotification>(seen: Set<string> | null, items: T[]): T[] {
  if (seen === null) return [];
  return items.filter((n) => !n.read && !seen.has(n.id));
}

/** The loudest alert any of these needs: ring beats chime. */
export function strongestAlert(items: AlertableNotification[]): AlertKind | null {
  let kind: AlertKind | null = null;
  for (const n of items) {
    const k = alertKind(n);
    if (k === 'ring') return 'ring';
    if (k === 'chime') kind = 'chime';
  }
  return kind;
}

const SOUNDS: Record<AlertKind, string> = {
  ring: '/sounds/connekyt_ringtone.mp3',
  chime: '/sounds/connekyt_chime.mp3',
};

/**
 * Play the alert once. Browsers block audio until the user has interacted
 * with the page; that failure is ignored, and the desktop notification still
 * carries the alert.
 */
export function playAlert(kind: AlertKind): void {
  if (typeof Audio === 'undefined') return;
  try {
    void new Audio(SOUNDS[kind]).play().catch(() => {});
  } catch {
    // No audio support
  }
}

export function desktopAlertsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function desktopAlertPermission(): NotificationPermission | 'unsupported' {
  return desktopAlertsSupported() ? Notification.permission : 'unsupported';
}

/** Must be called from a click: browsers ignore permission prompts without one. */
export async function requestDesktopAlerts(): Promise<NotificationPermission | 'unsupported'> {
  if (!desktopAlertsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

/**
 * Show a system notification when the tab isn't visible and the user allowed
 * it. Clicking it focuses the tab and opens the notification's link.
 */
export function showDesktopAlert(n: AlertableNotification, open: (url: string) => void): void {
  if (!desktopAlertsSupported() || Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
  try {
    const alert = new Notification(n.title || 'Connekyt', {
      body: n.message || undefined,
      tag: n.id,
      icon: '/logo.png',
      requireInteraction: alertKind(n) === 'ring',
    });
    alert.onclick = () => {
      window.focus();
      if (n.actionUrl) open(n.actionUrl);
      alert.close();
    };
  } catch {
    // Some browsers only allow notifications from a service worker
  }
}
