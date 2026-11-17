'use client';

/**
 * The Home "Share" button: a popover with Share your album (opens the existing album creation flow), Share profile
 * (the public profile link) and Share referral link or code (the referral sheet, hidden for good at 20 referrals).
 */
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Gift, Image as ImageIcon, Share2, User } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { SELL_PHOTOS_QUERY } from '@/lib/albums/sellPhotos';
import { getApiUrl } from '@/lib/api';
import { fetchMyReferral } from '@/app/lib/referral';

const ReferralSheet = dynamic(() => import('./ReferralSheet'), { ssr: false });

const P = '/user/photographer';

export default function ShareMenu({ canCreateAlbum }: { canCreateAlbum: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useDashboardAuth();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [complete, setComplete] = useState(false);
  const [note, setNote] = useState('');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchMyReferral().then((s) => { if (alive) setComplete(s.complete); }).catch(() => { /* keep the item; the server enforces the rules */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const shareProfile = async () => {
    setOpen(false);
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/public/seo/slug-for?type=photographer&id=${encodeURIComponent(user?.customerId || user?.id || '')}`);
      const body = res.ok ? await res.json() : null;
      if (!body?.slug) { setNote(t('Your public profile link is not available yet.')); return; }
      const url = `https://connekyt.com/photographers/${body.slug}`;
      if (navigator.share) { try { await navigator.share({ url }); return; } catch { return; } }
      await navigator.clipboard.writeText(url);
      setNote(t('Copied'));
      setTimeout(() => setNote(''), 2000);
    } catch {
      setNote(t('Your public profile link is not available yet.'));
    }
  };

  const item: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'none', border: 0, borderRadius: 10, color: 'inherit', cursor: 'pointer', textAlign: 'left', font: 'inherit' };

  return (
    <div ref={root} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" className="g-btn g-btn-ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} data-testid="home-share">
        <Share2 size={16} aria-hidden /> {t('Share')}
      </button>
      {open && (
        <div role="menu" className="g-panel" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 40, minWidth: 260, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,.28)' }}>
          {canCreateAlbum && (
            <button role="menuitem" type="button" style={item} className="gh-menu-item" onClick={() => { setOpen(false); router.push(`${P}/events?${SELL_PHOTOS_QUERY}`); }}>
              <ImageIcon size={16} aria-hidden /> {t('Share your album')}
            </button>
          )}
          <button role="menuitem" type="button" style={item} className="gh-menu-item" onClick={shareProfile}>
            <User size={16} aria-hidden /> {t('Share profile')}
          </button>
          {!complete && (
            <button role="menuitem" type="button" style={item} className="gh-menu-item" onClick={() => { setOpen(false); setSheet(true); }} data-testid="share-referral-item">
              <Gift size={16} aria-hidden /> {t('Share referral link or code')}
            </button>
          )}
        </div>
      )}
      {note && <span role="status" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{note}</span>}
      {sheet && <ReferralSheet open={sheet} onClose={() => setSheet(false)} onAddCode={() => { setSheet(false); router.push(`${P}/profile?tab=settings&addReferral=1`); }} />}
    </div>
  );
}
