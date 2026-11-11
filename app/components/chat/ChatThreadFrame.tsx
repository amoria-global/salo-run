"use client";

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { buildTimeline } from './chatShared';

export type ThreadPartner = {
  name: string;
  image?: string;
  userType?: string;
  /** Present when the person has a public page to open. */
  profileHref?: string;
};

type ThreadMessage = { id: string; createdAt: string };

/**
 * The one message-list layout shared by every web chat surface (photographer inbox, client inbox).
 *
 * The frame is the scroll container, so the composer that sits below it in the page stays pinned and only the list
 * moves. Inside, a column grows to at least the frame's height and pushes its content to the bottom, so a short
 * conversation hugs the composer instead of leaving a gap above it. The intro sits directly above the first message and
 * a date separator opens each day.
 */
export function ChatThreadFrame<M extends ThreadMessage>({
  messages,
  partner,
  renderMessage,
  endRef,
}: {
  messages: M[];
  partner: ThreadPartner;
  renderMessage: (message: M, index: number) => React.ReactNode;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { colors } = useTheme();
  const timeline = buildTimeline(
    messages.map((m) => ({ ...m, timestamp: m.createdAt })),
    new Date(),
    { today: 'Today', yesterday: 'Yesterday' },
    'en-GB',
  );
  const indexById = new Map(messages.map((m, i) => [String(m.id), i]));

  return (
    <div
      className="mobile-messages-area"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        backgroundColor: colors.bgTertiary,
      }}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0.75rem 1rem 0.75rem',
          boxSizing: 'border-box',
        }}
      >
        <ThreadIntro partner={partner} />
        {/* The intro stays at the top; whatever room is left sits here, so the messages hug the composer. */}
        <div style={{ flexGrow: 1 }} />
        {timeline.map((item) => {
          if (item.kind === 'date') {
            return (
              <div
                key={item.key}
                role="separator"
                aria-label={item.label}
                style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: colors.textSecondary, margin: '0.5rem 0 0.75rem' }}
              >
                {item.label}
              </div>
            );
          }
          const original = messages[indexById.get(String(item.message.id)) ?? -1];
          if (!original) return null;
          return <React.Fragment key={item.key}>{renderMessage(original, indexById.get(String(original.id)) ?? 0)}</React.Fragment>;
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function ThreadIntro({ partner }: { partner: ThreadPartner }) {
  const { colors, actualTheme } = useTheme();
  const role = (partner.userType || '').toLowerCase().includes('photograph')
    ? 'Photographer'
    : (partner.userType || '').toLowerCase().includes('client')
      ? 'Client'
      : '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '1.25rem 0 1.5rem', textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #083A85, #3B82F6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: 700,
        }}
      >
        {partner.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          (partner.name || '?').trim().charAt(0).toUpperCase()
        )}
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, marginTop: 6 }}>{partner.name}</div>
      {role ? <div style={{ fontSize: '0.8rem', fontWeight: 500, color: colors.textSecondary }}>{role}</div> : null}
      <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 4 }}>
        Start of your conversation with {partner.name}
      </div>
      {partner.profileHref ? (
        <a
          href={partner.profileHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.85rem', fontWeight: 600, color: actualTheme === 'dark' ? '#93C5FD' : '#083A85', textDecoration: 'none', textTransform: 'none', padding: '0.5rem 0.75rem' }}
        >
          View profile
        </a>
      ) : null}
    </div>
  );
}

/**
 * Layout rules shared by the web chat surfaces. `.chat-viewport` is the page height: 100vh first as the fallback, then
 * 100dvh so a phone's collapsing address bar never hides the composer. The old per-page rules padded the list and the
 * composer by 5 to 10rem on a phone; that padding was the empty gap, and the frame and composer now size themselves.
 */
export function ChatLayoutStyles() {
  return (
    <style>{`
      .chat-viewport { height: 100vh; height: 100dvh; }
      .mobile-message-input-container { flex-shrink: 0; }
      @media (max-width: 768px) {
        .mobile-message-input-container {
          padding: 0.6rem 0.75rem calc(0.6rem + env(safe-area-inset-bottom)) !important;
          background: rgba(8, 58, 133, 0.02) !important;
          border-top: 1px solid rgba(8, 58, 133, 0.1) !important;
        }
      }
    `}</style>
  );
}
