/**
 * True when a live stream was started for an event and has neither ended nor
 * been terminated. A stream can exist on an event whose package carries no
 * live-stream flag (free events), so cards must trust this, not the flag alone.
 */
export const hasActiveStream = (streamStatus?: string | null): boolean => {
  const s = (streamStatus || '').toLowerCase();
  return s !== '' && s !== 'ended' && s !== 'terminated';
};
