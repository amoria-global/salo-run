'use client';

import dynamic from 'next/dynamic';
import PhotographerDashboard from '@/app/pages/photographer/dashboard';
import { useUiGlass } from '@/app/lib/useUiGlass';

// Loaded only under the flag, so the old Home's visitors never download it.
const GlassHome = dynamic(() => import('./GlassHome'), {
  ssr: false,
  loading: () => <div className="gh" aria-busy="true"><div className="g-skeleton" style={{ height: 220 }} /></div>,
});

/**
 * The Compact Glass Home under the flag; the old Home, unchanged, otherwise. The prerendered HTML is the old Home; on
 * a ui-glass page CSS hides it (display: contents otherwise, so it adds no box) until the new Home mounts, so the old
 * one never flashes. glass-home.css: html.ui-glass .ck-classic-only { display: none }.
 */
export default function HomeSwitch() {
  const glass = useUiGlass();
  if (glass) return <GlassHome />;
  return <div className="ck-classic-only" style={{ display: 'contents' }}><PhotographerDashboard /></div>;
}
