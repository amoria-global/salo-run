'use client';

/**
 * "Add a referral code" for an existing photographer. Validates on the server as they type (debounced), shows
 * "Referred by Jane D." before confirming, and needs a confirm because it can never be changed. Once saved, or when
 * the account already has a referrer, only the name is shown, read-only.
 */
import { useEffect, useRef, useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import { useLanguage } from '@/app/context/LanguageContext';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { attachCode, fetchMyReferral, parseReferralCode, problemMessage, validateCode, type ReferralStats } from '@/app/lib/referral';

type Check = { kind: 'idle' } | { kind: 'checking' } | { kind: 'ok'; name: string; code: string } | { kind: 'bad'; message: string };

export default function AddReferralCode({ initialCode = '' }: { initialCode?: string; autoOpen?: boolean }) {
  const { t } = useLanguage();
  const rt = useReferralCopy();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [value, setValue] = useState(initialCode);
  const [check, setCheck] = useState<Check>({ kind: 'idle' });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    fetchMyReferral().then(setStats).catch(() => setLoadFailed(true));
  }, []);

  useEffect(() => {
    const raw = value.trim();
    if (!raw) { setCheck({ kind: 'idle' }); return; }
    const code = parseReferralCode(raw);
    if (!code) { setCheck({ kind: 'bad', message: "This code isn't valid" }); return; }
    setCheck({ kind: 'checking' });
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      const r = await validateCode(code);
      if (mine !== seq.current) return;
      if (r.tooMany) setCheck({ kind: 'bad', message: 'Too many attempts. Please wait a minute.' });
      else if (r.error) setCheck({ kind: 'bad', message: "Couldn't check the code. Please try again." });
      else if (r.result?.valid) setCheck({ kind: 'ok', name: r.result.referrerName || '', code });
      else setCheck({ kind: 'bad', message: problemMessage(r.result?.problem) });
    }, 450);
    return () => clearTimeout(timer);
  }, [value]);


  if (loadFailed) return null;
  if (!stats) return <div className="g-skeleton" style={{ height: 56 }} aria-busy="true" />;

  if (stats.hasReferrer) {
    return (
      <div data-testid="referrer-readonly">
        <div style={{ fontWeight: 700 }}>{t('Referral code')}</div>
        <div style={{ color: 'var(--g-text-soft)' }}>{t('Referred by')} {stats.referrerName}</div>
      </div>
    );
  }

  const save = async () => {
    if (check.kind !== 'ok') return;
    setBusy(true); setSaveError('');
    const r = await attachCode(check.code);
    setBusy(false);
    if (r.ok) {
      setConfirming(false);
      setStats({ ...stats, hasReferrer: true, referrerName: r.referrerName || check.name });
    } else {
      setConfirming(false);
      setSaveError(r.tooMany ? 'Too many attempts. Please wait a minute.' : problemMessage(r.problem));
    }
  };

  const msg = check.kind === 'checking' ? t('Checking…')
    : check.kind === 'ok' ? `${t('Referred by')} ${check.name}`
    : check.kind === 'bad' ? t(check.message) : '';
  return (
    <div>
      <label htmlFor="add-referral-code" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Add a referral code')}</label>
      <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--g-text-muted)' }}>{t('Enter the code or link of the photographer who referred you.')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input id="add-referral-code" className="g-select" style={{ flex: '1 1 220px', height: 40 }} value={value} autoComplete="off" spellCheck={false}
          onChange={(e) => setValue(e.target.value)} placeholder="ABCD2345" aria-describedby="add-referral-status" />
        <button type="button" className="g-btn g-btn-primary" disabled={check.kind !== 'ok'} onClick={() => setConfirming(true)}>{t('Confirm')}</button>
      </div>
      <p className="gr-help" data-testid="referral-field-helper">{rt('fieldHelper')}</p>
      <p id="add-referral-status" role="status" aria-live="polite" style={{ minHeight: 18, margin: '6px 0 0', fontSize: '0.875rem', color: check.kind === 'ok' ? 'var(--g-success, #047857)' : check.kind === 'bad' ? 'var(--g-error)' : 'var(--g-text-muted)' }}>{msg}</p>
      {saveError && <p role="alert" style={{ color: 'var(--g-error)', margin: '4px 0 0' }}>{t(saveError)}</p>}
      <a href="https://connekyt.com/referral-program" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem' }}>{t('How the referral program works')}</a>

      <Modal isOpen={confirming} onClose={() => setConfirming(false)} size="sm" title={t('Confirm your referrer')}
        footer={<>
          <button type="button" className="g-btn g-btn-ghost" onClick={() => setConfirming(false)}>{t('Cancel')}</button>
          <button type="button" className="g-btn g-btn-primary" disabled={busy} onClick={save}>{busy ? t('Saving…') : t('Confirm')}</button>
        </>}>
        <p style={{ margin: 0, fontWeight: 700 }}>{check.kind === 'ok' ? `${t('Referred by')} ${check.name}` : ''}</p>
        <p style={{ margin: '6px 0 0' }}>{t("This can't be changed later.")}</p>
      </Modal>
    </div>
  );
}
