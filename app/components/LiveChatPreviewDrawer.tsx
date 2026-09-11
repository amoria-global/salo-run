"use client";

import { useEffect, useRef, useState } from "react";
import { dashboardAuthFetch } from "@/app/providers/AuthProvider";
import { getApiUrl } from "@/lib/api";

/**
 * Slide-in drawer that lets a photographer read the live chat from
 * viewers without opening the public watch URL. Mirrors the chat-poll
 * shape the knockout viewer page uses (GET /api/remote/coordinator/
 * streams/{eventId}/chats every second), but renders compact bubbles
 * inside the dashboard and auto-scrolls to the bottom on every new
 * message.
 *
 * Reactions are filtered out client-side — they belong on the player
 * as floating emojis, not in a text-bubble preview meant for triage.
 */

interface ApiMessage {
  id: string;
  message?: string;
  content?: string;
  viewerUsername?: string;
  sender?: string;
  viewerAvatar?: string;
  avatar?: string;
  time?: string;
  timestamp?: string;
  createdAt?: string;
  chatType?: string;
  giftMeta?: string | Record<string, unknown>;
}

interface UiGift {
  emoji: string;
  name: string;
  amountUsd: number | null;
  note?: string;
}

interface UiMessage {
  id: string;
  text: string;
  sender: string;
  time: string;
  avatar: string | null;
  /** Present when the row is a GIFT — rendered as a highlighted bubble. */
  gift?: UiGift | null;
}

/** Defensive giftMeta parse: JSON string (or object) → UiGift, else null. */
function parseGiftMeta(raw: ApiMessage["giftMeta"]): UiGift | null {
  let meta: Record<string, unknown> | null = null;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") meta = parsed as Record<string, unknown>;
    } catch {
      meta = null;
    }
  } else if (raw && typeof raw === "object") {
    meta = raw as Record<string, unknown>;
  }
  if (!meta || !meta.name) return null;
  const amount = Number(meta.amountUsd);
  return {
    emoji: String(meta.emoji || "🎁"),
    name: String(meta.name),
    amountUsd: Number.isFinite(amount) ? amount : null,
    note: typeof meta.message === "string" && meta.message.trim() ? meta.message.trim() : undefined,
  };
}

const fmtUsd = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return r % 1 === 0
    ? r.toLocaleString()
    : r.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const DEFAULT_AVATAR_GRADIENT = "linear-gradient(135deg, #083A85 0%, #F20C8F 100%)";

export default function LiveChatPreviewDrawer({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}: {
  eventId: string | null;
  eventTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [polling, setPolling] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Reset when target event changes or drawer closes — otherwise we'd
    // bleed messages from the last event into the next one.
    if (!isOpen || !eventId) {
      seenIds.current = new Set();
      setMessages([]);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        setPolling(true);
        const base = getApiUrl().replace(/\/+$/, "");
        const res = await dashboardAuthFetch(
          `${base}/api/remote/coordinator/streams/${encodeURIComponent(eventId)}/chats?page=0&size=200`
        );
        if (cancelled) return;
        if (!res.ok) return;
        const json = (await res.json()) as { data?: ApiMessage[] };
        const rows = Array.isArray(json?.data) ? json.data : [];
        const fresh: UiMessage[] = [];
        for (const m of rows) {
          const id = String(m.id);
          if (seenIds.current.has(id)) continue;
          // REACTION rows belong on the player, not in the bubble list.
          if ((m.chatType || "").toUpperCase() === "REACTION") {
            seenIds.current.add(id);
            continue;
          }
          seenIds.current.add(id);
          const isGift = (m.chatType || "").toUpperCase() === "GIFT";
          const gift = isGift ? parseGiftMeta(m.giftMeta) : null;
          const text = String(m.message || m.content || "");
          // Gift rows with parsed meta can render without message text;
          // everything else needs a non-empty body.
          if (!text.trim() && !gift) continue;
          const sender = (m.viewerUsername || m.sender || "Viewer") as string;
          const raw = (m.createdAt || m.timestamp || "") as string;
          const time = m.time
            ? String(m.time)
            : raw
              ? new Date(raw).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";
          fresh.push({
            id,
            text,
            sender,
            time,
            avatar: (m.viewerAvatar || m.avatar || null) as string | null,
            gift: isGift ? gift : undefined,
          });
        }
        if (fresh.length) {
          setMessages((prev) => [...prev, ...fresh]);
        }
      } finally {
        if (!cancelled) setPolling(false);
      }
    };

    poll();
    timer = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isOpen, eventId]);

  useEffect(() => {
    // Auto-scroll to bottom on every new batch; defer one frame so the
    // newly-rendered row contributes to scrollHeight before we measure.
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages.length]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop. Click closes. The drawer itself stops propagation so
          clicks inside don't dismiss it. */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
      />
      <aside
        role="dialog"
        aria-label={`Live chat preview for ${eventTitle || "stream"}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(380px, 92vw)",
          background: "#0f1219",
          color: "#e2e8f0",
          boxShadow: "-12px 0 32px rgba(0,0,0,0.45)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, #1a2238 0%, #11141d 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>
              Live chat preview
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {eventTitle || "Stream"}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 20,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Message list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                color: "#64748b",
                fontSize: 13,
                padding: "0 24px",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 6 }}>
                <i className="bi bi-chat-square-text" />
              </div>
              <div>No messages yet.</div>
              <div style={{ fontSize: 11, marginTop: 4, color: "#475569" }}>
                {polling ? "Listening for viewer messages…" : ""}
              </div>
            </div>
          ) : (
            messages.map((m) => (m.gift !== undefined ? <GiftRow key={m.id} m={m} /> : <ChatRow key={m.id} m={m} />))
          )}
        </div>

        {/* Footer note */}
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            color: "#475569",
            fontSize: 11,
            textAlign: "center",
            background: "#0a0d14",
          }}
        >
          Read-only preview. Replies go from the viewer-side watch page.
        </div>
      </aside>
    </>
  );
}

/**
 * Highlighted bubble for GIFT rows: pink-tinted surface, gift emoji in a
 * gradient coin, sender + gift name + $amount. Falls back to the row's
 * plain message text when giftMeta didn't parse.
 */
function GiftRow({ m }: { m: UiMessage }) {
  const gift = m.gift ?? null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "8px 10px",
        margin: "2px 0",
        borderRadius: 10,
        background: "linear-gradient(135deg, rgba(242,12,143,0.16) 0%, rgba(8,58,133,0.14) 100%)",
        border: "1px solid rgba(242,12,143,0.35)",
        boxShadow: "0 2px 8px rgba(242,12,143,0.10)",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: DEFAULT_AVATAR_GRADIENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          lineHeight: 1,
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        {gift ? gift.emoji : "🎁"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "50%",
            }}
          >
            {m.sender}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#F20C8F",
              background: "rgba(242,12,143,0.14)",
              border: "1px solid rgba(242,12,143,0.30)",
              borderRadius: 9999,
              padding: "1px 7px",
              flexShrink: 0,
            }}
          >
            Gift
          </span>
          <span style={{ fontSize: 10, color: "#64748b", flexShrink: 0, marginLeft: "auto" }}>{m.time}</span>
        </div>
        {gift ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>
              sent a {gift.name}
            </span>
            {gift.amountUsd !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#FF3DA0",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${fmtUsd(gift.amountUsd)}
              </span>
            )}
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.35,
              color: "#e2e8f0",
              fontWeight: 600,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {m.text}
          </p>
        )}
        {gift?.note && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 11,
              lineHeight: 1.35,
              color: "#94a3b8",
              fontStyle: "italic",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            “{gift.note}”
          </p>
        )}
      </div>
    </div>
  );
}

function ChatRow({ m }: { m: UiMessage }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "4px 6px",
        borderRadius: 6,
        transition: "background 120ms",
      }}
    >
      {m.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.avatar}
          alt=""
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            objectFit: "cover",
            marginTop: 2,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: DEFAULT_AVATAR_GRADIENT,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          {m.sender.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 1 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "55%",
            }}
          >
            {m.sender}
          </span>
          <span style={{ fontSize: 10, color: "#64748b", flexShrink: 0 }}>{m.time}</span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.35,
            color: "#cbd5e1",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {m.text}
        </p>
      </div>
    </div>
  );
}
