import { describe, expect, it } from 'vitest';
import {
  normalizeExperienceDraft,
  normalizeOverviewDraft,
  normalizePortfolioDraft,
} from './profileDraft';

// CONNEKYT-DASHBOARD-4: the photographer profile page crashed with
// "Cannot read properties of undefined (reading 'length')" because a draft saved before
// spokenLanguages existed was copied straight into state, and the completion score then
// read overviewData.spokenLanguages.length.
describe('normalizeOverviewDraft', () => {
  it('fills the lists an older draft never had, and keeps what it did have', () => {
    const old = { about: 'Wedding photographer', specialties: ['wedding', 'portrait'] };
    expect(normalizeOverviewDraft(old)).toEqual({
      about: 'Wedding photographer',
      specialties: ['wedding', 'portrait'],
      spokenLanguages: [],
      equipments: [],
    });
  });

  it('never returns undefined for any list, whatever the draft holds', () => {
    for (const bad of [undefined, null, 'text', 42, [], {}, { specialties: null, spokenLanguages: 'EN', equipments: {} }]) {
      const out = normalizeOverviewDraft(bad);
      expect(out.about).toBe('');
      expect(out.specialties).toEqual([]);
      expect(out.spokenLanguages).toEqual([]);
      expect(out.equipments).toEqual([]);
    }
  });

  it('drops entries that are not non-empty strings', () => {
    const out = normalizeOverviewDraft({ spokenLanguages: ['EN', '', null, 7, 'FR'], specialties: [{ id: 1 }, 'wedding'] });
    expect(out.spokenLanguages).toEqual(['EN', 'FR']);
    expect(out.specialties).toEqual(['wedding']);
  });

  it('can be measured with .length straight away, which is what the completion score does', () => {
    const out = normalizeOverviewDraft({ about: 'x' });
    expect(out.specialties.length >= 2).toBe(false);
    expect(out.spokenLanguages.length >= 1).toBe(false);
  });
});

describe('normalizePortfolioDraft and normalizeExperienceDraft', () => {
  it('give empty lists for a missing or malformed draft', () => {
    expect(normalizePortfolioDraft(undefined)).toEqual({ beliefs: '', skills: [], projects: [] });
    expect(normalizePortfolioDraft({ beliefs: 5, skills: 'x', projects: null })).toEqual({ beliefs: '', skills: [], projects: [] });
    expect(normalizeExperienceDraft(null)).toEqual({ experiences: [] });
    expect(normalizeExperienceDraft({ experiences: 'x' })).toEqual({ experiences: [] });
  });

  it('keep valid lists untouched', () => {
    const skills = [{ id: 's1' }];
    const projects = [{ id: 'p1' }];
    expect(normalizePortfolioDraft({ beliefs: 'quality', skills, projects })).toEqual({ beliefs: 'quality', skills, projects });
    expect(normalizeExperienceDraft({ experiences: [{ id: 'e1' }] })).toEqual({ experiences: [{ id: 'e1' }] });
  });
});
