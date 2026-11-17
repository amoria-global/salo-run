import { describe, expect, it } from 'vitest';
import { readHostGuess, rememberHost } from './useHostGuess';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };

describe('host guess (keeps the Home hero from shrinking after load)', () => {
  it('is unknown on a first visit, so the tile placeholder is still reserved', () => {
    expect(readHostGuess(memory(), 'u1')).toBeNull();
  });

  it('remembers that an account cannot host, so the next load reserves nothing', () => {
    const s = memory();
    rememberHost(s, 'u1', false);
    expect(readHostGuess(s, 'u1')).toBe(false);
  });

  it('is per account', () => {
    const s = memory();
    rememberHost(s, 'u1', true);
    expect(readHostGuess(s, 'u1')).toBe(true);
    expect(readHostGuess(s, 'u2')).toBeNull();
  });

  it('treats blocked storage as unknown and never throws', () => {
    const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(() => rememberHost(blocked, 'u1', true)).not.toThrow();
    expect(readHostGuess(blocked, 'u1')).toBeNull();
    expect(readHostGuess(undefined, 'u1')).toBeNull();
  });
});
