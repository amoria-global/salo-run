'use client';

/**
 * Building blocks for every redesigned page in Compact Glass, taken from the Home blueprint: page header, segmented
 * switch, status chip, list row, glass modal and the three states (loading, empty, error with Retry). Styles are in
 * app/glass-ui.css and only apply under html.ui-glass, so nothing here changes the old UI.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, Inbox, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

export function PageHeader({ title, subtitle, action, eyebrow }: { title: string; subtitle?: string; action?: ReactNode; eyebrow?: string }) {
  const { t } = useLanguage();
  return (
    <header className="gp-head">
      <div className="gp-head-text">
        {eyebrow && <div className="gh-eyebrow">{t(eyebrow)}</div>}
        <h1 className="g-display gp-title">{t(title)}</h1>
        {subtitle && <p className="gp-sub">{t(subtitle)}</p>}
      </div>
      {action && <div className="gp-head-action">{action}</div>}
    </header>
  );
}

export interface SegOption<T extends string> { key: T; label: string; count?: number | null }

/** The Home period switch: one row of pills, one selected, keyboard arrows move between them. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: SegOption<T>[]; value: T; onChange: (k: T) => void; label: string }) {
  const { t } = useLanguage();
  const move = (i: number, d: number) => {
    const n = options[(i + d + options.length) % options.length];
    onChange(n.key);
  };
  return (
    <div className="gp-seg" role="tablist" aria-label={t(label)}>
      {options.map((o, i) => (
        <button key={o.key} type="button" role="tab" aria-selected={value === o.key} tabIndex={value === o.key ? 0 : -1}
          className={`gp-seg-btn${value === o.key ? ' is-on' : ''}`} onClick={() => onChange(o.key)}
          onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); move(i, 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); move(i, -1); } }}>
          {t(o.label)}{typeof o.count === 'number' ? <span className="gp-seg-count">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export type Tone = 'success' | 'pending' | 'error' | 'info' | 'neutral' | 'accent';

/** Upcoming / Live / Pending style chip. The colour never carries the meaning alone: it always has text. */
export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`gp-chip gp-chip-${tone}`}>{children}</span>;
}

export function DateTile({ date }: { date: string | Date | null | undefined }) {
  const { language } = useLanguage();
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return <span className="gp-tile" aria-hidden><b>–</b></span>;
  return (
    <span className="gp-tile" aria-hidden>
      <b className="g-num">{d.getDate()}</b>
      <small>{d.toLocaleDateString(language || 'en', { month: 'short' }).toUpperCase()}</small>
    </span>
  );
}

/** A list row like Upcoming / Recent activity: lead (date tile or icon), title, subtitle, amount, chip. */
export function Row({ lead, title, subtitle, amount, chip, href, onClick, id }: {
  lead?: ReactNode; title: ReactNode; subtitle?: ReactNode; amount?: ReactNode; chip?: ReactNode; href?: string; onClick?: () => void; id?: string;
}) {
  const body = (
    <>
      {lead}
      <span className="gp-row-text"><strong className="g-ellipsis">{title}</strong>{subtitle ? <small className="g-ellipsis">{subtitle}</small> : null}</span>
      {amount ? <span className="gp-row-amount g-num">{amount}</span> : null}
      {chip}
    </>
  );
  if (href) return <Link id={id} href={href} className="gp-row">{body}</Link>;
  if (onClick) return <button id={id} type="button" className="gp-row" onClick={onClick}>{body}</button>;
  return <div id={id} className="gp-row">{body}</div>;
}

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return <section {...rest} className={`g-panel gp-card ${className}`.trim()}>{children}</section>;
}

/* ── states ───────────────────────────────────────────────────────────────────────────────────────────────────── */

export function RowsSkeleton({ rows = 4, height = 56 }: { rows?: number; height?: number }) {
  const { t } = useLanguage();
  return (
    <div className="gp-skel" role="status" aria-busy="true" aria-label={t('Loading')}>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="g-skeleton" style={{ height, borderRadius: 14 }} />)}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="gh-empty gp-empty" role="status">
      <span className="gh-empty-icon" aria-hidden>{icon ?? <Inbox size={20} />}</span>
      <strong>{t(title)}</strong>
      {body && <small>{t(body)}</small>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="gh-error gp-error" role="alert">
      <AlertTriangle size={22} aria-hidden style={{ color: 'var(--g-error)' }} />
      <span>{message ? t(message) : t('Something went wrong. Please try again.')}</span>
      {onRetry && <button type="button" className="g-btn g-btn-ghost" onClick={onRetry}><RefreshCw size={14} aria-hidden /> {t('Retry')}</button>}
    </div>
  );
}

/* ── modal ────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** Glass dialog: Escape and a click outside close it, focus moves in and returns, one blurred layer (the scrim). */
export function GlassModal({ title, onClose, children, footer, width = 440 }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  const { t } = useLanguage();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="gp-scrim g-blur" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className="g-panel gp-modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <h2 id={id} className="g-display gp-modal-title">{t(title)}</h2>
        <div className="gp-modal-body">{children}</div>
        {footer && <div className="gp-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Every destructive action goes through this. */
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel = 'Cancel', busy, onConfirm, onClose, danger = true }: {
  title: string; body?: string; confirmLabel: string; cancelLabel?: string; busy?: boolean; onConfirm: () => void; onClose: () => void; danger?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <GlassModal title={title} onClose={onClose} footer={
      <>
        <button type="button" className="g-btn g-btn-ghost" onClick={onClose}>{t(cancelLabel)}</button>
        <button type="button" className={`g-btn ${danger ? 'gp-btn-danger' : 'g-btn-primary'}`} disabled={busy} onClick={onConfirm}>{busy ? t('Please wait…') : t(confirmLabel)}</button>
      </>
    }>
      {body && <p className="gp-sub" style={{ margin: 0 }}>{t(body)}</p>}
    </GlassModal>
  );
}

/* ── overflow menu ────────────────────────────────────────────────────────────────────────────────────────────── */

export interface MenuItem { key: string; label: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean }

/** The ⋯ button and its menu: outside click and Escape close it, arrow keys move between items, focus returns. */
export function OverflowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const list = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not(:disabled)') ?? [])];
      if (!list.length) return;
      e.preventDefault();
      const i = list.indexOf(document.activeElement as HTMLButtonElement);
      list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length].focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    root.current?.querySelector<HTMLButtonElement>('[role=menuitem]:not(:disabled)')?.focus();
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="gp-menu-wrap" ref={root}>
      <button ref={btn} type="button" className="g-icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label={label}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <MoreHorizontal size={18} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="g-panel gp-menu" onClick={(e) => e.stopPropagation()}>
          {items.map((it) => (
            <button key={it.key} type="button" role="menuitem" disabled={it.disabled}
              className={`gp-menu-item${it.danger ? ' gp-menu-danger' : ''}`} onClick={() => { setOpen(false); it.onSelect(); }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── avatar ───────────────────────────────────────────────────────────────────────────────────────────────────── */

/** "Solange Ahishakiye" -> "SA"; one word -> its first two letters. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A photo, or initials on the brand gradient when there is none or it fails to load (white text >= 4.5:1). */
export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="gp-avatar" src={src} alt="" style={style} loading="lazy" onError={() => setBroken(true)} />;
  }
  return <span className="gp-avatar gp-avatar-initials" style={style} aria-hidden>{initialsOf(name)}</span>;
}

/* ── windowed list ────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Renders only the rows near the viewport for long lists of fixed-height rows (the page scrolls, not the list).
 * Below `threshold` rows everything renders, so short lists behave exactly like a plain map.
 */
export function VirtualRows<T>({ items, rowHeight, render, threshold = 60, overscan = 8, className, role }: {
  items: T[]; rowHeight: number; render: (item: T, index: number) => ReactNode; threshold?: number; overscan?: number; className?: string; role?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<[number, number]>([0, Math.min(items.length, threshold)]);
  const on = items.length > threshold;
  useEffect(() => {
    if (!on) return;
    // The nearest scrolling ancestor (an inbox pane, the page host), else the window.
    let scroller: HTMLElement | null = ref.current?.parentElement ?? null;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const update = () => {
      const el = ref.current; if (!el) return;
      const box = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const top = el.getBoundingClientRect().top - box.top;
      const vh = box.height;
      const first = Math.max(0, Math.floor(-top / rowHeight) - overscan);
      const last = Math.min(items.length, Math.ceil((vh - top) / rowHeight) + overscan);
      setRange((r) => (r[0] === first && r[1] === last ? r : [first, last]));
    };
    update();
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { target.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [on, items.length, rowHeight, overscan]);
  if (!on) return <div ref={ref} className={className} role={role}>{items.map(render)}</div>;
  const [a, b] = range;
  return (
    <div ref={ref} className={className} role={role} style={{ position: 'relative' }}>
      <div style={{ height: a * rowHeight }} aria-hidden />
      {items.slice(a, b).map((it, i) => render(it, a + i))}
      <div style={{ height: (items.length - b) * rowHeight }} aria-hidden />
    </div>
  );
}
