'use client';

/**
 * Preferences in Compact Glass, after the mobile Settings screen and the Edit profile blueprint. Behaviour is the
 * classic page's, shared through usePreferences (theme and language saved as preferences, withdrawal accounts with the
 * XentriPay name check, notification switches per role, two-factor, the referral code); this file is presentation.
 *
 * Tabs with one underline style; each section is a glass card. Notification settings are rows with a blue switch
 * (role="switch"). Payment accounts are list rows with the provider, a Default chip, Set default, the edit notice and
 * Delete (confirm). Adding an account is a glass dialog: type cards, the form, the name-mismatch step, then Add.
 */
import { Suspense } from 'react';
import Image from 'next/image';
import { Bell, Check, CreditCard, Gift, Info, Landmark, Moon, Monitor, Palette, Plus, ShieldCheck, Smartphone, Sun, Trash2, Wallet, Pencil, Languages } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import AddReferralCode from '@/app/components/referral/AddReferralCode';
import InternationalPhoneInput from '@/app/components/phone/InternationalPhoneInput';
import TwoFactorMethods from '@/app/components/TwoFactorMethods';
import { TabParamHandler, type PreferencesController } from '@/app/components/preferences/usePreferences';
import { Card, Chip, ConfirmDialog, EmptyState, GlassModal, PageHeader } from '../ui';

type Ctl = PreferencesController;
type Role = 'photographer' | 'client' | 'event-coordinator';
type Tab = 'appearance' | 'payments' | 'notifications' | 'security' | 'referral';

function SwitchRow({ title, body, on, onToggle }: { title: string; body: string; on: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="gpr-row">
      <span className="gc-two"><strong>{t(title)}</strong><small>{t(body)}</small></span>
      <button type="button" role="switch" aria-checked={on} aria-label={t(title)} className={`gpf-switch${on ? ' is-on' : ''}`} onClick={onToggle}>
        <span className="gpf-knob" aria-hidden />
      </button>
    </div>
  );
}

function SectionHead({ icon, eyebrow, title, body, action }: { icon: React.ReactNode; eyebrow: string; title: string; body: string; action?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="gpr-head">
      <span className="gpr-icon" aria-hidden>{icon}</span>
      <span className="gc-two gpr-head-text">
        <span className="gh-eyebrow">{t(eyebrow)}</span>
        <h2 className="g-display gpr-title">{t(title)}</h2>
        <small>{t(body)}</small>
      </span>
      {action}
    </div>
  );
}

function Appearance({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const icons = { light: <Sun size={18} aria-hidden />, dark: <Moon size={18} aria-hidden />, system: <Monitor size={18} aria-hidden /> } as const;
  return (
    <>
      <Card className="gpr-card">
        <SectionHead icon={<Palette size={18} />} eyebrow="Appearance" title="Theme mode" body="Choose how the dashboard looks to you. Pick a single theme or sync with your device." />
        <div className="gpr-options" role="radiogroup" aria-label={t('Theme mode')}>
          {c.themeOptions.map((o) => {
            const on = c.theme === o.mode;
            return (
              <button key={o.mode} type="button" role="radio" aria-checked={on} className={`gpr-option${on ? ' is-on' : ''}`}
                onClick={() => { c.setTheme(o.mode); c.savePreference('theme', o.mode); }}>
                <span className={`gpr-preview gpr-preview-${o.mode}`} aria-hidden><i /><b /></span>
                <span className="gpr-option-label">{icons[o.mode as keyof typeof icons]} {t(o.label)}{on ? <Check size={16} aria-hidden className="gpr-tick" /> : null}</span>
                <small>{t(o.description)}</small>
              </button>
            );
          })}
        </div>
        <p className="gpf-help">{c.theme === 'system' ? t("Synced with your device's settings.") : t(c.actualTheme === 'dark' ? 'Currently using Dark mode.' : 'Currently using Light mode.')}</p>
      </Card>
      <Card className="gpr-card">
        <SectionHead icon={<Languages size={18} />} eyebrow="Language" title="App language" body="Choose your preferred language across the web and mobile experience." />
        <div className="gpr-langs" role="radiogroup" aria-label={t('App language')}>
          {c.languages.map((l) => {
            const on = c.language === l.code;
            return (
              <button key={l.code} type="button" role="radio" aria-checked={on} className={`gpr-lang${on ? ' is-on' : ''}`} data-no-translate
                onClick={() => { c.setLanguage(l.code); c.savePreference('language', l.code); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w40/${l.flag}.png`} alt="" width={28} height={20} />
                <span className="gc-two"><strong>{l.nativeLabel}</strong><small>{l.label}</small></span>
                {on ? <Check size={16} aria-hidden className="gpr-tick" /> : null}
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function ProviderMark({ c, type, name }: { c: Ctl; type: 'mobile' | 'bank'; name: string }) {
  const img = c.getPaymentImage(type, name);
  if (type === 'bank' || !img) return <span className="gpr-mark" aria-hidden>{type === 'bank' ? <Landmark size={18} /> : <Smartphone size={18} />}</span>;
  return <span className="gpr-mark" aria-hidden><Image src={img} alt="" width={40} height={40} unoptimized /></span>;
}

function Payments({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  return (
    <Card className="gpr-card">
      <SectionHead icon={<Wallet size={18} />} eyebrow="Payments" title="Saved payment accounts" body="Manage the accounts you use for payments and withdrawals."
        action={<button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowAddPaymentModal(true)}><Plus size={16} aria-hidden /> {t('Add account')}</button>} />
      {!c.paymentMethods.length ? (
        <EmptyState icon={<CreditCard size={20} />} title="No payment accounts saved" body="Add a mobile money or bank account to enable payments and withdrawals." />
      ) : (
        <ul className="gpr-list">
          {c.paymentMethods.map((m) => (
            <li key={m.id} className="gpr-item">
              <ProviderMark c={c} type={m.type} name={m.name} />
              <span className="gc-two gpr-item-text">
                <strong className="g-ellipsis">{t(m.name)} {m.isDefault ? <Chip tone="success">{t('Default')}</Chip> : null}</strong>
                <small className="g-ellipsis">{[m.details, m.accountName].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="gpr-item-actions">
                {!m.isDefault && <button type="button" className="g-btn g-btn-ghost" onClick={() => c.handleSetDefault(m.id)}>{t('Set default')}</button>}
                <button type="button" className="g-icon-btn" aria-label={`${t('Edit')} ${t(m.name)}`} onClick={() => { c.setSelectedPayment(m); c.setShowEditPaymentModal(true); }}><Pencil size={16} aria-hidden /></button>
                <button type="button" className="g-icon-btn gpf-danger-icon" aria-label={`${t('Delete')} ${t(m.name)}`} onClick={() => { c.setSelectedPayment(m); c.setShowDeleteModal(true); }}><Trash2 size={16} aria-hidden /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Notifications({ c, role }: { c: Ctl; role: Role }) {
  const flip = (key: string, value: boolean, set: (v: boolean) => void) => { set(!value); c.savePreference(key, String(!value)); };
  const { t } = useLanguage();
  return (
    <Card className="gpr-card">
      <SectionHead icon={<Bell size={18} />} eyebrow="Notifications" title="Notification settings" body="Choose which notifications you want to receive and where you want them delivered." />
      <div className="gpr-rows">
        <SwitchRow title="Email notifications" body="Receive email alerts for important notifications" on={c.emailNotifications} onToggle={() => flip('email_notifications', c.emailNotifications, c.setEmailNotifications)} />
        <SwitchRow title="Push notifications" body="Get instant push notifications on your device" on={c.pushNotifications} onToggle={() => flip('push_notifications', c.pushNotifications, c.setPushNotifications)} />
      </div>
      <h3 className="gc-h">{t('Notification categories')}</h3>
      <div className="gpr-rows">
        {role === 'photographer' && <SwitchRow title="Payment notifications" body="Notify me when I receive payments" on={c.paymentNotifications} onToggle={() => flip('payment_notifications', c.paymentNotifications, c.setPaymentNotifications)} />}
        {role === 'photographer' && <SwitchRow title="Tips and bonuses" body="Notify me when I receive tips or bonuses" on={c.tipsAndBonuses} onToggle={() => flip('tips_and_bonuses', c.tipsAndBonuses, c.setTipsAndBonuses)} />}
        {role !== 'photographer' && <SwitchRow title="Album notifications" body="Notify me when new albums are shared or updated" on={c.albumNotifications} onToggle={() => flip('album_notifications', c.albumNotifications, c.setAlbumNotifications)} />}
        {role !== 'photographer' && <SwitchRow title="Booking notifications" body="Notify me about booking updates and confirmations" on={c.bookingNotifications} onToggle={() => flip('booking_notifications', c.bookingNotifications, c.setBookingNotifications)} />}
        {role === 'client' && <SwitchRow title="Gift notifications" body="Notify me when I receive gifts" on={c.giftNotifications} onToggle={() => flip('gift_notifications', c.giftNotifications, c.setGiftNotifications)} />}
        {role === 'event-coordinator' && <SwitchRow title="Stream fee notifications" body="Notify me when I receive live stream access fee revenue" on={c.streamFeeNotifications} onToggle={() => flip('stream_fee_notifications', c.streamFeeNotifications, c.setStreamFeeNotifications)} />}
        <SwitchRow title="Security alerts" body="Always notify me about security events (recommended)" on={c.securityAlerts} onToggle={() => flip('security_alerts', c.securityAlerts, c.setSecurityAlerts)} />
      </div>
    </Card>
  );
}

function Security({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  return (
    <>
      <Card className="gpr-card">
        <SectionHead icon={<ShieldCheck size={18} />} eyebrow="Security" title="Two-factor authentication" body="Ask for a code when you sign in, from an authenticator app or sent to your email. It is required to withdraw funds."
          action={c.totpEnabled ? <Chip tone="success">{t('On')}</Chip> : undefined} />
        <TwoFactorMethods theme={{ colors: c.colors, dark: c.actualTheme === 'dark' }}
          onStatus={(st) => { c.setTotpEnabled(st.enabled); if (st.enabled !== !!c.user?.twoFactorEnabled) c.updateUser({ twoFactorEnabled: st.enabled }); }} />
      </Card>
      <Card className="gpr-card">
        <SectionHead icon={<ShieldCheck size={18} />} eyebrow="Verification" title="Withdrawal verification" body="Every withdrawal is confirmed with a code sent to your email." />
        <div className="gpr-note">
          <strong>{t('Email code')}</strong>
          <p>{`${t('When you confirm a withdrawal we email a 6-digit code to')} ${c.user?.email || t('your account email')}. ${t('Enter it to finish. You can ask for a new code on the confirmation step, and you get an email again once the withdrawal is completed.')}`}</p>
        </div>
      </Card>
    </>
  );
}

function AddAccount({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const close = () => { c.setShowAddPaymentModal(false); c.resetForm(); };
  const momo = c.paymentType === 'mtn' || c.paymentType === 'airtel';
  const options = [
    { key: 'momo', label: 'Mobile Money', body: 'MTN or Airtel Money', img: '/momo.jpeg', on: momo, pick: () => { if (!momo) c.setPaymentType('mtn'); } },
    ...(momo ? [
      { key: 'mtn', label: 'MTN Mobile Money', body: 'Withdraw via MTN Mobile Money', img: '/mtn.png', on: c.paymentType === 'mtn', pick: () => c.setPaymentType('mtn') },
      { key: 'airtel', label: 'Airtel Money', body: 'Withdraw via Airtel Money', img: '/airtel.png', on: c.paymentType === 'airtel', pick: () => c.setPaymentType('airtel') },
    ] : []),
    { key: 'bank', label: 'Bank Transfer', body: 'Withdraw to a Rwandan bank account', img: '', on: c.paymentType === 'bank', pick: () => c.setPaymentType('bank') },
  ];
  const busy = c.isValidating || c.isSavingPreference;
  return (
    <GlassModal title="Add payment account" onClose={close} width={520} footer={c.showNameMismatch ? undefined : (
      <>
        <button type="button" className="g-btn g-btn-ghost" disabled={busy} onClick={close}>{t('Cancel')}</button>
        <button type="button" className="g-btn g-btn-primary" disabled={busy} onClick={c.handleAddPayment}>{c.isValidating ? t('Validating…') : c.isSavingPreference ? t('Saving…') : <><Plus size={16} aria-hidden /> {t('Add payment account')}</>}</button>
      </>
    )}>
      <div className="gpr-types" role="radiogroup" aria-label={t('Account type')}>
        {options.map((o) => (
          <button key={o.key} type="button" role="radio" aria-checked={o.on} className={`gpr-type${o.on ? ' is-on' : ''}`} onClick={o.pick}>
            <span className="gpr-mark" aria-hidden>{o.img ? <Image src={o.img} alt="" width={40} height={40} unoptimized /> : <Landmark size={18} />}</span>
            <span className="gc-two"><strong>{t(o.label)}</strong><small className="g-ellipsis">{t(o.body)}</small></span>
            {o.on ? <Check size={16} aria-hidden className="gpr-tick" /> : null}
          </button>
        ))}
      </div>
      {c.paymentType === 'bank' ? (
        <div className="gpr-form">
          <label className="gpf-field"><span className="gpf-label">{t('Select bank')}</span>
            <select className="gpf-input" value={c.selectedBank} onChange={(e) => c.setSelectedBank(e.target.value)}>
              <option value="">{t('Choose a bank…')}</option>
              {c.bankProviders.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </label>
          <label className="gpf-field"><span className="gpf-label">{t('Account number')}</span>
            <input className="gpf-input" value={c.bankAccountNumber} onChange={(e) => c.setBankAccountNumber(e.target.value)} placeholder={t('Your bank account number')} />
          </label>
          <label className="gpf-field"><span className="gpf-label">{t('Account holder name')}</span>
            <input className="gpf-input" value={c.bankAccountName} onChange={(e) => c.setBankAccountName(e.target.value)} placeholder={t('Name as it appears on your bank account')} />
          </label>
        </div>
      ) : (
        <div className="gpr-form">
          <div className="gpf-field"><span className="gpf-label">{c.paymentType === 'mtn' ? t('MTN phone number') : t('Airtel phone number')}</span>
            <div className="gpf-phone">
              <InternationalPhoneInput key={c.phoneFieldKey} defaultIso2={c.defaultPhoneIso2} dark={c.actualTheme === 'dark'}
                ariaLabel={c.paymentType === 'mtn' ? 'MTN phone number' : 'Airtel phone number'} onChange={(v) => { c.setMobilePhone(v); c.setValidationError(''); }} />
            </div>
          </div>
          <label className="gpf-field"><span className="gpf-label">{t('Account holder name')}</span>
            <input className="gpf-input" value={c.accountHolderName} onChange={(e) => c.setAccountHolderName(e.target.value)} placeholder={t('Name registered on your mobile money')} />
          </label>
        </div>
      )}
      {c.validationError && <p role="alert" className="gpf-banner gpf-banner-error">{t(c.validationError)}</p>}
      {c.showNameMismatch && (
        <div className="gpf-banner gpf-banner-warn gpr-mismatch" role="alert">
          <span>
            <strong>{t('Name mismatch')}</strong><br />
            {t('You entered')} <strong>{c.enteredNameForMismatch}</strong>{t(', but this account is registered as')} <strong>{c.xentriPayName}</strong>.
          </span>
          <span className="gpr-mismatch-actions">
            <button type="button" className="g-btn g-btn-ghost" onClick={c.handleCancelMismatch}>{t('Go back')}</button>
            <button type="button" className="g-btn g-btn-primary" onClick={c.handleConfirmMismatchName}>{t('Use')} &quot;{c.xentriPayName}&quot;</button>
          </span>
        </div>
      )}
    </GlassModal>
  );
}

export default function GlassPreferences({ ctl: c, userType }: { ctl: Ctl; userType: Role }) {
  const { t } = useLanguage();
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'appearance', label: 'Appearance', icon: <Palette size={15} aria-hidden /> },
    { key: 'payments', label: 'Payment accounts', icon: <Wallet size={15} aria-hidden /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={15} aria-hidden /> },
    { key: 'security', label: 'Security', icon: <ShieldCheck size={15} aria-hidden /> },
    ...(userType === 'photographer' ? [{ key: 'referral' as Tab, label: 'Referral', icon: <Gift size={15} aria-hidden /> }] : []),
  ];
  const tab = c.activeTab as Tab;
  const sel = c.selectedPayment;
  return (
    <div className="gp-page gpr-page">
      <Suspense fallback={null}><TabParamHandler setActiveTab={c.setActiveTab} setShowAddPaymentModal={c.setShowAddPaymentModal} /></Suspense>
      <PageHeader eyebrow="Settings" title="Preferences" subtitle="Appearance, payment accounts, notifications and security." />
      <div className="gpf-tabs gpr-tabs" role="tablist" aria-label={t('Preference sections')}>
        {tabs.map((x) => (
          <button key={x.key} type="button" role="tab" aria-selected={tab === x.key} className={`gpf-tab-btn${tab === x.key ? ' is-on' : ''}`} onClick={() => c.setActiveTab(x.key)}>
            {x.icon} {t(x.label)}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="gpr-panel" aria-label={t(tabs.find((x) => x.key === tab)?.label ?? '')}>
        {tab === 'appearance' && <Appearance c={c} />}
        {tab === 'payments' && <Payments c={c} />}
        {tab === 'notifications' && <Notifications c={c} role={userType} />}
        {tab === 'security' && <Security c={c} />}
        {tab === 'referral' && userType === 'photographer' && (
          <Card className="gpr-card"><AddReferralCode initialCode={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') || '' : ''} autoOpen /></Card>
        )}
      </div>

      {c.showAddPaymentModal && <AddAccount c={c} />}
      {c.showDeleteModal && sel && (
        <ConfirmDialog title="Delete this payment account?" confirmLabel="Delete"
          body={`${t('You will no longer be able to use')} "${t(sel.name)}" ${t('for payments or withdrawals. This cannot be undone.')}`}
          onClose={() => { c.setShowDeleteModal(false); c.setSelectedPayment(null); }} onConfirm={c.handleDeletePayment} />
      )}
      {c.showEditPaymentModal && sel && (
        <GlassModal title="Payment account" onClose={() => { c.setShowEditPaymentModal(false); c.setSelectedPayment(null); }}
          footer={<button type="button" className="g-btn g-btn-primary" onClick={() => { c.setShowEditPaymentModal(false); c.setSelectedPayment(null); }}>{t('Got it')}</button>}>
          <div className="gpr-item gpr-item-solo">
            <ProviderMark c={c} type={sel.type} name={sel.name} />
            <span className="gc-two gpr-item-text"><strong className="g-ellipsis">{t(sel.name)}</strong><small className="g-ellipsis">{sel.details}</small></span>
          </div>
          <p className="gpf-banner gpf-banner-info"><Info size={16} aria-hidden /> {t('For security reasons, you can only update this account by removing it and adding a new one.')}</p>
        </GlassModal>
      )}
    </div>
  );
}
