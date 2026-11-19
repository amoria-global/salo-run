'use client';

/**
 * Client Profile in Compact Glass. Behaviour is the classic page's (useClientProfile, moved verbatim): the same
 * fields, the same Rwanda province and district cascade, the same phone input, upload and save. The KYC dialog is
 * the classic ProfilePageModals, passed in as `modals`.
 *
 * Layout follows the photographer profile reference: a profile card (photo, name, title, verification state and the
 * date joined) beside the form, an Editing switch, 44px inputs, Save muted until something changed, and a sticky bar
 * while there are unsaved changes.
 *
 * Two deliberate differences from the classic page: the username is shown read-only, because the save sends only
 * name, phone and address (the classic field accepted edits that were then dropped), and the made-up "Last login:
 * Today" line is gone.
 */
import { BadgeCheck, Camera, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import CountrySelect, { eastAfricanCountries } from '@/app/components/CountrySelect';
import InternationalPhoneInput from '@/app/components/phone/InternationalPhoneInput';
import { Card, Chip, PageHeader } from '../ui';
import type { ClientProfileController } from '@/app/components/profile/useClientProfile';

/** The parts of the profile controller this view needs; the coordinator page's controller has the same shape. */
export type ProfileCtl = Pick<ClientProfileController,
  'colors' | 'actualTheme' | 'user' | 'formData' | 'setFormData' | 'isEditEnabled' | 'setIsEditEnabled' | 'isSaving' | 'isUploadingImage'
  | 'profileImage' | 'profileInputRef' | 'validationErrors' | 'phoneValue' | 'setPhoneValue' | 'savedPhone' | 'rwandaProvinces'
  | 'handleSaveProfile' | 'handleInputChange' | 'handleFullNameChange' | 'handleProfileImageUpload' | 'setShowKycModal' | 'inputStyle'>;

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <label className="gcp-field">
      <span className="gcp-label">{t(label)}</span>
      {children}
      {error ? <span className="gcp-error" role="alert">{t(error)}</span> : hint ? <span className="gcp-hint">{t(hint)}</span> : null}
    </label>
  );
}

export function GlassProfileForm({ ctl, roleTitle, modals, extra }: { ctl: ProfileCtl; roleTitle: string; modals: ReactNode; extra?: ReactNode }) {
  // extra: role-specific fields (the coordinator's business details), rendered inside the same disabled fieldset.
  const { profileInputRef, ...c } = ctl;
  const { t, language } = useLanguage();
  const snap = () => JSON.stringify({ f: c.formData, p: c.phoneValue?.digits ?? null });
  const [base, setBase] = useState<string | null>(null);
  const dirty = c.isEditEnabled && base !== null && base !== snap();
  const kyc = c.user?.kycStatus as string | undefined;
  const showKyc = !!kyc && kyc !== 'APPROVED' && c.user?.customerType !== 'Viewer';
  const joined = c.user?.joinedFrom ? new Date(c.user.joinedFrom).toLocaleDateString(language || undefined, { month: 'short', year: 'numeric' }) : null;
  const name = c.formData.fullName || t('User');
  const rwanda = c.formData.country === 'Rwanda';
  const districts = (c.rwandaProvinces as Record<string, string[]>)[c.formData.province] || [];

  const toggleEdit = () => {
    if (!c.isEditEnabled) setBase(snap());
    else setBase(null);
    c.setIsEditEnabled(!c.isEditEnabled);
  };

  return (
    <div className="g-page gcp-page">
      <PageHeader title={t('Profile')} subtitle={t('Your personal details and identity verification.')}
        action={kyc === 'APPROVED' ? <Chip tone="success"><BadgeCheck size={14} aria-hidden /> {t('Verified')}</Chip> : <Chip tone="info">{t('Account active')}</Chip>} />

      <div className="gcp-grid">
        <aside className="gcp-side">
          <Card className="gcp-card gcp-person">
            <div className="gcp-photo">
              {c.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.profileImage} alt="" />
              ) : (
                <span className="gcp-initial" aria-hidden>{c.formData.fullName ? c.formData.fullName.charAt(0).toUpperCase() : '?'}</span>
              )}
              {c.isUploadingImage ? <span className="gcp-photo-busy" aria-label={t('Uploading')}><Loader2 size={20} className="g-spin" aria-hidden /></span> : null}
              <input ref={profileInputRef} type="file" accept="image/*" hidden onChange={c.handleProfileImageUpload} />
              <button type="button" className="g-btn gcp-photo-btn" disabled={!c.isEditEnabled || c.isUploadingImage}
                aria-label={t(c.isEditEnabled ? 'Upload profile picture' : 'Turn on editing to change your photo')}
                title={t(c.isEditEnabled ? 'Upload profile picture' : 'Turn on editing to change your photo')}
                onClick={() => profileInputRef.current?.click()}>
                <Camera size={16} aria-hidden />
              </button>
            </div>
            <strong className="gcp-name">{name}</strong>
            <span className="gcp-role">{t(c.formData.title || roleTitle)}</span>
            {joined ? <span className="gcp-muted">{t('Joined')} {joined}</span> : null}
          </Card>

          {showKyc ? (
            <Card className={`gcp-card gcp-kyc is-${kyc === 'PENDING' ? 'pending' : kyc === 'REJECTED' ? 'error' : 'info'}`}>
              <span className="gcp-kyc-head">
                {kyc === 'PENDING' ? <ShieldCheck size={18} aria-hidden /> : <ShieldAlert size={18} aria-hidden />}
                <strong>{t(kyc === 'PENDING' ? 'KYC under review' : kyc === 'REJECTED' ? 'KYC rejected' : 'KYC required')}</strong>
              </span>
              <p>{t(kyc === 'PENDING' ? 'Your identity verification is being reviewed.' : kyc === 'REJECTED' ? 'Your KYC was rejected. Please resubmit.' : 'Complete identity verification to enable withdrawals.')}</p>
              {kyc !== 'PENDING' ? <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowKycModal(true)}>{t(kyc === 'REJECTED' ? 'Resubmit' : 'Verify now')}</button> : null}
            </Card>
          ) : null}
        </aside>

        <Card className="gcp-card gcp-form">
          <header className="gcp-form-head">
            <span>
              <small className="gcp-eyebrow">{t('Your details')}</small>
              <h2>{t('Personal information')}</h2>
            </span>
            <button type="button" role="switch" aria-checked={c.isEditEnabled} className={`gcp-switch${c.isEditEnabled ? ' is-on' : ''}`} onClick={toggleEdit}>
              <span className="gcp-switch-track" aria-hidden><span /></span>
              {t('Editing')}
            </button>
          </header>

          <fieldset className="gcp-fields" disabled={!c.isEditEnabled}>
            <legend className="sr-only">{t('Personal information')}</legend>
            <Field label="Full name" error={c.validationErrors.fullName}>
              <input type="text" value={c.formData.fullName} onChange={(e) => c.handleFullNameChange(e.target.value)} autoComplete="name" aria-invalid={!!c.validationErrors.fullName} />
            </Field>
            <Field label="Username" hint="Your username can't be changed here.">
              <input type="text" value={c.formData.username} readOnly disabled />
            </Field>
            <Field label="Email" hint="Contact support to change your email.">
              <input type="email" value={c.formData.email} readOnly disabled />
            </Field>
            <Field label="Phone">
              <InternationalPhoneInput
                key={`${c.savedPhone.country?.iso2 ?? 'none'}-${c.savedPhone.nsn}`}
                defaultIso2={c.savedPhone.country?.iso2}
                initialNsn={c.savedPhone.nsn}
                disabled={!c.isEditEnabled}
                dark={c.actualTheme === 'dark'}
                ariaLabel={t('Phone number')}
                onChange={(value) => c.setPhoneValue(value)}
              />
            </Field>
            <Field label="Country">
              <CountrySelect
                countries={eastAfricanCountries}
                value={c.formData.country}
                onChange={(val: string) => {
                  c.handleInputChange('country', val);
                  if (val !== 'Rwanda') c.setFormData((prev) => ({ ...prev, province: '', district: '', sector: '' }));
                  else c.setFormData((prev) => ({ ...prev, province: 'Kigali City', district: 'Gasabo', sector: '' }));
                }}
                valueKey="name"
                displayKey="name"
                disabled={!c.isEditEnabled}
                inputStyle={{ ...c.inputStyle, cursor: c.isEditEnabled ? 'pointer' : 'not-allowed' }}
                colors={c.colors}
                actualTheme={c.actualTheme}
              />
            </Field>
            <Field label="Province">
              {rwanda ? (
                <select value={c.formData.province} onChange={(e) => {
                  c.handleInputChange('province', e.target.value);
                  const ds = (c.rwandaProvinces as Record<string, string[]>)[e.target.value] || [];
                  c.setFormData((prev) => ({ ...prev, province: e.target.value, district: ds[0] || '', sector: '' }));
                }}>
                  {Object.keys(c.rwandaProvinces).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input type="text" value={c.formData.province} onChange={(e) => c.handleInputChange('province', e.target.value)} placeholder={t('Enter province/region')} />
              )}
            </Field>
            <Field label="District">
              {rwanda && c.formData.province ? (
                <select value={c.formData.district} onChange={(e) => {
                  c.handleInputChange('district', e.target.value);
                  c.setFormData((prev) => ({ ...prev, district: e.target.value, sector: '' }));
                }}>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input type="text" value={c.formData.district} onChange={(e) => c.handleInputChange('district', e.target.value)} placeholder={t('Enter district')} />
              )}
            </Field>
            <Field label="Sector">
              <input type="text" value={c.formData.sector} onChange={(e) => c.handleInputChange('sector', e.target.value)} placeholder={t('Enter sector')} />
            </Field>
            {extra}
          </fieldset>

          <div className="gcp-save">
            {!c.isEditEnabled ? <span className="gcp-muted">{t('Turn on Editing to change your details.')}</span> : null}
            <button type="button" className={`g-btn${dirty ? ' g-btn-primary' : ''}`} disabled={!c.isEditEnabled || !dirty || c.isSaving}
              onClick={() => { void c.handleSaveProfile(); }}>
              {c.isSaving ? t('Saving…') : t('Save changes')}
            </button>
          </div>
        </Card>
      </div>

      {dirty ? (
        <div className="gcp-unsaved" role="status">
          <span>{t('You have unsaved changes')}</span>
          <button type="button" className="g-btn g-btn-primary" disabled={c.isSaving} onClick={() => { void c.handleSaveProfile(); }}>{c.isSaving ? t('Saving…') : t('Save changes')}</button>
        </div>
      ) : null}
      {modals}
    </div>
  );
}

export default function GlassClientProfile({ ctl, modals }: { ctl: ClientProfileController; modals: ReactNode }) {
  return <GlassProfileForm ctl={ctl} roleTitle="Client" modals={modals} />;
}
