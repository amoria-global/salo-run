import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ actualTheme: 'light', colors: { bgCard: '#fff', bgSecondary: '#eee', textPrimary: '#000', textSecondary: '#444', borderPrimary: '#ccc', brandAccent: '#F20C8F', statusError: '#E61220' } }),
}));
vi.mock('@/app/context/ThemeContext', () => ({
  useTheme: () => ({ actualTheme: 'light', colors: { bgCard: '#fff', bgSecondary: '#eee', textPrimary: '#000', textSecondary: '#444', borderPrimary: '#ccc', brandAccent: '#F20C8F', statusError: '#E61220' } }),
}));

import { AttendanceField, eventFieldId, focusEventField } from './AttendanceField';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const radios = () => Array.from(host.querySelectorAll<HTMLInputElement>('input[type="radio"]'));

describe('AttendanceField', () => {
  it('has nothing selected on a new event and offers the two choices', () => {
    act(() => root.render(<AttendanceField value={null} onChange={vi.fn()} />));
    expect(host.textContent).toContain('How can guests attend?');
    expect(host.textContent).toContain('In person + live stream');
    expect(host.textContent).toContain('Live stream only');
    expect(radios()).toHaveLength(2);
    expect(radios().filter((r) => r.checked)).toHaveLength(0);
  });

  it('shows a saved mode preselected and reports the choice made', () => {
    const onChange = vi.fn();
    act(() => root.render(<AttendanceField value="STREAM_ONLY" onChange={onChange} />));
    expect(radios().map((r) => r.checked)).toEqual([false, true]);
    act(() => radios()[0].click());
    expect(onChange).toHaveBeenCalledWith('IN_PERSON');
  });

  it('says what is wrong, linked to the group for screen readers', () => {
    act(() => root.render(<AttendanceField value={null} onChange={vi.fn()} error="Choose how guests can attend" />));
    const group = host.querySelector('fieldset')!;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(host.querySelector(`#${group.getAttribute('aria-describedby')}`)?.textContent).toContain('Choose how guests can attend');
  });

  it('focuses the first radio of the blocked field', () => {
    act(() => root.render(<AttendanceField value={null} onChange={vi.fn()} />));
    Element.prototype.scrollIntoView = vi.fn();
    focusEventField('attendance');
    expect(document.activeElement).toBe(radios()[0]);
    expect(host.querySelector(`#${eventFieldId('attendance')}`)).not.toBeNull();
  });
});
