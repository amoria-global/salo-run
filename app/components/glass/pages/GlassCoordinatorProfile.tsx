'use client';

/**
 * Coordinator Profile in Compact Glass: the shared GlassProfileForm (see GlassClientProfile) plus the coordinator's
 * business details, which the classic page also sends on save (organization, business type, tax ID, business
 * address, website). Behaviour is the classic page's (useCoordinatorProfile, moved verbatim).
 */
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Field, GlassProfileForm, type ProfileCtl } from './GlassClientProfile';
import type { CoordinatorProfileController } from '@/app/components/profile/useCoordinatorProfile';

const BUSINESS_TYPES = [
  'Event Management Company', 'Concert & Festival Organizer', 'Wedding & Ceremony Planner', 'Corporate Event Agency',
  'Sports & Entertainment Venue', 'Theater & Performing Arts', 'Nightclub & Lounge', 'Music Production Company',
  'Film & Media Production', 'Broadcasting & Streaming Service', 'Artist Management Agency', 'Talent & Booking Agency',
  'PR & Marketing Agency', 'Hotel & Hospitality', 'Conference & Convention Center', 'Religious Organization',
  'Non-Profit & Charity', 'Educational Institution', 'Government Agency', 'Other',
];

export default function GlassCoordinatorProfile({ ctl: c, modals }: { ctl: CoordinatorProfileController; modals: ReactNode }) {
  const { t } = useLanguage();
  const set = (k: 'organizationName' | 'businessType' | 'taxId' | 'businessAddress' | 'website') => (e: { target: { value: string } }) => c.handleInputChange(k, e.target.value);
  const extra = (
    <>
      <h3 className="gcp-section">{t('Business details')}</h3>
      <Field label="Organization name"><input type="text" value={c.formData.organizationName} onChange={set('organizationName')} placeholder={t('Enter organization name')} autoComplete="organization" /></Field>
      <Field label="Business type">
        <select value={c.formData.businessType} onChange={set('businessType')}>
          <option value="">{t('Select business type')}</option>
          {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{t(b)}</option>)}
        </select>
      </Field>
      <Field label="Tax ID / TIN"><input type="text" value={c.formData.taxId} onChange={set('taxId')} placeholder={t('Enter tax ID')} /></Field>
      <Field label="Business address"><input type="text" value={c.formData.businessAddress} onChange={set('businessAddress')} placeholder={t('Enter business address')} autoComplete="street-address" /></Field>
      <Field label="Website"><input type="url" value={c.formData.website} onChange={set('website')} placeholder={t('Enter website URL')} autoComplete="url" /></Field>
    </>
  );
  // The coordinator's form state is the client's plus the business fields; the shared form only reads the common
  // fields and spreads the rest through its setFormData updates, so it is safe to pass as the common shape.
  return <GlassProfileForm ctl={c as unknown as ProfileCtl} roleTitle="Event Coordinator" modals={modals} extra={extra} />;
}
