import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/app/components/CountrySelect', () => ({
  default: ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) => (
    <select data-stub="country" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}><option>Rwanda</option><option>Kenya</option></select>
  ),
  eastAfricanCountries: [],
}));
vi.mock('@/app/components/phone/InternationalPhoneInput', () => ({ default: ({ disabled }: { disabled: boolean }) => <input data-stub="phone" disabled={disabled} /> }));

import GlassClientProfile from './GlassClientProfile';
import GlassCoordinatorProfile from './GlassCoordinatorProfile';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const form = { fullName: 'Ada Client', username: 'ada', email: 'ada@example.test', phoneCode: '+250', phoneNumber: '788000000', title: '', country: 'Rwanda', province: 'Kigali City', district: 'Gasabo', sector: '' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctl(over: Record<string, unknown> = {}): Record<string, any> {
  const state: { formData: Record<string, string> } = { formData: { ...form } };
  const c: Record<string, unknown> = {
    colors: {}, actualTheme: 'dark', user: { kycStatus: 'NOT_SUBMITTED', joinedFrom: '2026-01-05' }, formData: state.formData,
    setFormData: vi.fn(), isEditEnabled: false, setIsEditEnabled: vi.fn(), isSaving: false, isUploadingImage: false, profileImage: '',
    profileInputRef: { current: null }, validationErrors: {}, phoneValue: null, setPhoneValue: vi.fn(), savedPhone: { country: null, nsn: '' },
    rwandaProvinces: { 'Kigali City': ['Gasabo', 'Kicukiro'], 'Eastern Province': ['Bugesera'] },
    handleSaveProfile: vi.fn(), handleInputChange: vi.fn(), handleFullNameChange: vi.fn(), handleProfileImageUpload: vi.fn(), setShowKycModal: vi.fn(), inputStyle: {},
    ...over,
  };
  return c;
}

let host: HTMLDivElement;
let root: Root;
const render = async (node: React.ReactElement) => { await act(async () => { root.render(node); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassClientProfile', () => {
  it('locked until Editing is on; Save stays muted until something changes', async () => {
    const c = ctl();
    await render(<GlassClientProfile ctl={c as never} modals={<div data-stub="modals" />} />);
    expect((host.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    expect((button(/^Save changes$/) as HTMLButtonElement).disabled).toBe(true);
    await click(button(/^Editing$/));
    expect(c.setIsEditEnabled).toHaveBeenCalledWith(true);
    // editing on, nothing changed yet: still muted
    const on = ctl({ isEditEnabled: true });
    await render(<GlassClientProfile ctl={on as never} modals={null} />);
    expect((button(/^Save changes$/) as HTMLButtonElement).disabled).toBe(true);
    expect(text()).not.toContain('You have unsaved changes');
  });

  it('after a change Save turns on, the sticky bar shows, and both save through the page handler', async () => {
    const c = ctl();
    await render(<GlassClientProfile ctl={c as never} modals={null} />);
    await click(button(/^Editing$/));
    const changed = { ...c, isEditEnabled: true, formData: { ...c.formData, fullName: 'Ada New' } };
    await render(<GlassClientProfile ctl={changed as never} modals={null} />);
    expect(text()).toContain('You have unsaved changes');
    const saves = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent === 'Save changes');
    expect(saves).toHaveLength(2);
    expect((saves[0] as HTMLButtonElement).disabled).toBe(false);
    await click(saves[1]);
    expect(c.handleSaveProfile).toHaveBeenCalled();
  });

  it('username and email are read-only; KYC Verify opens the dialog; Rwanda shows province and district lists', async () => {
    const c = ctl({ isEditEnabled: true });
    await render(<GlassClientProfile ctl={c as never} modals={<div data-stub="modals" />} />);
    const inputs = Array.from(host.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.find((i) => i.value === 'ada')?.disabled).toBe(true);
    expect(inputs.find((i) => i.value === 'ada@example.test')?.disabled).toBe(true);
    await click(button(/^Verify now$/));
    expect(c.setShowKycModal).toHaveBeenCalledWith(true);
    const selects = Array.from(host.querySelectorAll('select:not([data-stub])')) as HTMLSelectElement[];
    expect(selects.map((s) => s.value)).toEqual(['Kigali City', 'Gasabo']);
    expect(host.querySelector('[data-stub=modals]')).toBeTruthy();
  });

  it('pending KYC has no button; approved shows Verified', async () => {
    await render(<GlassClientProfile ctl={ctl({ user: { kycStatus: 'PENDING' } }) as never} modals={null} />);
    expect(text()).toContain('KYC under review');
    expect(button(/^Verify now$|^Resubmit$/)).toBeFalsy();
    await render(<GlassClientProfile ctl={ctl({ user: { kycStatus: 'APPROVED' } }) as never} modals={null} />);
    expect(text()).toContain('Verified');
  });
});

describe('GlassCoordinatorProfile', () => {
  it('adds the business details and edits them through the page handler', async () => {
    const c = ctl({ isEditEnabled: true, formData: { ...form, organizationName: 'Gala Co', businessType: '', taxId: '', businessAddress: '', website: '' } });
    await render(<GlassCoordinatorProfile ctl={c as never} modals={null} />);
    expect(text()).toContain('Business details');
    expect(text()).toContain('Event Coordinator');
    const org = Array.from(host.querySelectorAll('input')).find((i) => (i as HTMLInputElement).value === 'Gala Co') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(org, 'Gala Company');
      org.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(c.handleInputChange).toHaveBeenCalledWith('organizationName', 'Gala Company');
  });
});
