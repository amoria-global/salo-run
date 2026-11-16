'use client';

/**
 * Earnings (area, left axis, money in the viewer's currency) and bookings (dashed line, right axis, counts) for the
 * selected period. Hand-made SVG, no chart library; loaded lazily by the Home. Fixed height so data arriving never
 * shifts the layout. Hover, tap or arrow keys show a point's tooltip. All-zero data shows an empty state instead of
 * a blank grid.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useLanguage } from '@/app/context/LanguageContext';
import type { PerfPoint } from './useHomeData';

const H = 240, PAD = { l: 52, r: 36, t: 16, b: 28 };

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};
const compact = (v: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export default function PerformanceChart({ points, moneyHidden }: { points: PerfPoint[]; moneyHidden?: boolean }) {
  const { t } = useLanguage();
  const { priceParts } = useCurrency();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Earnings arrive in USD; the chart shows them in the viewer's currency.
  const money = useMemo(() => points.map((p) => priceParts(Number(p.value1) || 0)), [points, priceParts]);
  const earn = money.map((m) => m.value);
  const book = points.map((p) => Number(p.value2) || 0);
  const empty = points.length === 0 || (earn.every((v) => v === 0) && book.every((v) => v === 0));

  const maxE = niceMax(Math.max(...earn, 0)), maxB = niceMax(Math.max(...book, 0));
  const iw = w - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length <= 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const yE = (v: number) => PAD.t + ih - (v / maxE) * ih;
  const yB = (v: number) => PAD.t + ih - (v / maxB) * ih;
  const line = (ys: number[]) => ys.map((y, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y.toFixed(1)}`).join(' ');
  const earnPath = line(earn.map(yE));
  const area = `${earnPath} L${x(points.length - 1).toFixed(1)},${PAD.t + ih} L${x(0).toFixed(1)},${PAD.t + ih} Z`;
  const code = money[0] ? (money[0].tight ? money[0].prefix : money[0].code) : '';

  if (empty) {
    return (
      <div ref={box} style={{ height: H, display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--g-text-muted)' }}>
        <div>
          <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden><path d="M2 34 L18 26 L30 30 L44 14 L62 18" fill="none" stroke="var(--g-border)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 5" /></svg>
          <p style={{ margin: '8px 0 2px', fontWeight: 600, color: 'var(--g-text-soft)' }}>{t('No earnings in this period yet')}</p>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>{t('Paid bookings and sales will show here.')}</p>
        </div>
      </div>
    );
  }

  const tip = sel != null ? { i: sel, e: money[sel], b: book[sel], label: points[sel].date || points[sel].day } : null;
  return (
    <div ref={box} style={{ position: 'relative', height: H }}
      onMouseLeave={() => setSel(null)}>
      <svg width={w} height={H} role="img" aria-label={t('Earnings and bookings chart')}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left - PAD.l) / iw) * (points.length - 1));
          setSel(Math.max(0, Math.min(points.length - 1, i)));
        }}>
        <defs>
          <linearGradient id="g-earn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--g-primary-light)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--g-primary-light)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.l} x2={w - PAD.r} y1={PAD.t + ih * (1 - f)} y2={PAD.t + ih * (1 - f)} stroke="var(--g-stroke)" />
            {!moneyHidden && <text x={PAD.l - 8} y={PAD.t + ih * (1 - f) + 4} textAnchor="end" fontSize="11" fill="var(--g-text-muted)">{compact(maxE * f)}</text>}
            <text x={w - PAD.r + 8} y={PAD.t + ih * (1 - f) + 4} fontSize="11" fill="var(--g-text-muted)">{Math.round(maxB * f)}</text>
          </g>
        ))}
        {!moneyHidden && <text x={8} y={PAD.t - 4} fontSize="10" fill="var(--g-text-muted)">{code}</text>}
        {!moneyHidden && <path d={area} fill="url(#g-earn)" />}
        {!moneyHidden && <path d={earnPath} fill="none" stroke="var(--g-primary-light)" strokeWidth="2.5" strokeLinejoin="round" />}
        <path d={line(book.map(yB))} fill="none" stroke="var(--g-accent)" strokeWidth="2" strokeDasharray="5 5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--g-text-muted)">
            {points.length > 10 && i % Math.ceil(points.length / 8) !== 0 ? '' : p.day}
          </text>
        ))}
        {tip && (
          <g>
            <line x1={x(tip.i)} x2={x(tip.i)} y1={PAD.t} y2={PAD.t + ih} stroke="var(--g-border)" />
            {!moneyHidden && <circle cx={x(tip.i)} cy={yE(tip.e.value)} r="5" fill="var(--g-primary-light)" stroke="var(--g-card)" strokeWidth="2" />}
            <circle cx={x(tip.i)} cy={yB(tip.b)} r="4" fill="var(--g-accent)" stroke="var(--g-card)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {/* Keyboard: the chart is one focus stop; arrows move between points. */}
      <div tabIndex={0} aria-label={t('Chart points, use the arrow keys')} className="g-focus"
        style={{ position: 'absolute', inset: 0, outline: 'none' }}
        onFocus={() => setSel((s) => s ?? points.length - 1)} onBlur={() => setSel(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setSel((s) => Math.min(points.length - 1, (s ?? -1) + 1));
          if (e.key === 'ArrowLeft') setSel((s) => Math.max(0, (s ?? 1) - 1));
        }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left - PAD.l) / iw) * (points.length - 1));
          setSel(Math.max(0, Math.min(points.length - 1, i)));
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left - PAD.l) / iw) * (points.length - 1));
          setSel(Math.max(0, Math.min(points.length - 1, i)));
        }} />
      {tip && (
        <div role="status" aria-live="polite" className="g-panel" style={{
          position: 'absolute', top: 6, left: Math.min(Math.max(x(tip.i) - 80, 4), w - 168), width: 164, padding: '8px 10px',
          background: 'var(--g-elevated)', pointerEvents: 'none', fontSize: '0.8125rem', boxShadow: 'var(--g-shadow-2)',
        }}>
          <div style={{ color: 'var(--g-text-muted)', fontSize: '0.75rem' }}>{tip.label}</div>
          {!moneyHidden && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>{t('Earnings')}</span>
              <strong className="g-num">{tip.e.tight ? `${tip.e.prefix}${tip.e.text}` : `${tip.e.prefix} ${tip.e.text}`}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{t('Bookings')}</span><strong className="g-num">{tip.b}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
