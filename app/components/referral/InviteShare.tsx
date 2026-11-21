'use client';

/**
 * The invite block: the one-line rule above the buttons, the link, the code with Copy, WhatsApp, More apps and
 * Save QR. Rendered inside the Invite sheet and on the Milestones page. At the cap the server withholds the code,
 * so there is nothing to render and the block returns null.
 */
import { useState } from 'react';
import { Check, Copy, Download, MessageCircle, Share2 } from 'lucide-react';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { referralLink } from '@/app/lib/referral';

export async function saveQr(link: string, code: string): Promise<void> {
  const QR = await import('qrcode');
  const size = 640;
  const canvas = document.createElement('canvas');
  await QR.toCanvas(canvas, link, { width: size, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#083A85', light: '#FFFFFF' } });
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `connekyt-referral-${code}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function InviteShare({ code, link }: { code: string | null; link: string | null }) {
  const rt = useReferralCopy();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  if (!code) return null;
  const url = link || referralLink(code);

  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : url);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch { /* clipboard blocked: the text is selectable */ }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ url, text: rt('shareLine') });
      else await copy('link');
    } catch { /* cancelled */ }
  };

  return (
    <div className="gr-share" data-testid="invite-share">
      <p className="gr-foot" data-testid="share-line">{rt('shareLine')}</p>
      <div className="gr-code">
        <code aria-label={code} data-testid="referral-code">{code}</code>
        <button type="button" className="g-btn g-btn-ghost" onClick={() => copy('code')} aria-label={`${rt('copy')} ${code}`}>
          {copied === 'code' ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied === 'code' ? rt('copied') : rt('copy')}
        </button>
      </div>
      <div className="gr-code">
        <code style={{ letterSpacing: 0, fontWeight: 600, fontSize: '0.8rem' }}>{url.replace(/^https?:\/\//, '')}</code>
        <button type="button" className="g-btn g-btn-ghost" onClick={() => copy('link')}>
          {copied === 'link' ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied === 'link' ? rt('copied') : rt('copy')}
        </button>
      </div>
      <div className="gr-share-row">
        <a className="g-btn g-btn-ghost" target="_blank" rel="noopener noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(`${rt('shareLine')} ${url}`)}`}>
          <MessageCircle size={16} aria-hidden /> {rt('whatsapp')}
        </a>
        <button type="button" className="g-btn g-btn-ghost" onClick={share}><Share2 size={16} aria-hidden /> {rt('moreApps')}</button>
        <button type="button" className="g-btn g-btn-ghost" onClick={() => { void saveQr(url, code); }}><Download size={16} aria-hidden /> {rt('saveQr')}</button>
      </div>
    </div>
  );
}
