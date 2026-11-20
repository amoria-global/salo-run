'use client';

/**
 * Edit profile in Compact Glass (design reference: connekyt-web-profile-reference.png). All behaviour is the classic
 * page's, shared through usePhotographerProfile; this file is presentation plus one view-only helper (the unsaved
 * changes bar compares the form with a snapshot taken when editing starts, and Discard puts that snapshot back).
 *
 * Desktop: header with the account status chip, the completion card, then a profile card on the left (cover with a
 * camera button, avatar, name, specialty, stats, KYC, activity, reviews) and a tabbed form on the right (Overview,
 * Portfolio, Working experience, Delivery packages; one underline tab style). The edit bar has an "Editing" label in
 * normal text beside a blue switch and "Save changes" as the primary button, muted until something changes. Phones:
 * a compact card, tabs that scroll sideways and a full-width Save.
 *
 * Kept from the classic page on purpose: About/Bio and Equipment stay removed (product decision); the missing-fields
 * overlay blocks the form until the user picks a section ("Jump there"); team members without profile.edit get the
 * whole form disabled through a fieldset; availability keeps its own Save.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Plus, ShieldCheck, Star, Trash2, X, Eye, Hourglass, CircleAlert, CircleCheck } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { normalizeImageUrl } from '@/lib/api';
import { MatchingProfileCard } from '@/app/components/hybrid/MatchingProfile';
import ServiceAreaPanel from '@/app/components/ServiceAreaPanel';
import PhotographerPackagesManager from '@/app/components/packages/PhotographerPackagesManager';
import GeoPricingManager from '@/app/components/GeoPricingManager';
import InternationalPhoneInput from '@/app/components/phone/InternationalPhoneInput';
import ApprovalPendingModal from '@/app/components/ApprovalPendingModal';
import KycVerificationModal from '@/app/components/KycVerificationModal';
import { fmtDay } from '../format';
import { Avatar, Card, Chip, ConfirmDialog, EmptyState, GlassModal, PageHeader } from '../ui';
import type { PhotographerProfileController } from '@/app/components/profile/usePhotographerProfile';

type Ctl = PhotographerProfileController;
type Tab = 'overview' | 'portfolio' | 'experience' | 'packages';
const TABS: { key: Tab; label: string; short?: string }[] = [
  { key: 'overview', label: 'Overview' }, { key: 'portfolio', label: 'Portfolio' },
  { key: 'experience', label: 'Working experience', short: 'Experience' }, { key: 'packages', label: 'Delivery packages', short: 'Packages' },
];
const LANGUAGES = [
  { code: 'EN', label: 'English' }, { code: 'FR', label: 'French' }, { code: 'RW', label: 'Kinyarwanda' },
  { code: 'SWA', label: 'Swahili' }, { code: 'SPA', label: 'Spanish' }, { code: 'CHI', label: 'Chinese' },
];

/** What the unsaved-changes bar compares: the fields Save changes sends (availability has its own Save). */
const snapshotOf = (c: Ctl) => JSON.stringify({
  fullName: c.basicInfo.fullName, specialty: c.basicInfo.specialty, address: c.basicInfo.address,
  phone: c.phoneValue?.digits ?? null, specialties: c.overviewData.specialties, languages: c.overviewData.spokenLanguages,
  beliefs: c.portfolioData.beliefs,
});

function statusChip(c: Ctl): { tone: 'success' | 'error' | 'pending' | 'info'; label: string } | null {
  const s = c.user?.profileReviewStatus?.toLowerCase();
  if (!s) return null;
  if (s === 'accepted') return { tone: 'success', label: 'Account active' };
  if (s === 'rejected') return { tone: 'error', label: 'Changes needed' };
  if (c.profileCompletion < 85) return { tone: 'pending', label: 'Profile incomplete' };
  return { tone: 'info', label: 'Under review' };
}

function Field({ label, help, error, children, htmlFor, counter }: { label: string; help?: string; error?: string; children: React.ReactNode; htmlFor?: string; counter?: string }) {
  const { t } = useLanguage();
  return (
    <div className="gpf-field">
      <label className="gpf-label" htmlFor={htmlFor}>{t(label)}</label>
      {children}
      {(help || counter || error) && (
        <div className="gpf-under">
          {error ? <span className="gpf-error" role="alert">{t(error)}</span> : help ? <span className="gpf-help">{t(help)}</span> : <span />}
          {counter ? <span className="gpf-help g-num">{counter}</span> : null}
        </div>
      )}
    </div>
  );
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const { t } = useLanguage();
  return (
    <label className={`gpf-switch-wrap${disabled ? ' is-disabled' : ''}`}>
      <span className="gpf-switch-label">{t(label)}</span>
      <button type="button" role="switch" aria-checked={on} aria-label={t(label)} disabled={disabled}
        className={`gpf-switch${on ? ' is-on' : ''}`} onClick={() => onChange(!on)}>
        <span className="gpf-knob" aria-hidden />
      </button>
    </label>
  );
}

function ChipToggle({ on, children, onClick, disabled }: { on: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={on} disabled={disabled} className={`gpf-chip${on ? ' is-on' : ''}`} onClick={onClick}>
      {children}{on ? <Check size={14} aria-hidden /> : null}
    </button>
  );
}

function PendingTag({ c, field }: { c: Ctl; field: string }) {
  const { t } = useLanguage();
  if (!c.isAccountAccepted || !c.getFieldPendingChanges(field).length) return null;
  return <Chip tone="pending"><Hourglass size={12} aria-hidden /> {t('Pending approval')}</Chip>;
}

function CompletionRing({ value }: { value: number }) {
  const r = 26, len = 2 * Math.PI * r;
  return (
    <span className="gpf-ring" aria-hidden>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--g-muted)" strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" stroke="url(#gpf-ring)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(Math.min(100, value) / 100) * len} ${len}`} transform="rotate(-90 34 34)" />
        <defs><linearGradient id="gpf-ring" x1="0" x2="1"><stop offset="0" stopColor="#5B8CFF" /><stop offset="1" stopColor="#EE0E8F" /></linearGradient></defs>
      </svg>
      <b className="g-num">{value}%</b>
    </span>
  );
}

function MissingList({ c, onJump }: { c: Ctl; onJump: (s: 'basic' | 'overview' | 'portfolio' | 'experience') => void }) {
  const { t } = useLanguage();
  const basicMissing = [!c.basicInfo.fullName && 'Full name', !c.basicInfo.phoneNumber && 'Phone number', !c.basicInfo.address && 'Working city', !c.profileImage && 'Profile photo'].filter(Boolean) as string[];
  const hasExp = c.experienceData.experiences.length >= 1;
  const hasLong = c.experienceData.experiences.some((e) => e.description.length > 50);
  const items = [
    { label: 'Basic info (name, phone, working city, profile photo)', ok: !basicMissing.length, detail: basicMissing.length ? `${t('Missing')}: ${basicMissing.map((x) => t(x)).join(', ')}` : null, section: 'basic' as const },
    { label: 'At least 2 specialties selected', ok: c.overviewData.specialties.length >= 2, detail: `${t('Currently')} ${c.overviewData.specialties.length}`, section: 'overview' as const },
    { label: 'At least 1 spoken language selected', ok: c.overviewData.spokenLanguages.length >= 1, detail: t('No languages picked yet'), section: 'overview' as const },
    { label: 'At least 1 portfolio project', ok: c.portfolioData.projects.length >= 1, detail: `${t('Currently')} ${c.portfolioData.projects.length}`, section: 'portfolio' as const },
    { label: 'At least 1 work experience with a description (50+ characters)', ok: hasExp && hasLong, detail: !hasExp ? t('No entries yet') : t('Add a description over 50 characters to one of your entries'), section: 'experience' as const },
  ];
  return (
    <ul className="gpf-missing">
      {items.map((it) => (
        <li key={it.label} className={it.ok ? 'is-ok' : ''}>
          {it.ok ? <CircleCheck size={18} aria-hidden className="gpf-ok" /> : <CircleAlert size={18} aria-hidden className="gpf-warn" />}
          <span className="gc-two"><strong>{t(it.label)}</strong>{!it.ok && it.detail ? <small>{it.detail}</small> : null}</span>
          {!it.ok && <button type="button" className="g-btn g-btn-ghost" onClick={() => onJump(it.section)}>{t('Jump there')}</button>}
        </li>
      ))}
    </ul>
  );
}

function ProfileCard({ c }: { c: Ctl }) {
  const { profileInputRef, bannerInputRef } = c;
  const { t, language } = useLanguage();
  const u = c.user;
  const reviews = u?.reviews ?? [];
  return (
    <Card className="gpf-card">
      <input type="file" ref={profileInputRef} onChange={c.handleProfileImageUpload} accept="image/*" hidden />
      <input type="file" ref={bannerInputRef} onChange={c.handleBannerImageUpload} accept="image/*" hidden />
      <div className="gpf-cover" style={c.bannerImage ? { backgroundImage: `url(${c.bannerImage})` } : undefined}>
        <button type="button" className="g-icon-btn gpf-cam" aria-label={t('Change cover photo')} disabled={!c.isEditEnabled}
          title={c.isEditEnabled ? t('Change cover photo') : t('Turn on Editing to change it')} onClick={() => c.isEditEnabled && bannerInputRef.current?.click()}>
          <Camera size={16} aria-hidden />
        </button>
      </div>
      <div className="gpf-avatar-row">
        <span className="gpf-avatar">
          <Avatar name={c.basicInfo.fullName || '?'} src={c.profileImage} size={84} />
          <button type="button" data-badge className="g-icon-btn gpf-cam gpf-cam-avatar" aria-label={t('Change profile photo')} disabled={!c.isEditEnabled}
            title={c.isEditEnabled ? t('Change profile photo') : t('Turn on Editing to change it')} onClick={() => c.isEditEnabled && profileInputRef.current?.click()}>
            <Camera size={14} aria-hidden />
          </button>
        </span>
      </div>
      <div className="gpf-who">
        <h2 className="g-display gpf-name g-ellipsis">{c.basicInfo.fullName || t('Your name')}</h2>
        {u?.kycStatus === 'APPROVED' && <span><Chip tone="success"><ShieldCheck size={12} aria-hidden /> {t('KYC verified')}</Chip></span>}
        <p className="gpf-role">{t(c.basicInfo.specialty)}{c.basicInfo.address ? ` · ${c.basicInfo.address}` : ''}</p>
      </div>
      <dl className="gpf-stats">
        <div><dd className="g-num">{u?.rating ? u.rating.toFixed(1) : t('New')}</dd><dt>{t('Rating')}</dt></div>
        <div><dd className="g-num">{reviews.length}</dd><dt>{t('Reviews')}</dt></div>
        <div><dd className="g-num">{u?.completedEvents || 0}</dd><dt>{t('Completed jobs')}</dt></div>
        <div title={u?.respondedBookings ? `${u.acceptedBookings ?? 0} ${t('of')} ${u.respondedBookings} ${t('booking requests accepted')}` : t('No booking requests responded to yet')}>
          <dd className="g-num">{typeof u?.acceptanceRate === 'number' ? `${u.acceptanceRate}%` : '–'}</dd><dt>{t('Acceptance')}</dt>
        </div>
      </dl>
      {u?.kycStatus && u.kycStatus !== 'APPROVED' && u.customerType !== 'Viewer' && (
        <div className={`gpf-kyc gpf-kyc-${u.kycStatus === 'REJECTED' ? 'error' : u.kycStatus === 'PENDING' ? 'pending' : 'info'}`}>
          <strong><ShieldCheck size={15} aria-hidden /> {t(u.kycStatus === 'PENDING' ? 'KYC under review' : u.kycStatus === 'REJECTED' ? 'KYC rejected' : 'KYC required')}</strong>
          <p>{t(u.kycStatus === 'PENDING' ? 'Your identity verification is being reviewed.' : u.kycStatus === 'REJECTED' ? 'Your KYC was rejected. Please resubmit.' : 'Complete identity verification to enable withdrawals.')}</p>
          {u.kycStatus !== 'PENDING' && <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowKycModal(true)}>{t(u.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC')}</button>}
        </div>
      )}
      <dl className="gpf-activity">
        <div><dt>{t('Last login')}</dt><dd>{t('Today')}</dd></div>
        <div><dt>{t('Member since')}</dt><dd>{u?.joinedFrom ? new Date(u.joinedFrom).toLocaleDateString(language === 'en' ? 'en-GB' : language, { month: 'short', year: 'numeric' }) : '–'}</dd></div>
      </dl>
      {reviews.length > 0 && (
        <section className="gpf-reviews" aria-label={t('Client reviews')}>
          <h3 className="gc-h">{t('Client reviews')} ({reviews.length})</h3>
          {reviews.slice(0, 5).map((rev) => (
            <article key={rev.id} className="gpf-review">
              <Avatar name={`${rev.reviewer?.firstName ?? ''} ${rev.reviewer?.lastName ?? ''}`.trim() || '?'} src={normalizeImageUrl(rev.reviewer?.profilePicture) || null} size={32} />
              <div className="gc-two">
                <strong className="g-ellipsis">{rev.reviewer?.firstName} {rev.reviewer?.lastName}</strong>
                <small><Star size={12} aria-hidden className="gc-star" /> <span className="g-num">{Number(rev.rating || 0).toFixed(1)}</span>{rev.createdAt ? ` · ${fmtDay(rev.createdAt, language)}` : ''}</small>
                {rev.review ? <p className="gpf-review-text">{rev.review}</p> : null}
              </div>
            </article>
          ))}
          {reviews.length > 5 && <p className="gpf-help">+ {reviews.length - 5} {t(reviews.length - 5 === 1 ? 'more review' : 'more reviews')}</p>}
        </section>
      )}
    </Card>
  );
}

function OverviewTab({ c, resetKey }: { c: Ctl; resetKey: number }) {
  const { t } = useLanguage();
  const off = !c.isEditEnabled;
  return (
    <div className="gpf-tab">
      <section className="gpf-section" id="profile-basic-info-section">
        <h3 className="gpf-h">{t('Basic information')}</h3>
        <div className="gpf-grid">
          <Field label="Preferred name *" htmlFor="gpf-name" help="Your working name as clients know it. Real legal names are not required." error={c.validationErrors.fullName}>
            <input id="gpf-name" className={`gpf-input${c.validationErrors.fullName ? ' is-error' : ''}`} value={c.basicInfo.fullName} disabled={off}
              onChange={(e) => c.handleFullNameChange(e.target.value)} placeholder={t('e.g. Joe Photocuts')} aria-invalid={!!c.validationErrors.fullName} />
          </Field>
          <Field label="Email" htmlFor="gpf-email" help="Your sign-in email cannot be changed here.">
            <input id="gpf-email" className="gpf-input" type="email" value={c.basicInfo.email} disabled readOnly />
          </Field>
          <Field label="Phone">
            <div className="gpf-phone">
              <InternationalPhoneInput key={`${c.savedPhone.country?.iso2 ?? 'none'}-${c.savedPhone.nsn}-${resetKey}`} defaultIso2={c.savedPhone.country?.iso2}
                initialNsn={c.savedPhone.nsn} disabled={off} dark={c.actualTheme === 'dark'} ariaLabel="Phone number" onChange={(v) => c.setPhoneValue(v)} />
            </div>
          </Field>
          <Field label="Specialty *" htmlFor="gpf-specialty">
            <select id="gpf-specialty" className="gpf-input" value={c.basicInfo.specialty} disabled={off}
              onChange={(e) => c.setBasicInfo((p) => ({ ...p, specialty: e.target.value as 'Photographer' | 'Videographer' }))}>
              <option value="Photographer">{t('Photographer')}</option>
              <option value="Videographer">{t('Videographer')}</option>
            </select>
          </Field>
          <Field label="Working city" htmlFor="gpf-city" help="The city you mostly work in. Your map area is set in Service area below.">
            <input id="gpf-city" className="gpf-input" value={c.basicInfo.address} disabled={off} placeholder={t('e.g. Kigali, Rwanda')}
              onChange={(e) => c.setBasicInfo((p) => ({ ...p, address: e.target.value }))} />
          </Field>
        </div>
      </section>

      <section className="gpf-section">
        <h3 className="gpf-h">{t('Specialties *')} <PendingTag c={c} field="specialties" /></h3>
        <p className="gpf-help">{t('Pick at least 2 categories that describe your work.')}</p>
        <div className="gpf-chips">
          {c.availableSpecialties.map((s) => <ChipToggle key={s.id} on={c.overviewData.specialties.includes(s.id)} disabled={off} onClick={() => c.toggleSpecialty(s.id)}>{t(s.name)}</ChipToggle>)}
        </div>
      </section>

      <section className="gpf-section">
        <h3 className="gpf-h">{t('Languages you speak *')}</h3>
        <p className="gpf-help">{t('Pick every language you can comfortably work in. Clients see this on your public profile.')}</p>
        <div className="gpf-chips">
          {LANGUAGES.map((l) => <ChipToggle key={l.code} on={c.overviewData.spokenLanguages.includes(l.code)} disabled={off} onClick={() => c.toggleSpokenLanguage(l.code)}>{t(l.label)}</ChipToggle>)}
        </div>
      </section>

      <section className="gpf-section"><ServiceAreaPanel /></section>
      <section className="gpf-section"><MatchingProfileCard /></section>

      <section className="gpf-section">
        <h3 className="gpf-h">{t('Availability')}</h3>
        <p className="gpf-help">{t('Set your working hours for each day of the week.')}</p>
        <div className="gpf-days">
          {c.daysOfWeek.map((day) => {
            const d = c.basicInfo.availability?.[day] || c.defaultAvailability[day];
            const set = (patch: Partial<typeof d>) => c.setBasicInfo((p) => ({ ...p, availability: { ...p.availability, [day]: { ...p.availability[day], ...patch } } }));
            return (
              <div key={day} className="gpf-day">
                <label className="gpf-check">
                  <input type="checkbox" checked={d.enabled} disabled={off} onChange={(e) => set({ enabled: e.target.checked })} />
                  <span>{t(day)}</span>
                </label>
                {d.enabled ? (
                  <span className="gpf-times">
                    <label className="sr-only" htmlFor={`gpf-${day}-from`}>{t(day)} {t('from')}</label>
                    <select id={`gpf-${day}-from`} className="gpf-input" value={d.startTime} disabled={off} onChange={(e) => set({ startTime: e.target.value })}>{c.timeOptions.map((x) => <option key={x} value={x}>{x}</option>)}</select>
                    <span className="gpf-help">{t('to')}</span>
                    <label className="sr-only" htmlFor={`gpf-${day}-to`}>{t(day)} {t('to')}</label>
                    <select id={`gpf-${day}-to`} className="gpf-input" value={d.endTime} disabled={off} onChange={(e) => set({ endTime: e.target.value })}>{c.timeOptions.map((x) => <option key={x} value={x}>{x}</option>)}</select>
                  </span>
                ) : <span className="gpf-help gpf-off">{t('Not available')}</span>}
              </div>
            );
          })}
        </div>
        {c.isEditEnabled && (
          <div className="gpf-actions-end">
            <button type="button" className="g-btn g-btn-ghost" disabled={c.isSavingAvailability} onClick={c.handleSaveAvailability}>{c.isSavingAvailability ? t('Saving…') : t('Save availability')}</button>
          </div>
        )}
      </section>
    </div>
  );
}

function PortfolioTab({ c }: { c: Ctl }) {
  const { projectImageInputRef } = c;
  const { t } = useLanguage();
  const pending = c.getFieldPendingChanges('projects').filter((x) => x.changeType === 'ADD' && x.payload);
  return (
    <div className="gpf-tab">
      <div className="gpf-section-head">
        <h3 className="gpf-h">{t('Featured projects')} <PendingTag c={c} field="projects" /></h3>
        <button type="button" className="g-btn g-btn-ghost" disabled={!c.isEditEnabled} onClick={c.addProject}><Plus size={15} aria-hidden /> {t('Add project')}</button>
      </div>
      <p className="gpf-help">{t('Show your best work with a photo, a title and a short description.')}</p>
      <input type="file" ref={projectImageInputRef} onChange={c.handleProjectImageUpload} accept="image/*" hidden />
      {!c.portfolioData.projects.length && !pending.length ? (
        <EmptyState title="No projects added yet" body="Show your best work to attract more clients."
          action={<button type="button" className="g-btn g-btn-primary" disabled={!c.isEditEnabled} onClick={c.addProject}><Plus size={15} aria-hidden /> {t('Add your first project')}</button>} />
      ) : (
        <div className="gpf-projects">
          {c.portfolioData.projects.map((p) => (
            <Card key={p.id} className="gpf-project">
              <button type="button" className="gpf-project-img" style={p.image ? { backgroundImage: `url(${p.image})` } : undefined}
                onClick={() => { c.setEditingProjectId(p.id); projectImageInputRef.current?.click(); }} aria-label={p.image ? t('Change image') : t('Upload image')}>
                <span className="gpf-project-img-label"><Camera size={15} aria-hidden /> {p.image ? t('Change image') : t('Upload image')}</span>
              </button>
              <div className="gpf-project-body">
                <Field label="Project title" htmlFor={`gpf-pt-${p.id}`}>
                  <input id={`gpf-pt-${p.id}`} className="gpf-input" value={p.title} placeholder={t('e.g. Wedding at Serena')} onChange={(e) => c.updateProject(p.id, 'title', e.target.value)} />
                </Field>
                <div className="gpf-row2">
                  <Field label="Year" htmlFor={`gpf-py-${p.id}`}>
                    <select id={`gpf-py-${p.id}`} className="gpf-input" value={p.year} onChange={(e) => c.updateProject(p.id, 'year', e.target.value)}>
                      <option value="">{t('Year')}</option>{c.yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                  <Field label="Description" htmlFor={`gpf-pd-${p.id}`}>
                    <input id={`gpf-pd-${p.id}`} className="gpf-input" value={p.description} placeholder={t('Short description')} onChange={(e) => c.updateProject(p.id, 'description', e.target.value)} />
                  </Field>
                </div>
                <div className="gpf-actions-end">
                  <button type="button" className="g-icon-btn gpf-danger-icon" aria-label={t('Remove project')} onClick={() => c.removeProject(p.id)}><Trash2 size={16} aria-hidden /></button>
                  <button type="button" className="g-btn g-btn-primary" disabled={c.savingProject === p.id || !p.title}
                    onClick={async () => { const ok = await c.addProjectToAPI(p); c.showToast(ok ? 'success' : 'error', ok ? 'Project saved successfully' : 'Failed to save project'); }}>
                    {c.savingProject === p.id ? t('Saving…') : <><Check size={15} aria-hidden /> {t('Save project')}</>}
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {pending.map((ch) => {
            const data = (() => { try { return JSON.parse(ch.payload || '{}'); } catch { return {}; } })();
            const img = ch.imageData ? `https://backend.connekyt.com/uploads/photographer/projects/images/${ch.imageData}` : '';
            return (
              <Card key={ch.id} className="gpf-project is-pending">
                <div className="gpf-project-img" style={img ? { backgroundImage: `url(${img})` } : undefined} />
                <div className="gpf-project-body">
                  <Chip tone="pending"><Hourglass size={12} aria-hidden /> {t('Pending approval')}</Chip>
                  <strong>{data.title || t('Untitled')}</strong>
                  {data.year ? <small className="gpf-help">{data.year}</small> : null}
                  {data.description ? <p className="gpf-help">{data.description}</p> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExperienceTab({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const pending = c.getPendingAddItems('workExperiences');
  return (
    <div className="gpf-tab">
      <div className="gpf-section-head">
        <h3 className="gpf-h">{t('Work experience')} <PendingTag c={c} field="workExperiences" /></h3>
        <button type="button" className="g-btn g-btn-ghost" disabled={!c.isEditEnabled} onClick={c.addExperience}><Plus size={15} aria-hidden /> {t('Add experience')}</button>
      </div>
      <p className="gpf-help">{t('Add the work that shows your professional background.')}</p>
      {!c.experienceData.experiences.length && !pending.length ? (
        <EmptyState title="No work experience added yet" action={<button type="button" className="g-btn g-btn-primary" disabled={!c.isEditEnabled} onClick={c.addExperience}><Plus size={15} aria-hidden /> {t('Add experience')}</button>} />
      ) : (
        <div className="gpf-exps">
          {c.experienceData.experiences.map((x) => (
            <Card key={x.id} className="gpf-exp">
              <div className="gpf-exp-top">
                <strong className="g-ellipsis">{x.position || t('New experience')}</strong>
                <button type="button" className="g-icon-btn gpf-danger-icon" aria-label={t('Remove experience')} onClick={() => c.removeExperience(x.id)}><Trash2 size={16} aria-hidden /></button>
              </div>
              <div className="gpf-grid">
                <Field label="Position or title *" htmlFor={`gpf-ep-${x.id}`}><input id={`gpf-ep-${x.id}`} className="gpf-input" value={x.position} placeholder={t('e.g. Lead wedding photographer')} onChange={(e) => c.updateExperience(x.id, 'position', e.target.value)} /></Field>
                <Field label="Company or organisation *" htmlFor={`gpf-ec-${x.id}`}><input id={`gpf-ec-${x.id}`} className="gpf-input" value={x.company} placeholder={t('e.g. Elite Studios')} onChange={(e) => c.updateExperience(x.id, 'company', e.target.value)} /></Field>
                <Field label="Location" htmlFor={`gpf-el-${x.id}`}><input id={`gpf-el-${x.id}`} className="gpf-input" value={x.location} placeholder={t('e.g. Kigali, Rwanda')} onChange={(e) => c.updateExperience(x.id, 'location', e.target.value)} /></Field>
                <Field label="Duration">
                  <span className="gpf-times">
                    <label className="sr-only" htmlFor={`gpf-es-${x.id}`}>{t('Start year')}</label>
                    <select id={`gpf-es-${x.id}`} className="gpf-input" value={x.startDate} onChange={(e) => c.updateExperience(x.id, 'startDate', e.target.value)}><option value="">{t('Start year')}</option>{c.yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}</select>
                    <span className="gpf-help">{t('to')}</span>
                    <label className="sr-only" htmlFor={`gpf-ee-${x.id}`}>{t('End year')}</label>
                    <select id={`gpf-ee-${x.id}`} className="gpf-input" value={x.endDate} onChange={(e) => c.updateExperience(x.id, 'endDate', e.target.value)}><option value="">{t('End year')}</option>{c.yearOptionsWithPresent.map((y) => <option key={y} value={y}>{y === 'Present' ? t('Present') : y}</option>)}</select>
                  </span>
                </Field>
              </div>
              <Field label="Description" htmlFor={`gpf-ed-${x.id}`} help="Over 50 characters counts towards your profile score." counter={`${x.description.length}`}>
                <textarea id={`gpf-ed-${x.id}`} className="gpf-input gpf-textarea" rows={3} value={x.description} placeholder={t('Your responsibilities, achievements and key projects')} onChange={(e) => c.updateExperience(x.id, 'description', e.target.value)} />
              </Field>
              {c.isEditEnabled && (
                <div className="gpf-actions-end">
                  <button type="button" className="g-btn g-btn-primary" disabled={c.savingExperience === x.id || !x.position || !x.company} onClick={() => c.saveExperienceToAPI(x)}>
                    {c.savingExperience === x.id ? t('Saving…') : <><Check size={15} aria-hidden /> {t('Save experience')}</>}
                  </button>
                </div>
              )}
            </Card>
          ))}
          {pending.map((it) => (
            <Card key={it._pendingId} className="gpf-exp is-pending">
              <div className="gpf-exp-top">
                <span className="gc-two"><strong>{it.position || t('Position')}</strong><small>{[it.company, it.location].filter(Boolean).join(' · ')}{it.startDate ? ` · ${it.startDate} – ${it.endDate || t('Present')}` : ''}</small></span>
                <Chip tone="pending"><Hourglass size={12} aria-hidden /> {t('Pending approval')}</Chip>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GlassProfile({ ctl: c }: { ctl: Ctl }) {
  const { t } = useLanguage();
  const [snap, setSnap] = useState<string | null>(null);
  const restore = useRef<{ basicInfo: Ctl['basicInfo']; overviewData: Ctl['overviewData']; portfolioData: Ctl['portfolioData'] } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Discard remounts the phone field so it shows the saved number again (it keeps its own typing state).
  const [resetKey, setResetKey] = useState(0);

  // Snapshot the form when editing starts; take a new one after every save finishes.
  const wasSaving = useRef(false);
  useEffect(() => {
    if (c.isEditEnabled && snap === null) {
      setSnap(snapshotOf(c));
      restore.current = { basicInfo: c.basicInfo, overviewData: c.overviewData, portfolioData: c.portfolioData };
    }
    if (!c.isEditEnabled && snap !== null) { setSnap(null); restore.current = null; }
  }, [c, snap]);
  useEffect(() => {
    if (wasSaving.current && !c.isSavingAll && c.isEditEnabled) {
      setSnap(snapshotOf(c));
      restore.current = { basicInfo: c.basicInfo, overviewData: c.overviewData, portfolioData: c.portfolioData };
    }
    wasSaving.current = c.isSavingAll;
  }, [c, c.isSavingAll]);

  const dirty = c.isEditEnabled && snap !== null && snap !== snapshotOf(c);
  const discard = () => {
    const r = restore.current;
    if (r) { c.setBasicInfo(r.basicInfo); c.setOverviewData(r.overviewData); c.setPortfolioData(r.portfolioData); }
    c.setPhoneValue(null);
    setResetKey((k) => k + 1);
    setConfirmDiscard(false);
    c.setIsEditEnabled(false);
  };
  const saveLabel = !c.isAccountAccepted ? 'Submit profile' : c.pendingChanges.length ? 'Submit changes' : 'Save changes';
  // An approved account saves only real changes; a profile not yet approved can always be submitted (a restored draft
  // is already in the form when editing starts).
  const canSave = c.isEditEnabled && !c.isSavingAll && (!c.isAccountAccepted || dirty);
  const chip = statusChip(c);
  const showOverlay = c.profileCompletion < 100 && !c.missingFieldsOverlayDismissed;
  const jump = (s: 'basic' | 'overview' | 'portfolio' | 'experience') => { c.setMissingFieldsOverlayDismissed(true); c.jumpToSection(s); };
  const tab = c.activeTab as Tab;
  const status = c.user?.profileReviewStatus?.toLowerCase();
  const saveButton = (full?: boolean) => (
    <button type="button" className={`g-btn g-btn-primary gpf-save${full ? ' gpf-save-full' : ''}`} disabled={!canSave} onClick={c.handleSaveAllChanges}>
      <Check size={16} aria-hidden /> {c.isSavingAll ? t('Saving…') : t(saveLabel)}
    </button>
  );

  return (
    <div className="gp-page gpf-page">
      {!c.canEditProfile && (
        <p role="alert" className="gpf-banner gpf-banner-warn"><Eye size={16} aria-hidden /> <span><strong>{t('View only')}:</strong> {t('you do not have the profile.edit permission. Ask an organisation owner to grant it if you need to make changes.')}</span></p>
      )}
      <PageHeader eyebrow="Profile" title="Edit profile" subtitle="Keep your information current so clients find and trust you."
        action={chip ? <Chip tone={chip.tone}><span className="gpf-dot" aria-hidden /> {t(chip.label)}</Chip> : undefined} />

      {c.showDraftRestoredNotice && <p role="status" className="gpf-banner gpf-banner-ok"><CircleCheck size={16} aria-hidden /> {t('Your previous changes have been restored.')}</p>}

      {status && status !== 'accepted' && (
        status === 'rejected' ? (
          <div className="gpf-banner gpf-banner-error" role="status"><CircleAlert size={18} aria-hidden /><span><strong>{t('Your profile needs changes before it can be approved')}</strong><br />{t('Our team reviewed your profile and found areas that need attention. Update the sections and save to resubmit.')}</span></div>
        ) : c.profileCompletion < 85 ? (
          <div className="gpf-banner gpf-banner-warn" role="status"><CircleAlert size={18} aria-hidden /><span><strong>{t('Complete your profile to get started')}</strong><br />{t('Once your profile reaches 85%, it is submitted for review automatically.')}</span></div>
        ) : (
          <div className="gpf-banner gpf-banner-info" role="status"><Hourglass size={18} aria-hidden /><span><strong>{t('Your profile is under review')}</strong><br />{t('You will be notified once your account is approved and you can start receiving bookings.')}</span></div>
        )
      )}
      {c.isAccountAccepted && c.pendingChanges.length > 0 && (
        <div className="gpf-banner gpf-banner-warn" role="status"><Hourglass size={18} aria-hidden /><span><strong>{c.pendingChanges.length} {t(c.pendingChanges.length === 1 ? 'profile change pending approval' : 'profile changes pending approval')}</strong><br />{t('You changed sensitive fields. Our team reviews them and applies them once approved. Look for the Pending approval tag.')}</span></div>
      )}

      <Card className="gpf-completion">
        <CompletionRing value={c.profileCompletion} />
        <div className="gc-two">
          <strong className="gpf-completion-title">{t(c.profileCompletion >= 100 ? 'Your profile is complete' : 'Complete your profile')}</strong>
          <span className="gpf-help">{t(c.profileCompletion >= 100 ? 'Nice work. Every section clients look at is filled in.' : 'A complete profile helps clients find you and trust your work.')}</span>
          {c.profileCompletion < 100 && (
            <span className="gpf-chips gpf-chips-tight">
              {!c.profileImage && <button type="button" className="gpf-chip" onClick={() => jump('basic')}><Plus size={13} aria-hidden /> {t('Add profile photo')}</button>}
              {c.overviewData.specialties.length < 2 && <button type="button" className="gpf-chip" onClick={() => jump('overview')}><Plus size={13} aria-hidden /> {t('Add specialties')}</button>}
              {c.portfolioData.projects.length < 1 && <button type="button" className="gpf-chip" onClick={() => jump('portfolio')}><Plus size={13} aria-hidden /> {t('Add a project')}</button>}
              {c.experienceData.experiences.length < 1 && <button type="button" className="gpf-chip" onClick={() => jump('experience')}><Plus size={13} aria-hidden /> {t('Add experience')}</button>}
            </span>
          )}
        </div>
      </Card>

      <fieldset className="gpf-fieldset" disabled={!c.canEditProfile}>
        <div className="gpf-layout">
          <ProfileCard c={c} />
          <Card className="gpf-form" id="profile-tabs-section">
            <div className="gpf-tabs" role="tablist" aria-label={t('Profile sections')}>
              {TABS.map((x) => (
                <button key={x.key} type="button" role="tab" aria-selected={tab === x.key} className={`gpf-tab-btn${tab === x.key ? ' is-on' : ''}`} onClick={() => c.setActiveTab(x.key)}>
                  <span className="gpf-tab-long">{t(x.label)}</span><span className="gpf-tab-short">{t(x.short ?? x.label)}</span>
                </button>
              ))}
            </div>
            {tab !== 'packages' && (
              <div className="gpf-editbar">
                <span className="gpf-help">{t(c.isEditEnabled ? 'Changes are saved to your public profile.' : 'Turn on Editing to change your details.')}</span>
                <span className="gpf-editbar-actions">
                  <Switch on={c.isEditEnabled} onChange={c.setIsEditEnabled} label="Editing" />
                  <span className="gpf-desktop-only">{saveButton()}</span>
                </span>
              </div>
            )}
            <div role="tabpanel" aria-label={t(TABS.find((x) => x.key === tab)?.label ?? '')}>
              {tab === 'overview' && <OverviewTab c={c} resetKey={resetKey} />}
              {tab === 'portfolio' && <PortfolioTab c={c} />}
              {tab === 'experience' && <ExperienceTab c={c} />}
              {tab === 'packages' && (
                <div className="gpf-tab">
                  <PhotographerPackagesManager currencies={c.currencies} canEdit={c.canEditProfile} onOpenGeoPricing={(pkg) => c.setGeoPkg(pkg)} onPackagesChanged={c.refreshUserProfile} />
                </div>
              )}
            </div>
            {tab !== 'packages' && <div className="gpf-phone-only">{saveButton(true)}</div>}
          </Card>
        </div>
      </fieldset>

      {dirty && (
        <div className="g-panel gpf-unsaved" role="region" aria-label={t('Unsaved changes')}>
          <span>{t('You have unsaved changes')}</span>
          <span className="gpf-unsaved-actions">
            <button type="button" className="g-btn g-btn-ghost" onClick={() => setConfirmDiscard(true)}>{t('Discard')}</button>
            {saveButton()}
          </span>
        </div>
      )}

      {showOverlay && (
        <GlassModal title="Finish your profile" onClose={() => c.setMissingFieldsOverlayDismissed(true)} width={560}>
          <p className="gp-sub" style={{ marginTop: 0 }}>{`${t('Your profile is at')} ${c.profileCompletion}%. ${t('Finish these sections to use the rest of the dashboard.')}`}</p>
          <MissingList c={c} onJump={jump} />
        </GlassModal>
      )}
      {!showOverlay && c.profileCompletion < 100 && (
        <details className="g-panel gpf-missing-card">
          <summary>{t('What is still missing')}</summary>
          <MissingList c={c} onJump={jump} />
        </details>
      )}

      {confirmDiscard && <ConfirmDialog title="Discard your changes?" body="Your edits since you turned on Editing are removed." confirmLabel="Discard" onClose={() => setConfirmDiscard(false)} onConfirm={discard} />}

      <div className="gpf-toasts" aria-live="polite">
        {c.toasts.map((x) => (
          <p key={x.id} role={x.type === 'error' ? 'alert' : 'status'} className={`g-panel gpf-toast gpf-toast-${x.type}`}>
            {x.type === 'success' ? <CircleCheck size={16} aria-hidden /> : <CircleAlert size={16} aria-hidden />}
            <span>{t(x.message)}</span>
            <button type="button" className="g-icon-btn" aria-label={t('Dismiss')} onClick={() => c.dismissToast(x.id)}><X size={14} aria-hidden /></button>
          </p>
        ))}
      </div>

      <ApprovalPendingModal isOpen={c.showApprovalModal} profileCompletion={c.profileCompletion} />
      <KycVerificationModal isOpen={c.showKycModal} onClose={() => c.setShowKycModal(false)} onSuccess={() => { c.setShowKycModal(false); c.refreshUserProfile(); }} colors={c.colors} actualTheme={c.actualTheme} />
      {c.packageToRemove && (
        <ConfirmDialog title="Remove this package?" confirmLabel="Remove"
          body={`${t('You are about to remove your')} ${c.packageToRemove.packageName || t('package')} ${t('tier. Clients will no longer see it on your profile or in the booking wizard.')}`}
          onClose={() => c.setPackageToRemove(null)} onConfirm={() => { c.removePackage(c.packageToRemove!.id); c.setPackageToRemove(null); }} />
      )}
      <GeoPricingManager open={!!c.geoPkg} onClose={() => c.setGeoPkg(null)} kind="package" targetId={c.geoPkg?.id ?? ''} name={c.geoPkg?.name} />
    </div>
  );
}
