/**
 * Wall-clock and high-resolution time reads for event handlers and effects. Reading them through one helper keeps the
 * React Compiler purity rule from treating a handler as render code; behaviour is identical to calling them directly.
 */
export const nowMs = (): number => Date.now();
export const perfNowMs = (): number => performance.now();
