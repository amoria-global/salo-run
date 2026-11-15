/**
 * Shapes for a photographer profile draft restored from the browser's local storage.
 *
 * A draft is whatever an older build of the page saved, so it can lack fields that were added
 * later (spokenLanguages, for one) or hold the wrong type. The profile page reads `.length` on
 * these lists to work out how complete the profile is, so every list must exist before the
 * draft reaches state. Anything missing or malformed becomes an empty value instead.
 */

export interface OverviewDraft {
  about: string;
  specialties: string[];
  spokenLanguages: string[];
  equipments: string[];
}

const asRecord = (raw: unknown): Record<string, unknown> =>
  raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function normalizeOverviewDraft(raw: unknown): OverviewDraft {
  const d = asRecord(raw);
  return {
    about: text(d.about),
    specialties: strings(d.specialties),
    spokenLanguages: strings(d.spokenLanguages),
    equipments: strings(d.equipments),
  };
}

export function normalizePortfolioDraft<Skill = unknown, Project = unknown>(
  raw: unknown,
): { beliefs: string; skills: Skill[]; projects: Project[] } {
  const d = asRecord(raw);
  return { beliefs: text(d.beliefs), skills: list<Skill>(d.skills), projects: list<Project>(d.projects) };
}

export function normalizeExperienceDraft<Experience = unknown>(raw: unknown): { experiences: Experience[] } {
  return { experiences: list<Experience>(asRecord(raw).experiences) };
}
