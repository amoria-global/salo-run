'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { getEventQrLink } from '@/lib/urls';

/**
 * Small two-step wizard that hands out a published event's QR code.
 *   1. Share: the code, copy link, share, download as PNG
 *   2. Print: a print-ready poster
 *
 * It renders nothing unless `published` is true, so an unpublished event can
 * never expose a code (the public page would not resolve for it anyway).
 * The same component serves the client, the coordinator and the assigned
 * photographer, so all three share one code.
 */

const NAVY = '#083A85';
const PINK = '#F20C8F';

type Step = 'share' | 'print';

export interface EventQrWizardProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  published: boolean;
  /** True right after a successful publish, to celebrate rather than just show. */
  justPublished?: boolean;
}

export default function EventQrWizard({
  open,
  onClose,
  eventId,
  eventTitle,
  published,
  justPublished = false,
}: EventQrWizardProps): React.JSX.Element | null {
  const [step, setStep] = useState<Step>('share');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const link = getEventQrLink(eventId);

  useEffect(() => {
    if (!open || !published) return;
    let cancelled = false;
    setStep('share');
    setNote('');
    setFailed(false);
    setDataUrl(null);
    QRCode.toDataURL(link, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: NAVY, light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, published, link]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Link copied');
    } catch {
      setNote('Copy failed, select the link and copy it by hand');
    }
  }, [link]);

  const shareLink = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: eventTitle, text: `Scan or open to view ${eventTitle}`, url: link });
        return;
      }
    } catch {
      return; // viewer cancelled the share sheet
    }
    await copyLink();
  }, [eventTitle, link, copyLink]);

  const download = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${eventTitle.replace(/[^\w-]+/g, '-').slice(0, 60) || 'event'}-qr.png`;
    a.click();
  }, [dataUrl, eventTitle]);

  const printPoster = useCallback(() => {
    if (!dataUrl) return;
    const w = window.open('', '_blank', 'width=800,height=1000');
    if (!w) {
      setNote('Allow pop-ups to print, or download the image instead');
      return;
    }
    const d = w.document;
    d.title = `${eventTitle} QR`;
    const style = d.createElement('style');
    style.textContent = `
      @page { margin: 18mm; }
      body { font-family: Arial, Helvetica, sans-serif; text-align: center; color: #0f172a; margin: 0; padding: 24px; }
      h1 { font-size: 34px; margin: 0 0 6px; color: ${NAVY}; }
      p { font-size: 18px; color: #475569; margin: 0 0 24px; }
      img { width: 70%; max-width: 560px; height: auto; border: 6px solid ${NAVY}; border-radius: 16px; }
      small { display: block; margin-top: 24px; font-size: 14px; color: #64748b; }
    `;
    d.head.appendChild(style);
    const h1 = d.createElement('h1');
    h1.textContent = eventTitle;
    const p = d.createElement('p');
    p.textContent = 'Scan to view the event on Connekyt';
    const img = d.createElement('img');
    img.alt = `QR code for ${eventTitle}`;
    img.src = dataUrl;
    const small = d.createElement('small');
    small.textContent = 'Phone users will be asked to open the Connekyt app.';
    d.body.append(h1, p, img, small);
    img.onload = () => {
      w.focus();
      w.print();
    };
  }, [dataUrl, eventTitle]);

  if (!open || !published) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,15,35,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-qr-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', background: '#fff',
          borderRadius: 20, boxShadow: '0 24px 60px rgba(8,15,35,0.35)', padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 id="event-qr-title" style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
              {justPublished ? 'Your event is live' : 'Event QR code'}
            </h2>
            <p style={{ fontSize: 14, color: '#475569', margin: '4px 0 0' }}>
              {eventTitle}
            </p>
          </div>
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            style={{ border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#475569', minWidth: 44, minHeight: 44 }}
          >
            &times;
          </button>
        </div>

        <div role="tablist" aria-label="QR steps" style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          {(['share', 'print'] as Step[]).map((s, i) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={step === s}
              onClick={() => setStep(s)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, minHeight: 44, cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                border: `1px solid ${step === s ? NAVY : '#cbd5e1'}`,
                background: step === s ? NAVY : '#fff',
                color: step === s ? '#fff' : NAVY,
              }}
            >
              {i + 1}. {s === 'share' ? 'Share' : 'Print'}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1',
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 12,
          }}
        >
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR code for ${eventTitle}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : failed ? (
            <p role="alert" style={{ color: '#b91c1c', fontSize: 14, textAlign: 'center', margin: 0 }}>
              The QR code could not be drawn. Copy the link instead.
            </p>
          ) : (
            <p aria-busy="true" style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Preparing your QR code...</p>
          )}
        </div>

        {step === 'share' ? (
          <>
            <p style={{ fontSize: 13, color: '#475569', margin: '14px 0' }}>
              Anyone who scans this opens the event page. On a phone they are asked to open the Connekyt app.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={shareLink} style={btn(true)}>Share</button>
              <button type="button" onClick={copyLink} style={btn(false)}>Copy link</button>
            </div>
            <button type="button" onClick={download} disabled={!dataUrl} style={{ ...btn(false), width: '100%', marginTop: 10 }}>
              Download PNG
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#475569', margin: '14px 0' }}>
              Prints a poster with the event name and this code, ready for the venue entrance or a flyer.
            </p>
            <button type="button" onClick={printPoster} disabled={!dataUrl} style={{ ...btn(true), width: '100%' }}>
              Print poster
            </button>
          </>
        )}

        <p role="status" aria-live="polite" style={{ minHeight: 20, fontSize: 13, color: NAVY, margin: '12px 0 0' }}>
          {note}
        </p>
      </div>
    </div>
  );
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: '12px 14px', borderRadius: 12, minHeight: 44, cursor: 'pointer', fontSize: 15, fontWeight: 700,
    border: primary ? 'none' : `1px solid ${NAVY}`,
    background: primary ? `linear-gradient(135deg, ${NAVY}, ${PINK})` : '#fff',
    color: primary ? '#fff' : NAVY,
  };
}
