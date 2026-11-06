import { describe, expect, it } from 'vitest';
import { getStartedActions, preferencesPath, shouldAutoOpen } from './getStarted';

describe('Get started shortcuts by role', () => {
  it('shows only what the role can do', () => {
    expect(getStartedActions('client', { canHost: false }).map((a) => a.key)).toEqual(['create-event']);
    expect(getStartedActions('client', { canHost: true }).map((a) => a.key)).toEqual(['create-event', 'go-live']);
    expect(getStartedActions('coordinator', { canHost: false }).map((a) => a.key)).toEqual(['create-event']);
    expect(getStartedActions('photographer', { canHost: true }).map((a) => a.key)).toEqual(['go-live', 'new-album', 'photobook']);
    expect(getStartedActions('photographer', { canHost: false }).map((a) => a.key)).toEqual(['new-album', 'photobook']);
  });

  it('shows nothing to a team member without the create permission', () => {
    expect(getStartedActions('photographer', { canHost: true, canCreate: false })).toEqual([]);
  });

  it('saves to the role-specific preferences path', () => {
    expect(preferencesPath('client')).toBe('/api/remote/customer/preferences');
    expect(preferencesPath('coordinator')).toBe('/api/remote/coordinator/preferences');
    expect(preferencesPath('photographer')).toBe('/api/remote/photographer/preferences');
  });
});

describe('when the modal opens by itself', () => {
  const ready = { actions: 2, listLoaded: true, hasItems: false, dismissed: false, shownThisSession: false };
  it('opens for a user with nothing yet, once per session', () => {
    expect(shouldAutoOpen(ready)).toBe(true);
    expect(shouldAutoOpen({ ...ready, shownThisSession: true })).toBe(false);
  });
  it('stays closed once they have items, ticked "don\'t show again", or while anything is unknown', () => {
    expect(shouldAutoOpen({ ...ready, hasItems: true })).toBe(false);
    expect(shouldAutoOpen({ ...ready, dismissed: true })).toBe(false);
    expect(shouldAutoOpen({ ...ready, dismissed: null })).toBe(false);
    expect(shouldAutoOpen({ ...ready, listLoaded: false })).toBe(false);
    expect(shouldAutoOpen({ ...ready, actions: 0 })).toBe(false);
  });
});
