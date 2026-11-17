'use client';

/**
 * Building blocks for every redesigned page in Compact Glass, taken from the Home blueprint: page header, segmented
 * switch, status chip, list row, glass modal and the three states (loading, empty, error with Retry). Styles are in
 * app/glass-ui.css and only apply under html.ui-glass, so nothing here changes the old UI.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
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
