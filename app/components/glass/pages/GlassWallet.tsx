'use client';

/**
 * My wallet (photographer, client, coordinator) in Compact Glass. The load is the classic pages' (useMyWallet); the
 * balance panel, the activity table and the withdraw dialog are the same components the classic pages use
 * (WalletPanel, WalletMovementsTable, WithdrawModal), restyled through the glass tokens.
 *
 * Withdraw needs payments.manage, as before, and is hidden in a workspace the photographer was invited to, where
 * the activity list is replaced by a note: withdrawals and history stay with the owner.
 */
import { Landmark, Lock } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import WalletPanel from '@/app/components/WalletPanel';
import WalletMovementsTable from '@/app/components/WalletMovementsTable';
import WithdrawModal from '@/app/components/WithdrawModal';
import { Can } from '@/app/lib/usePermissions';
import type { WalletDTO } from '@/lib/walletApi';
import { Card, ErrorState, PageHeader, RowsSkeleton } from '../ui';

type Role = 'photographer' | 'client' | 'event-coordinator';

export default function GlassWallet({ role, wallet, loading, error, reload, subtitle, panelTitle, shared = false }: {
  role: Role; wallet: WalletDTO | null; loading: boolean; error: string | null; reload: () => void;
  subtitle: string; panelTitle: string; shared?: boolean;
}) {
  const { t } = useLanguage();
  const { colors, actualTheme } = useTheme();
  const [withdraw, setWithdraw] = useState(false);
  return (
    <div className="g-page gwl-page">
      <PageHeader eyebrow={t('Money')} title={t('My wallet')} subtitle={subtitle}
        action={shared ? undefined : (
          <Can permission="payments.manage">
            <button type="button" className="g-btn g-btn-primary" onClick={() => setWithdraw(true)}><Landmark size={16} aria-hidden /> {t('Withdraw funds')}</button>
          </Can>
        )} />
      {loading ? (
        <Card className="gwl-card" aria-busy="true"><RowsSkeleton rows={3} height={72} /></Card>
      ) : error ? (
        <Card className="gwl-card"><ErrorState message={t(error)} onRetry={reload} /></Card>
      ) : wallet ? (
        <>
          <WalletPanel wallet={wallet} title={t(panelTitle)} role={role} />
          {shared ? (
            <Card className="gwl-card gwl-note" role="note"><Lock size={16} aria-hidden /> {t('Withdrawals and the transaction history stay with the workspace owner.')}</Card>
          ) : (
            <WalletMovementsTable mode="me" title={t('Activity')} role={role} />
          )}
        </>
      ) : null}
      {!shared ? <WithdrawModal isOpen={withdraw} onClose={() => setWithdraw(false)} role={role} colors={colors} actualTheme={actualTheme} /> : null}
    </div>
  );
}
