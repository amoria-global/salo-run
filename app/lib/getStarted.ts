/**
 * The "Get started with Events" modal: which shortcuts a role can use, and when it opens by itself. The mobile app
 * carries the same rules (src/features/events/getStarted.ts).
 *
 * It opens on entering Events, at most once per browser session, only while the user has nothing yet and has not ticked
 * "Don't show this again". That tick is saved to the account (preference `events.getStarted.dismissed`, so it holds on
 * every device) and cached in this browser. Closing any other way hides it for this session only.
 */

export const GET_STARTED_PREF_KEY = 'events.getStarted.dismissed';

export type GetStartedKey = 'create-event' | 'go-live' | 'new-album';
export type GetStartedAction = { key: GetStartedKey; title: string; body: string; icon: string; tone: string };

const ALL: Record<GetStartedKey, GetStartedAction> = {
  'create-event': { key: 'create-event', title: 'Create event', body: 'Book a photographer for your event', icon: 'bi-calendar-event', tone: '59,130,246' },
  'go-live': { key: 'go-live', title: 'Go live', body: 'Host and stream an event yourself', icon: 'bi-broadcast', tone: '255,0,51' },
  'new-album': { key: 'new-album', title: 'New album', body: 'Upload, share or sell photos', icon: 'bi-images', tone: '34,199,217' },
};

export type GetStartedRole = 'client' | 'coordinator' | 'photographer';

/**
 * What each role can start here. A photographer creates an event by hosting one, so they get Go live; Go live is shown
 * only when the server says the account can host. A team member without the create permission gets nothing. The web
 * dashboard has no photobook creation, so that row is mobile-only.
 */
export function getStartedActions(role: GetStartedRole, o: { canHost: boolean; canCreate?: boolean }): GetStartedAction[] {
  if (o.canCreate === false) return [];
  const live = o.canHost ? [ALL['go-live']] : [];
  if (role === 'client' || role === 'coordinator') return [ALL['create-event'], ...live];
  return [...live, ALL['new-album']];
}

/** The label of the header create button for each section tab. */
export const CREATE_LABEL = { events: 'Create event', albums: 'New album', photobooks: 'New photobook', content: 'New post' } as const;

/** Whether the modal should open by itself now. */
export function shouldAutoOpen(s: { actions: number; listLoaded: boolean; hasItems: boolean; dismissed: boolean | null; shownThisSession: boolean }): boolean {
  return s.actions > 0 && s.listLoaded && !s.hasItems && s.dismissed === false && !s.shownThisSession;
}

export const preferencesPath = (role: GetStartedRole): string =>
  role === 'coordinator' ? '/api/remote/coordinator/preferences' : role === 'photographer' ? '/api/remote/photographer/preferences' : '/api/remote/customer/preferences';

/** Browser-session state: the modal has been shown once. A new tab or a closed browser resets it. */
const SHOWN_KEY = 'events.getStarted.shown';
let shownInMemory = false;
export function shownThisSession(): boolean {
  try { return shownInMemory || window.sessionStorage.getItem(SHOWN_KEY) === '1'; } catch { return shownInMemory; }
}
export function markShown(): void {
  shownInMemory = true;
  try { window.sessionStorage.setItem(SHOWN_KEY, '1'); } catch { /* private mode: memory only */ }
}
