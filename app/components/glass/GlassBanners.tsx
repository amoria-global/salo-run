'use client';

/**
 * The notices the old top bar drew under itself, with the same conditions: the identity check and a suspended wallet.
 * An unpaid payment (Pay now) is a chip in the top bar instead (PayRequiredChip), so it never moves the page. Behaviour comes from useTopbarState.
 */
import { ArrowRight, ShieldAlert, ShieldCheck, WalletMinimal } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import type { useTopbarState } from '../topbarState';
import type { GlassRole } from './nav';

type TopState = ReturnType<typeof useTopbarState>;

export default function GlassBanners({ role, state }: { role: GlassRole; state: TopState }) {
  const { t } = useLanguage();
  const { user, pendingPaymentWarning, isCollaborator, setShowKycModal, walletStatus } = state;

  const pending = pendingPaymentWarning && (role === 'client' || role === 'event-coordinator') ? pendingPaymentWarning : null;
  const kyc = !!user && user.kycStatus !== 'APPROVED' && user.customerType !== 'Viewer' && !isCollaborator && !pending;

  return (
    <>
      {kyc && (() => {
        const rejected = user!.kycStatus === 'REJECTED';
        const review = user!.kycStatus === 'PENDING';
        const Icon = rejected ? ShieldAlert : ShieldCheck;
        const tone = rejected ? 'error' : review ? 'info' : 'info';
        return (
          <div className="g-panel g-banner" role="status">
            <span className="g-banner-icon" style={{ background: `var(--g-${tone}-bg)`, color: `var(--g-${tone})` }}>
              <Icon size={18} aria-hidden />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {t(rejected ? 'KYC verification rejected' : review ? 'KYC under review' : 'Verify your identity')}
              </div>
              <div className="g-ellipsis" style={{ fontSize: '0.8125rem', color: 'var(--g-text-soft)' }}>
                {t(rejected ? 'Your submission needs corrections. Resubmit to continue.'
                  : review ? 'We’re verifying your details. This typically takes a few hours.'
                  : 'Complete KYC to unlock withdrawals and full platform features.')}
              </div>
            </div>
            {!review && (
              <button type="button" className="g-btn g-btn-primary" onClick={() => setShowKycModal(true)}>
                {t(rejected ? 'Resubmit' : 'Complete KYC')} <ArrowRight size={16} aria-hidden />
              </button>
            )}
          </div>
        );
      })()}

      {walletStatus === 'SUSPENDED' && (
        <div className="g-panel g-banner" role="status">
          <span className="g-banner-icon" style={{ background: 'var(--g-error-bg)', color: 'var(--g-error)' }}>
            <WalletMinimal size={18} aria-hidden />
          </span>
          <div style={{ flex: 1, minWidth: 0, fontSize: '0.875rem' }}>
            <strong>{t('Your wallet is suspended')}</strong>
          </div>
        </div>
      )}
    </>
  );
}
