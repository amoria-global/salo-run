import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

import { Chip, ConfirmDialog, DateTile, EmptyState, ErrorState, GlassModal, PageHeader, Row, RowsSkeleton, Segmented } from './index';
import { labelTable } from '../useStackTables';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
const mount = async (el: React.ReactElement) => { await act(async () => { root.render(el); }); };

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('glass page building blocks', () => {
  it('PageHeader shows title, subtitle and the primary action on the right', async () => {
    await mount(<PageHeader title="Opportunities" subtitle="Events near you" action={<button type="button">New</button>} />);
    expect(host.querySelector('h1')?.textContent).toBe('Opportunities');
    expect(host.querySelector('.gp-sub')?.textContent).toBe('Events near you');
    expect(host.querySelector('.gp-head-action button')?.textContent).toBe('New');
  });

  it('Segmented selects, exposes aria state and moves with the arrow keys', async () => {
    const onChange = vi.fn();
    await mount(<Segmented label="Filter" value="a" onChange={onChange} options={[{ key: 'a', label: 'One', count: 2 }, { key: 'b', label: 'Two' }]} />);
    const tabs = host.querySelectorAll('[role=tab]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].textContent).toContain('2');
    await act(async () => { (tabs[1] as HTMLElement).click(); });
    expect(onChange).toHaveBeenLastCalledWith('b');
    await act(async () => { tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
    expect(onChange).toHaveBeenLastCalledWith('b');
  });

  it('Chip always carries text, not only colour', async () => {
    await mount(<Chip tone="success">Paid</Chip>);
    expect(host.textContent).toBe('Paid');
    expect(host.querySelector('.gp-chip-success')).not.toBeNull();
  });

  it('Row renders as a link, a button or a plain row with title, subtitle, amount and chip', async () => {
    const click = vi.fn();
    await mount(<div>
      <Row href="/x" title="Wedding" subtitle="Kigali" amount="$50.00" chip={<Chip>Live</Chip>} lead={<DateTile date="2026-11-28T10:00:00" />} />
      <Row onClick={click} title="Tap" />
      <Row title="Plain" />
    </div>);
    const link = host.querySelector('a.gp-row')!;
    expect(link.getAttribute('href')).toBe('/x');
    expect(link.textContent).toContain('Wedding');
    expect(link.textContent).toContain('$50.00');
    expect(link.textContent).toContain('28');
    await act(async () => { (host.querySelector('button.gp-row') as HTMLElement).click(); });
    expect(click).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll('div.gp-row')).toHaveLength(1);
  });

  it('shows the loading, empty and error states, and Retry calls back', async () => {
    const retry = vi.fn();
    await mount(<div><RowsSkeleton rows={3} /><EmptyState title="Nothing here" body="Come back later" /><ErrorState message="Could not load" onRetry={retry} /></div>);
    expect(host.querySelector('[aria-busy=true]')?.children).toHaveLength(3);
    expect(host.querySelector('.gp-empty')?.textContent).toContain('Come back later');
    expect(host.querySelector('[role=alert]')?.textContent).toContain('Could not load');
    await act(async () => { (host.querySelector('[role=alert] button') as HTMLElement).click(); });
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('GlassModal closes on Escape and on a click outside, not on a click inside', async () => {
    const onClose = vi.fn();
    await mount(<GlassModal title="Hello" onClose={onClose}><button type="button" id="in">inside</button></GlassModal>);
    expect(host.querySelector('[role=dialog]')?.getAttribute('aria-modal')).toBe('true');
    await act(async () => { (host.querySelector('#in') as HTMLElement).click(); });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(async () => { (host.querySelector('.gp-scrim') as HTMLElement).click(); });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('ConfirmDialog asks first: cancel closes, confirm runs, busy disables the confirm button', async () => {
    const onConfirm = vi.fn(); const onClose = vi.fn();
    await mount(<ConfirmDialog title="Delete?" body="This cannot be undone" confirmLabel="Delete" onConfirm={onConfirm} onClose={onClose} />);
    const [cancel, ok] = Array.from(host.querySelectorAll('.gp-modal-foot button')) as HTMLButtonElement[];
    await act(async () => { cancel.click(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await act(async () => { ok.click(); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await mount(<ConfirmDialog title="Delete?" confirmLabel="Delete" busy onConfirm={onConfirm} onClose={onClose} />);
    expect((host.querySelectorAll('.gp-modal-foot button')[1] as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('stacked tables on phones', () => {
  it('labels every cell with its column header and opts the table in', () => {
    const t = document.createElement('table');
    t.innerHTML = '<thead><tr><th>Date</th><th>Amount</th><th></th></tr></thead><tbody><tr><td>1</td><td>2</td><td>x</td></tr><tr><td colspan="2">wide</td><td>y</td></tr></tbody>';
    labelTable(t);
    expect(t.getAttribute('data-stack')).toBe('true');
    const cells = Array.from(t.querySelectorAll('tbody td')).map((c) => c.getAttribute('data-label'));
    expect(cells).toEqual(['Date', 'Amount', '', 'Date', '']);
  });

  it('leaves a table alone when it opts out or has no header text', () => {
    const a = document.createElement('table');
    a.setAttribute('data-stack', 'false');
    a.innerHTML = '<thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody>';
    labelTable(a);
    expect(a.getAttribute('data-stack')).toBe('false');
    const b = document.createElement('table');
    b.innerHTML = '<tbody><tr><td></td></tr></tbody>';
    labelTable(b);
    expect(b.hasAttribute('data-stack')).toBe(false);
    const c = document.createElement('table');
    c.innerHTML = '<tbody><tr><td>Mia</td><td>5</td></tr></tbody>';
    labelTable(c);
    expect(c.hasAttribute('data-stack')).toBe(false);
  });
});
