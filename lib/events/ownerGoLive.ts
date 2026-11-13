/**
 * Whether a client or coordinator sees Go live on an event in their dashboard. Only the owner of a PRIVATE event
 * streams it themselves (a public event is streamed by its photographer), and only until the event is over. The server
 * repeats the rule, so this decides what to offer, not what is allowed.
 */
import { getEventStatus } from './eventStatus';

export type OwnerGoLiveInput = {
  eventVisibility?: string | null;
  status?: string | null;
  date?: string | null;
  time?: string | null;
  endTime?: string | null;
};

export function canOwnerGoLive(e: OwnerGoLiveInput, now: number = Date.now()): boolean {
  if ((e.eventVisibility ?? '').toUpperCase() !== 'PRIVATE') return false;
  return getEventStatus({ eventDate: e.date, startTime: e.time, endTime: e.endTime, eventStatus: e.status }, now) !== 'ENDED';
}
