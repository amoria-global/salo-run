'use client';

/**
 * The Home "Share & invite" card. The whole card opens a menu (not just the button): Share your album (the existing
 * Albums screen, where each album can be shared or published), Share profile (the public profile link, shown here and
 * not on the card) and Share referral link or code (the invite sheet, hidden for good at 40 referrals). Chips on the
 * card say what is inside, and a badge from the referral stats gives a reason to open it: "Earn 70%" at 0, "Unlock
 * 75%" while building toward the first milestone, "Your share: N%" from 10, and nothing at 40, where the Referral
 * chip goes too.
 */
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Gift, Image as ImageIcon, Share2, User } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { badgeFor, sheetChip } from '@/app/lib/referral';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { fetchPublicProfileUrl } from '@/app/lib/publicProfileLink';
import type { StatsState } from './useReferralStats';

const InviteSheet = dynamic(() => import('./InviteSheet'), { ssr: false });

const P = '/user/photographer';

const chip = (accent: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
  color: accent ? 'var(--g-accent-text)' : 'var(--g-link)', border: `1px solid ${accent ? 'var(--g-accent-text)' : 'var(--g-link)'}`,
  background: accent ? 'var(--g-accent-bg, transparent)' : 'transparent',
});

export default function ShareMenu({ canCreateAlbum, referral }: { canCreateAlbum: boolean; referral: StatsState }) {
  const { t } = useLanguage();
  const rt = useReferralCopy();
  const router = useRouter();
  const { user } = useDashboardAuth();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [note, setNote] = useState('');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = await fetchPublicProfileUrl(user);
        if (alive && url) setProfileUrl(url);
      } catch { /* the sub line stays empty */ }
    })();
    return () => { alive = false; };
  }, [user]);

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
    if (!profileUrl) { setNote(t('Your public profile link is not available yet.')); return; }
    try {
      if (navigator.share) { await navigator.share({ url: profileUrl }); return; }
      await navigator.clipboard.writeText(profileUrl);
      setNote(t('Copied'));
      setTimeout(() => setNote(''), 2000);
    } catch { /* cancelled */ }
  };

  const stats = referral.status === 'ready' ? referral.data : null;
  const complete = stats?.maxRate === true || (stats !== null && stats.qualifying >= stats.cap);
  const badge = badgeFor(stats);
  const item: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'none', border: 0, borderRadius: 10, color: 'inherit', cursor: 'pointer', textAlign: 'left', font: 'inherit' };
  const ellipsis: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

  return (
    <div ref={root} style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('Share & invite')}
        data-testid="home-share"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
        className="g-panel"
        style={{ display: 'grid', gap: 8, padding: 10, cursor: 'pointer', border: '1px solid var(--g-primary-light)', borderRadius: 14 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden style={{ width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3E6FD8 0%, #083A85 100%)', color: '#fff', flexShrink: 0 }}>
            <Share2 size={17} />
          </span>
          <strong style={{ flex: 1, minWidth: 0, fontSize: '0.95rem', ...ellipsis }}>{t('Share & invite')}</strong>
          <span className="g-btn g-btn-ghost" aria-hidden style={{ pointerEvents: 'none' }}>{t('Share')} <ChevronDown size={14} /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={chip(false)}><ImageIcon size={12} aria-hidden /> {t('Album')}</span>
          <span style={chip(false)}><User size={12} aria-hidden /> {t('Profile')}</span>
          {!complete && <span style={chip(true)}><Gift size={12} aria-hidden /> {t('Referral')}</span>}
          <span style={{ flex: 1 }} />
          {badge && (
            <span data-testid="share-invite-badge" style={{
              display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
              color: badge.kind === 'share' ? 'var(--g-success)' : 'var(--g-accent-text)',
              border: `1px solid ${badge.kind === 'share' ? 'var(--g-success)' : 'var(--g-accent-text)'}`,
              background: badge.kind === 'share' ? 'var(--g-success-bg, transparent)' : 'var(--g-accent-bg, transparent)',
            }}>
              {badge.kind === 'share' ? rt('badgeShare', { rate: badge.rate }) : badge.kind === 'unlock' ? rt('badgeUnlock', { rate: badge.rate }) : rt('badgeEarn')}
            </span>
          )}
        </div>
      </div>

      {open && (
        <div role="menu" className="g-panel" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,.28)' }}>
          {canCreateAlbum && (
            <button role="menuitem" type="button" style={item} onClick={() => { setOpen(false); router.push(`${P}/events?tab=albums`); }}>
              <ImageIcon size={18} aria-hidden />
              <span style={{ flex: 1, minWidth: 0, display: 'grid' }}>
                <strong style={ellipsis}>{t('Share your album')}</strong>
                <small style={{ ...ellipsis, color: 'var(--g-text-muted)' }}>{t('Send an album link to your clients')}</small>
              </span>
              <ChevronRight size={16} aria-hidden />
            </button>
          )}
          <button role="menuitem" type="button" style={item} onClick={shareProfile}>
            <User size={18} aria-hidden />
            <span style={{ flex: 1, minWidth: 0, display: 'grid' }}>
              <strong style={ellipsis}>{t('Share profile')}</strong>
              <small style={{ ...ellipsis, color: 'var(--g-text-muted)' }}>{profileUrl ? profileUrl.replace(/^https?:\/\//, '') : ' '}</small>
            </span>
            <ChevronRight size={16} aria-hidden />
          </button>
          {!complete && (
            <button role="menuitem" type="button" style={item} onClick={() => { setOpen(false); setSheet(true); }} data-testid="share-referral-item">
              <Gift size={18} aria-hidden style={{ color: 'var(--g-accent)' }} />
              <span style={{ flex: 1, minWidth: 0, display: 'grid' }}>
                <strong style={ellipsis}>{t('Share referral link or code')}</strong>
                <small style={{ ...ellipsis, color: 'var(--g-text-muted)' }}>{rt('growSub')}</small>
              </span>
              {stats && <span data-testid="share-menu-progress" style={chip(true)}>{sheetChip(stats.qualifying)}</span>}
              <ChevronRight size={16} aria-hidden />
            </button>
          )}
        </div>
      )}
      {note && <span role="status" style={{ display: 'block', marginTop: 6, fontSize: '0.8125rem' }}>{note}</span>}
      {sheet && stats && <InviteSheet open={sheet} onClose={() => setSheet(false)} stats={stats} />}
    </div>
  );
}
