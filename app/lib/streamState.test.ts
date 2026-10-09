import { describe, it, expect } from 'vitest';
import { hasActiveStream } from './streamState';

describe('hasActiveStream', () => {
  it('is true for a started stream even when the package has no live-stream flag', () => {
    for (const s of ['connected', 'paused', 'disconnected', 'CONNECTED']) {
      expect(hasActiveStream(s)).toBe(true);
    }
  });

  it('is false when no stream was started or it is over', () => {
    for (const s of [undefined, null, '', 'ended', 'terminated']) {
      expect(hasActiveStream(s)).toBe(false);
    }
  });
});
