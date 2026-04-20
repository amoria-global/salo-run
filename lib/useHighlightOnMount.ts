'use client';

import { useEffect, useState } from 'react';

/**
 * Reads the `highlight` query param on mount, clears it from the URL so
 * back/forward navigation or reloads don't re-trigger the effect, and returns
 * the captured id. Destination pages use the returned value to scroll-to and
 * pop-animate the matching row — typically set via a "Go to notification" CTA
 * in the notifications modal.
 *
 * Returns `null` until the effect has run (or if no param was present), so
 * callers should treat it as "the currently-highlighted id, if any."
 */
export function useHighlightOnMount(): string | null {
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('highlight');
    if (!id) return;

    setHighlightId(id);

    // Strip the param so refresh/back doesn't replay the animation.
    params.delete('highlight');
    const qs = params.toString();
    const newUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }, []);

  return highlightId;
}

/**
 * Inline style for the "pop" effect on the highlighted row/card.
 * Pair with <style jsx global> or a shared keyframe in globals.css.
 */
export const HIGHLIGHT_POP_STYLE: React.CSSProperties = {
  animation: 'notifHighlightPop 1.6s ease-out',
};

/**
 * CSS to inject once (e.g. in a layout or globals.css). Exported so a caller
 * can drop it inline via <style jsx global> without maintaining it in a
 * separate stylesheet.
 */
export const HIGHLIGHT_POP_KEYFRAMES = `
  @keyframes notifHighlightPop {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
    15% { transform: scale(1.025); box-shadow: 0 0 0 6px rgba(59,130,246,0.35); }
    40% { transform: scale(1); box-shadow: 0 0 0 6px rgba(59,130,246,0.25); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  }
`;
