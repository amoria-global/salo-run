"use client";

import { useEffect, useRef, useState } from "react";
import { dashboardAuthFetch } from "@/app/providers/AuthProvider";
import { getApiUrl } from "@/lib/api";

/**
 * TikTok-style gifting overlay for the streamer's own preview player.
 *
 * Polls the coordinator chat feed every 2s while `active`, and renders
 * four pointer-events-none layers inside the (relative) video container:
 *
 *   1. Gift banner stack, top-left  — pink→navy gradient pills with the
 *      gift emoji, sender, amount, and a combo counter that increments
 *      when the same sender+gift arrives again within ~4s.
 *   2. Floating reactions, bottom-right — REACTION emojis rise, sway and
 *      fade over ~2.5s, staggered 120ms per batch.
 *   3. Big-gift takeover, centered — emoji burst + label for gifts whose
 *      giftMeta.bigAnimation is true (queued so bursts never overlap).
 *   4. Session earnings chip, top-right — running $total and gift count
 *      for gifts received since the overlay mounted.
 *
 * The FIRST poll batch marks every existing row as seen WITHOUT
 * animating or counting, so opening the preview mid-stream never
 * replays the whole gift history as a banner storm.
 *
 * Designed in app/_design-sandbox/StreamGiftOverlay.preview.tsx first
 * (greenfield sandbox); visuals ported 1:1 from that mockup.
 */

const NAVY = "#083A85";
const PINK = "#F20C8F";

interface StreamGiftOverlayProps {
  eventId: string;
  /** Poll only while true (preview modal open/visible). */
  active: boolean;
  /** Push the banner stack down to clear player chrome (LIVE badge). */
  topLeftOffset?: number;
  /** Push the earnings chip down to clear player chrome (viewer pill / camera thumb). */
  topRightOffset?: number;
}

interface ApiChatRow {
  id: string | number;
  chatType?: string;
  message?: string;
  content?: string;
  viewerUsername?: string;
  giftMeta?: string | Record<string, unknown>;
}

interface GiftInfo {
  sender: string;
  code: string;
  name: string;
  emoji: string;
  amountUsd: number;
  big: boolean;
  /** Set when giftMeta was missing/unparseable — render this raw text instead. */
  fallbackText: string | null;
}

interface Banner {
  id: string;
  key: string;
  sender: string;
  detail: string;
  emoji: string;
  combo: number;
  leaving: boolean;
}

interface Floater {
  id: string;
  emoji: string;
  right: number;
  amp: number;
  swayDur: number;
}

interface Takeover {
  id: string;
  sender: string;
  name: string;
  emoji: string;
}

let seq = 0;
const uid = () => `sgo-${++seq}-${Date.now().toString(36)}`;

const fmtUsd = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 100) / 100;
  return r % 1 === 0
    ? r.toLocaleString()
    : r.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Cap a reaction payload to a handful of code points so a stray text
 *  message can't float across the player (ZWJ emoji stay intact). */
const clampEmoji = (s: string) => Array.from(s.trim()).slice(0, 8).join("");

const parseGift = (row: ApiChatRow): GiftInfo => {
  let meta: Record<string, unknown> | null = null;
  if (typeof row.giftMeta === "string" && row.giftMeta.trim()) {
    try {
      const parsed = JSON.parse(row.giftMeta);
      if (parsed && typeof parsed === "object") meta = parsed as Record<string, unknown>;
    } catch {
      meta = null;
    }
  } else if (row.giftMeta && typeof row.giftMeta === "object") {
    meta = row.giftMeta as Record<string, unknown>;
  }

  const sender = String((meta?.senderName as string) || row.viewerUsername || "Someone");
  if (!meta || !meta.name) {
    return {
      sender,
      code: "",
      name: "gift",
      emoji: "🎁",
      amountUsd: typeof meta?.amountUsd === "number" ? (meta.amountUsd as number) : 0,
      big: false,
      fallbackText: String(row.message || row.content || "sent a gift"),
    };
  }
  const amount = Number(meta.amountUsd);
  return {
    sender,
    code: String(meta.code || meta.name),
    name: String(meta.name),
    emoji: String(meta.emoji || "🎁"),
    amountUsd: Number.isFinite(amount) ? amount : 0,
    big: meta.bigAnimation === true,
    fallbackText: null,
  };
};

export default function StreamGiftOverlay({
  eventId,
  active,
  topLeftOffset = 12,
  topRightOffset = 12,
}: StreamGiftOverlayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [takeover, setTakeover] = useState<Takeover | null>(null);
  const [totalUsd, setTotalUsd] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [bumpKey, setBumpKey] = useState(0);

  const seenIds = useRef<Set<string>>(new Set());
  const firstBatch = useRef(true);
  const comboAt = useRef<Map<string, number>>(new Map());
  const bannerTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const transientTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const takeoverQueue = useRef<Takeover[]>([]);
  const takeoverBusy = useRef(false);

  useEffect(() => {
    if (!active || !eventId) return;

    let cancelled = false;
    // Fresh session guard: mark everything already in the feed as seen on
    // the first batch so (re)opening mid-stream never replays history.
    seenIds.current = new Set();
    firstBatch.current = true;

    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        transientTimers.current.delete(t);
        if (!cancelled) fn();
      }, ms);
      transientTimers.current.add(t);
    };

    const scheduleDismiss = (bannerId: string) => {
      const timers = bannerTimers.current;
      const old = timers.get(bannerId);
      if (old) clearTimeout(old);
      timers.set(
        bannerId,
        setTimeout(() => {
          if (cancelled) return;
          setBanners((prev) => prev.map((b) => (b.id === bannerId ? { ...b, leaving: true } : b)));
          timers.set(
            bannerId,
            setTimeout(() => {
              if (cancelled) return;
              setBanners((prev) => prev.filter((b) => b.id !== bannerId));
              timers.delete(bannerId);
            }, 260)
          );
        }, 3500)
      );
    };

    const runTakeoverQueue = () => {
      const next = takeoverQueue.current.shift();
      if (!next) {
        takeoverBusy.current = false;
        setTakeover(null);
        return;
      }
      takeoverBusy.current = true;
      setTakeover(next);
      later(runTakeoverQueue, 2600);
    };

    const pushGiftBanner = (g: GiftInfo) => {
      const now = Date.now();
      const key = `${g.sender}|${g.code || g.name}`;
      const last = comboAt.current.get(key) || 0;
      comboAt.current.set(key, now);
      const withinCombo = now - last <= 4200;

      setBanners((prev) => {
        const existing = prev.find((b) => b.key === key && !b.leaving);
        if (existing && withinCombo && !g.fallbackText) {
          scheduleDismiss(existing.id);
          return prev.map((b) => (b.id === existing.id ? { ...b, combo: b.combo + 1 } : b));
        }
        const banner: Banner = {
          id: uid(),
          key,
          sender: g.sender,
          detail: g.fallbackText ?? `sent a ${g.name} · $${fmtUsd(g.amountUsd)}`,
          emoji: g.emoji,
          combo: 1,
          leaving: false,
        };
        scheduleDismiss(banner.id);
        return [...prev, banner].slice(-3);
      });

      if (g.big) {
        takeoverQueue.current.push({ id: uid(), sender: g.sender, name: g.name, emoji: g.emoji });
        if (takeoverQueue.current.length > 3) {
          takeoverQueue.current.splice(0, takeoverQueue.current.length - 3);
        }
        if (!takeoverBusy.current) runTakeoverQueue();
      }
    };

    const pushReactions = (emojis: string[]) => {
      emojis.forEach((emoji, i) => {
        later(() => {
          const f: Floater = {
            id: uid(),
            emoji,
            right: Math.round(Math.random() * 40),
            amp: 5 + Math.round(Math.random() * 9),
            swayDur: 900 + Math.round(Math.random() * 700),
          };
          setFloaters((prev) => [...prev.slice(-24), f]);
          later(() => setFloaters((prev) => prev.filter((x) => x.id !== f.id)), 2600);
        }, i * 120);
      });
    };

    const poll = async () => {
      try {
        const base = getApiUrl().replace(/\/+$/, "");
        const res = await dashboardAuthFetch(
          `${base}/api/remote/coordinator/streams/${encodeURIComponent(eventId)}/chats?page=0&size=200`
        );
        if (cancelled || !res.ok) return;
        const json = (await res.json().catch(() => null)) as { data?: ApiChatRow[] } | null;
        if (cancelled) return;
        const rows = Array.isArray(json?.data) ? (json!.data as ApiChatRow[]) : [];

        if (firstBatch.current) {
          for (const row of rows) seenIds.current.add(String(row.id));
          firstBatch.current = false;
          return;
        }

        const gifts: GiftInfo[] = [];
        const reactions: string[] = [];
        for (const row of rows) {
          const id = String(row.id);
          if (seenIds.current.has(id)) continue;
          seenIds.current.add(id);
          const type = String(row.chatType || "").toUpperCase();
          if (type === "GIFT") {
            gifts.push(parseGift(row));
          } else if (type === "REACTION") {
            const emoji = clampEmoji(String(row.message || row.content || ""));
            if (emoji) reactions.push(emoji);
          }
        }

        if (gifts.length) {
          let sum = 0;
          for (const g of gifts) {
            sum += g.amountUsd;
            pushGiftBanner(g);
          }
          setTotalUsd((t) => t + sum);
          setGiftCount((c) => c + gifts.length);
          setBumpKey((k) => k + 1);
        }
        if (reactions.length) pushReactions(reactions.slice(0, 18));
      } catch {
        /* ignore poll errors; next tick retries */
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    const timers = bannerTimers.current;
    const transients = transientTimers.current;
    return () => {
      cancelled = true;
      clearInterval(interval);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      transients.forEach((t) => clearTimeout(t));
      transients.clear();
      takeoverQueue.current = [];
      takeoverBusy.current = false;
      setBanners([]);
      setFloaters([]);
      setTakeover(null);
    };
  }, [active, eventId]);

  if (!active) return null;

  return (
    <div className="sgo-root" aria-hidden>
      {/* 1 — Gift banner stack, top-left */}
      <div className="sgo-banners" style={{ top: topLeftOffset }}>
        {banners.map((b) => (
          <div key={b.id} className={`sgo-banner${b.leaving ? " sgo-banner-leaving" : ""}`}>
            <span className="sgo-banner-emoji">{b.emoji}</span>
            <span className="sgo-banner-text">
              <span className="sgo-banner-sender">{b.sender}</span>
              <span className="sgo-banner-detail">{b.detail}</span>
            </span>
            {b.combo > 1 && (
              <span key={`combo-${b.combo}`} className="sgo-combo">
                <em>×</em>
                {b.combo}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 2 — Floating reactions, bottom-right */}
      <div className="sgo-floaters">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="sgo-floater"
            style={{ right: f.right, ["--amp" as never]: `${f.amp}px`, ["--swayDur" as never]: `${f.swayDur}ms` }}
          >
            <span className="sgo-floater-inner">{f.emoji}</span>
          </span>
        ))}
      </div>

      {/* 3 — Big-gift takeover, centered */}
      {takeover && (
        <div key={takeover.id} className="sgo-takeover">
          <span className="sgo-burst-ring" />
          <span className="sgo-burst-ring sgo-burst-ring-2" />
          <span className="sgo-burst-emoji">{takeover.emoji}</span>
          <span className="sgo-burst-label">
            <strong>{takeover.sender}</strong>&nbsp;sent a {takeover.name}!
          </span>
        </div>
      )}

      {/* 4 — Session earnings chip, top-right */}
      {giftCount > 0 && (
        <div className="sgo-chip" style={{ top: topRightOffset }}>
          <span className="sgo-chip-icon">🎁</span>
          <span key={`bump-${bumpKey}`} className="sgo-chip-bump">
            ${fmtUsd(totalUsd)}
          </span>
          <span className="sgo-chip-sep" />
          <span className="sgo-chip-count">
            {giftCount} gift{giftCount === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <style>{`
        .sgo-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 6;
          font-family: inherit;
        }

        /* ---- gift banners -------------------------------------- */
        .sgo-banners {
          position: absolute;
          left: 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          max-width: min(78%, 340px);
        }
        .sgo-banner {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px 7px 8px;
          border-radius: 9999px;
          background: linear-gradient(100deg, rgba(242,12,143,0.94) 0%, rgba(140,24,128,0.94) 46%, rgba(8,58,133,0.94) 100%);
          border: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 10px 26px rgba(242,12,143,0.35), 0 2px 8px rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: sgoBannerIn 0.38s cubic-bezier(0.22, 1.2, 0.36, 1) both;
          max-width: 100%;
        }
        .sgo-banner-leaving {
          animation: sgoBannerOut 0.26s ease-in forwards;
        }
        .sgo-banner-emoji {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.28);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          line-height: 1;
        }
        .sgo-banner-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 1px;
        }
        .sgo-banner-sender {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        .sgo-banner-detail {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .sgo-combo {
          flex-shrink: 0;
          display: inline-flex;
          align-items: baseline;
          margin-left: 2px;
          font-size: 20px;
          font-weight: 900;
          font-style: italic;
          color: #fff;
          text-shadow: 0 2px 6px rgba(0,0,0,0.35);
          animation: sgoComboPop 0.34s cubic-bezier(0.22, 1.4, 0.36, 1) both;
        }
        .sgo-combo em {
          font-size: 13px;
          font-weight: 800;
          margin-right: 1px;
        }

        /* ---- floating reactions --------------------------------- */
        .sgo-floaters {
          position: absolute;
          right: 12px;
          bottom: 10px;
          width: 72px;
          height: 220px;
        }
        .sgo-floater {
          position: absolute;
          bottom: 0;
          font-size: 26px;
          line-height: 1;
          animation: sgoRise 2.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          will-change: transform, opacity;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
        }
        .sgo-floater-inner {
          display: inline-block;
          animation: sgoSway var(--swayDur, 1300ms) ease-in-out infinite alternate;
        }

        /* ---- big-gift takeover ----------------------------------- */
        .sgo-takeover {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }
        .sgo-burst-ring {
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          border: 3px solid rgba(242,12,143,0.65);
          box-shadow: 0 0 40px rgba(242,12,143,0.45), inset 0 0 30px rgba(242,12,143,0.25);
          animation: sgoRing 1.1s ease-out both;
        }
        .sgo-burst-ring-2 {
          border-color: rgba(255,255,255,0.5);
          animation-delay: 0.18s;
        }
        .sgo-burst-emoji {
          font-size: 92px;
          line-height: 1;
          filter: drop-shadow(0 10px 30px rgba(242,12,143,0.55));
          animation: sgoBurst 2.5s cubic-bezier(0.22, 1.3, 0.36, 1) both;
        }
        .sgo-burst-label {
          padding: 7px 18px;
          border-radius: 9999px;
          background: linear-gradient(100deg, rgba(242,12,143,0.95) 0%, rgba(8,58,133,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.005em;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          animation: sgoLabel 2.5s ease both;
          white-space: nowrap;
          max-width: 86%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sgo-burst-label strong { font-weight: 900; }

        /* ---- earnings chip --------------------------------------- */
        .sgo-chip {
          position: absolute;
          right: 10px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          color: #fff;
          background:
            linear-gradient(rgba(10,14,26,0.82), rgba(10,14,26,0.82)) padding-box,
            linear-gradient(100deg, ${PINK} 0%, ${NAVY} 100%) border-box;
          border: 1px solid transparent;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.40);
          animation: sgoChipIn 0.3s ease both;
        }
        .sgo-chip-icon { font-size: 13px; line-height: 1; }
        .sgo-chip-bump {
          font-weight: 900;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
          animation: sgoBump 0.42s cubic-bezier(0.22, 1.4, 0.36, 1) both;
        }
        .sgo-chip-sep {
          width: 1px;
          height: 12px;
          background: rgba(255,255,255,0.25);
        }
        .sgo-chip-count {
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          white-space: nowrap;
        }

        /* ---- keyframes -------------------------------------------- */
        @keyframes sgoBannerIn {
          from { opacity: 0; transform: translateX(-26px) scale(0.9); }
          60%  { opacity: 1; transform: translateX(4px) scale(1.02); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes sgoBannerOut {
          to { opacity: 0; transform: translateX(-18px) scale(0.94); }
        }
        @keyframes sgoComboPop {
          0%   { transform: scale(0.4); opacity: 0; }
          45%  { transform: scale(1.55); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sgoRise {
          0%   { opacity: 0; transform: translateY(0) scale(0.5); }
          12%  { opacity: 1; transform: translateY(-18px) scale(1); }
          72%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-180px) scale(1.05); }
        }
        @keyframes sgoSway {
          from { transform: translateX(calc(var(--amp, 8px) * -1)); }
          to   { transform: translateX(var(--amp, 8px)); }
        }
        @keyframes sgoBurst {
          0%   { opacity: 0; transform: scale(0.2) rotate(-8deg); }
          16%  { opacity: 1; transform: scale(1.18) rotate(3deg); }
          28%  { transform: scale(1) rotate(0deg); }
          78%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        @keyframes sgoRing {
          0%   { opacity: 0.9; transform: scale(0.25); }
          100% { opacity: 0; transform: scale(1.7); }
        }
        @keyframes sgoLabel {
          0%   { opacity: 0; transform: translateY(12px); }
          14%  { opacity: 1; transform: translateY(0); }
          82%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes sgoChipIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sgoBump {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }

        /* ---- reduced motion --------------------------------------- */
        @media (prefers-reduced-motion: reduce) {
          .sgo-banner, .sgo-banner-leaving, .sgo-combo, .sgo-floater,
          .sgo-floater-inner, .sgo-burst-emoji, .sgo-burst-ring,
          .sgo-burst-label, .sgo-chip, .sgo-chip-bump {
            animation: none !important;
          }
          .sgo-banner-leaving { opacity: 0; transition: opacity 0.2s; }
          .sgo-floater { opacity: 0.9; }
          .sgo-burst-ring { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
