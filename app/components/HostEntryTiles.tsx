'use client';

/**
 * The photographer's entry to hosting: Go live (live-red tile) and My hosted events (blue tile with a count line).
 * Compact Glass affordance: a tinted fill, a 1px border that brightens on hover and focus, a solid icon tile, a
 * chevron, 52px tall, and a small press scale. Rendered only when the server says this account can host.
 */
import React from 'react';

function Tile({ href, tone, icon, title, caption, label }: { href: string; tone: 'live' | 'primary'; icon: string; title: string; caption: string; label: string }) {
  const rgb = tone === 'live' ? '230,18,32' : '31,107,255';
  const solid = tone === 'live' ? 'linear-gradient(135deg, #FF3B4E 0%, #C8001F 100%)' : 'linear-gradient(135deg, #3E6FD8 0%, #083A85 100%)';
  return (
    <a
      href={href}
      aria-label={label}
      className="ck-host-tile"
      style={{ ['--tile-rgb' as string]: rgb, display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: 10, borderRadius: 14, textDecoration: 'none',
        background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.55)`, color: 'inherit', flex: '1 1 220px', maxWidth: 320 }}
    >
      <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: solid, color: '#fff', flex: 'none' }}>
        <i className={`bi ${icon}`} style={{ fontSize: 17 }} />
      </span>
      <span style={{ display: 'grid', minWidth: 0, flex: 1 }}>
        <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
        <small style={{ opacity: 0.75 }}>{caption}</small>
      </span>
      <i className="bi bi-chevron-right" aria-hidden="true" style={{ opacity: 0.7 }} />
    </a>
  );
}

export default function HostEntryTiles({ caption }: { caption: string }) {
  return (
    <>
      <style>{`
        .ck-host-tile { transition: border-color .15s ease, transform .15s ease; }
        .ck-host-tile:hover, .ck-host-tile:focus-visible { border-color: rgba(var(--tile-rgb),0.9) !important; }
        .ck-host-tile:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
        .ck-host-tile:active { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) { .ck-host-tile { transition: none; } .ck-host-tile:active { transform: none; } }
      `}</style>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <Tile href="/user/photographer/host?new=1" tone="live" icon="bi-broadcast" title="Go live" caption="Host your own event" label="Go live. Host your own event" />
        <Tile href="/user/photographer/host" tone="primary" icon="bi-collection" title="My hosted events" caption={caption} label={`My hosted events. ${caption}`} />
      </div>
    </>
  );
}
