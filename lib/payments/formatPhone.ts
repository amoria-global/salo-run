/**
 * E.164 phone formatter mirroring the backend's
 * PawapayApiService.formatPhone(phone, iso2Country). Used to preview
 * what gets sent to the gateway and to validate before submit.
 */

export const DIAL_CODES: Record<string, string> = {
  RW: '250', KE: '254', UG: '256', TZ: '255', ZM: '260', GH: '233',
  NG: '234', MW: '265', BJ: '229', BF: '226', CM: '237', CD: '243',
  CG: '242', CI: '225', ET: '251', GA: '241', LS: '266', MZ: '258',
  SN: '221', SL: '232', ZW: '263',
};

export function dialCodeFor(iso2: string | null | undefined): string {
  if (!iso2) return '250';
  return DIAL_CODES[iso2.toUpperCase().trim()] ?? '250';
}

export function formatPhoneE164(phone: string, iso2: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  const dial = dialCodeFor(iso2);
  if (cleaned.startsWith(dial)) return cleaned;
  if (cleaned.startsWith('0')) return dial + cleaned.slice(1);
  return dial + cleaned;
}

export function isPlausibleMobile(phone: string, iso2: string | null | undefined): boolean {
  const e164 = formatPhoneE164(phone, iso2);
  const dial = dialCodeFor(iso2);
  const national = e164.startsWith(dial) ? e164.slice(dial.length) : e164;
  return national.length >= 8 && national.length <= 12;
}
