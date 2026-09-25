/**
 * Pulls the invite code out of a pasted collaboration link, or returns the
 * input when it already is a bare code. Kept free of imports so both the
 * API client and tests can use it.
 */
export function tokenFromInput(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/join\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : trimmed;
}
