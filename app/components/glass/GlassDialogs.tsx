'use client';

/** The top bar's dialogs (Pay now, sign out, identity check), the same components and handlers as the old top bar. */
import { LogOut } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import dynamic from 'next/dynamic';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Loaded only when opened: the identity check pulls in face detection, which no page needs until then.
const PayNowModal = dynamic(() => import('../UnlockModal'), { ssr: false });
const KycVerificationModal = dynamic(() => import('../KycVerificationModal'), { ssr: false });
import type { useTopbarState } from '../topbarState';
import type { GlassRole } from './nav';

type TopState = ReturnType<typeof useTopbarState>;

export default function GlassDialogs({ state }: { role: GlassRole; state: TopState }) {
  const { t } = useLanguage();
  const { showPayNowModal, setShowPayNowModal, topbarPayment, setTopbarPayment, fetchFinancials, showLogoutModal,
    setShowLogoutModal, logout, showKycModal, setShowKycModal, refreshUserProfile, colors, actualTheme } = state;
  return (
    <>
      {showPayNowModal && <PayNowModal isOpen={showPayNowModal}
        onClose={() => { setShowPayNowModal(false); setTopbarPayment(null); }}
        payment={topbarPayment}
        onPaymentSuccess={() => { setShowPayNowModal(false); setTopbarPayment(null); fetchFinancials(); }} />}

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
        size="sm" title={t('Sign out of Connekyt?')}
        description={t("You'll need to sign in again to access your dashboard.")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>{t('Cancel')}</Button>
            <Button variant="danger" onClick={() => { setShowLogoutModal(false); logout(); }}>{t('Sign out')}</Button>
          </>
        }>
        <div style={{ width: 56, height: 56, borderRadius: 9999, background: 'var(--g-error-bg)', color: 'var(--g-error)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 8px' }}>
          <LogOut size={22} aria-hidden />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--g-text-soft)', margin: 0 }}>{t('Your session will end on this device.')}</p>
      </Modal>

      {showKycModal && <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={() => { setShowKycModal(false); refreshUserProfile(); }}
        colors={colors as unknown as Record<string, string>}
        actualTheme={actualTheme}
      />}
    </>
  );
}
