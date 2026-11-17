'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Phones show every table as stacked card rows (the CSS in glass-pages.css keys on data-stack="true" and data-label).
 * The old pages draw their own tables, so this marks them: each cell gets its column's header text as data-label. A table
 * can opt out with data-stack="false". Pure DOM attributes, no layout work in JS; runs once per DOM change batch.
 */
export function labelTable(table: HTMLTableElement): void {
  if (table.getAttribute('data-stack') === 'false') return;
  const cellsOf = (row: Element) => Array.from(row.children).filter((c) => c.tagName === 'TD' || c.tagName === 'TH') as HTMLTableCellElement[];
  // Only a real header row counts: a thead, or a first row made entirely of th cells. A table of plain data rows is left alone.
  let head: Element | null = table.querySelector(':scope > thead > tr');
  if (!head) {
    const first = table.querySelector(':scope > tbody > tr, :scope > tr');
    head = first && cellsOf(first).length > 0 && cellsOf(first).every((c) => c.tagName === 'TH') ? first : null;
  }
  if (!head) return;
  const labels = cellsOf(head).map((c) => (c.textContent || '').trim());
  if (!labels.some(Boolean)) return;
  table.setAttribute('data-stack', 'true');
  for (const row of Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr'))) {
    if (row === head) continue;
    let col = 0;
    for (const cell of cellsOf(row)) {
      if (!cell.hasAttribute('data-label')) cell.setAttribute('data-label', labels[col] ?? '');
      col += Number(cell.getAttribute('colspan')) || 1;
    }
  }
}

export function useStackTables(hostRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let frame = 0;
    const run = () => { frame = 0; host.querySelectorAll('table').forEach((t) => labelTable(t as HTMLTableElement)); };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(run); };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(host, { childList: true, subtree: true });
    return () => { mo.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [hostRef]);
}
