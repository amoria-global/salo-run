'use client';

/**
 * Referral program sheet: the photographer's code and link (copy, WhatsApp, more apps, QR), progress toward the
 * lower fee, and the list of people they referred (names only). Loading, empty and error states are designed, and
 * every string goes through the dashboard dictionary.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { useLanguage } from '@/app/context/LanguageContext';
import { fetchMyReferral, progressParts, referralLink, type ReferralStats } from '@/app/lib/referral';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: ReferralStats };

const POLICY_URL = 'https://connekyt.com/referral-program';

function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="g-btn g-btn-ghost"
      aria-label={`${t('Copy')} ${label}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* clipboard blocked: the text is selectable */ }
      }}
    >
      {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {done ? t('Copied') : t('Copy')}
    </button>
  );
}

async function saveQr(link: string, code: string): Promise<void> {
  const QR = await import('qrcode');
  const size = 640;
  const canvas = document.createElement('canvas');
  await QR.toCanvas(canvas, link, { width: size, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#083A85', light: '#FFFFFF' } });
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const logo = new Image();
    logo.src = '/logo.png';
    await new Promise<void>((resolve) => { logo.onload = () => resolve(); logo.onerror = () => resolve(); });
    const box = Math.round(size * 0.22);
    const x = (size - box) / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(x - 6, x - 6, box + 12, box + 12, 14);
    ctx.fill();
    if (logo.naturalWidth) ctx.drawImage(logo, x, x, box, box);
  }
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `connekyt-referral-${code}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function ReferralSheet({ open, onClose, onAddCode }: { open: boolean; onClose: () => void; onAddCode?: () => void }) {
  const { t } = useLanguage();
  const [state, setState] = useState<Load>({ status: 'loading' });
  const [qrBusy, setQrBusy] = useState(false);
  const alive = useRef(true);

  const load = useCallback(() => {
    setState({ status: 'loading' });
    fetchMyReferral()
      .then((data) => { if (alive.current) setState({ status: 'ready', data }); })
      .catch(() => { if (alive.current) setState({ status: 'error' }); });
  }, []);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const statusLabel = (s: string) =>
    s === 'qualified' ? t('Qualified') : s === 'under_review' ? t('Under review') : s === 'revoked' ? t('Revoked') : t('Pending');

  const body = () => {
    if (state.status === 'loading') {
      return <div style={{ display: 'grid', gap: 12 }} aria-busy="true"><div className="g-skeleton" style={{ height: 72 }} /><div className="g-skeleton" style={{ height: 48 }} /><div className="g-skeleton" style={{ height: 120 }} /></div>;
    }
    if (state.status === 'error') {
      return (
        <div role="alert" style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ margin: '0 0 12px' }}>{t("Couldn't load your referrals")}</p>
          <button type="button" className="g-btn g-btn-primary" onClick={load}>{t('Retry')}</button>
        </div>
      );
    }
    const s = state.data;
    const link = s.code ? referralLink(s.code) : '';
    const p = progressParts(s);
    const message = `${t('Join me on Connekyt. Use my referral code')} ${s.code}: ${link}`;
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <section aria-label={t('Your code')}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--g-text-muted)' }}>{t('Your code')}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <code data-testid="referral-code" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.18em' }}>{s.code}</code>
            <CopyButton text={s.code || ''} label={t('Your code')} />
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--g-text-muted)', marginTop: 10 }}>{t('Your link')}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span className="g-ellipsis" style={{ minWidth: 0, flex: 1 }}>{link}</span>
            <CopyButton text={link} label={t('Your link')} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <a className="g-btn g-btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>{t('WhatsApp')}</a>
            <button type="button" className="g-btn g-btn-ghost" onClick={async () => {
              if (navigator.share) { try { await navigator.share({ text: message, url: link }); } catch { /* cancelled */ } }
              else { try { await navigator.clipboard.writeText(message); } catch { /* ignore */ } }
            }}><Share2 size={16} aria-hidden /> {t('More apps')}</button>
            <button type="button" className="g-btn g-btn-ghost" disabled={qrBusy} onClick={async () => { setQrBusy(true); try { await saveQr(link, s.code || ''); } finally { setQrBusy(false); } }}>
              <Download size={16} aria-hidden /> {t('Save QR')}
            </button>
          </div>
        </section>

        <section aria-label={t('Progress')}>
          <div style={{ fontWeight: 700 }} data-testid="referral-progress-text">
            {p.kind === 'unlock' && `${p.n} ${t('of 5 to unlock 25%')}`}
            {p.kind === 'fee' && `${t('Your fee')}: ${p.fee}% · ${p.n} ${t('of 20 referrals')}`}
            {p.kind === 'complete' && `${t('Program complete')}: 20/20 · ${t('your fee')}: 10%`}
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={20} aria-valuenow={Math.min(s.qualifying, 20)}
            style={{ height: 10, borderRadius: 999, background: 'var(--g-border, rgba(127,127,127,.25))', overflow: 'hidden', marginTop: 8 }}>
            <div style={{ width: `${p.pct}%`, height: '100%', background: 'linear-gradient(90deg, #083A85, #F20C8F)' }} />
          </div>
        </section>

        <section aria-label={t('Your referrals')}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{t('Your referrals')}</h3>
          {s.referrals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--g-text-soft)' }}>
              <strong>{t('No referrals yet')}</strong>
              <p style={{ margin: '6px 0 0' }}>{t('Share your code. A referral counts when the photographer you refer is approved and completes a paid job.')}</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              {s.referrals.map((r, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderTop: i ? '1px solid var(--g-border, rgba(127,127,127,.2))' : 'none' }}>
                  <span className="g-ellipsis">{r.name}</span>
                  <span style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{statusLabel(r.status)} · {String(r.date).slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <a href={POLICY_URL} target="_blank" rel="noopener noreferrer">{t('How the referral program works')}</a>
          {s.hasReferrer
            ? <span>{t('Referred by')} {s.referrerName}</span>
            : onAddCode && <button type="button" className="g-btn g-btn-ghost" onClick={onAddCode}>{t('Add a referral code')}</button>}
        </footer>
      </div>
    );
  };

  return <Modal isOpen={open} onClose={onClose} size="md" title={t('Referral program')}>{body()}</Modal>;
}
