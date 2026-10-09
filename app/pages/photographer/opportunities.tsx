"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import PhotographerOpportunitiesView from '../../components/hybrid/PhotographerOpportunitiesView';
import { MODE_META } from '../../components/hybrid/hybridUi';

/** Post My Event opportunities, as a first-class page with its own sidebar entry. */
export default function PhotographerOpportunitiesPage() {
  const { colors } = useTheme();
  const params = useSearchParams();
  const focus = params?.get('candidate');

  return (
    <div style={{ display: 'flex', height: '100vh', background: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar userRole="photographer" />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem clamp(1rem, 3vw, 2rem)' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <header style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: MODE_META.HYBRID.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                <i className="bi bi-broadcast" aria-hidden /> Post My Event
              </div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: colors.textPrimary }}>Opportunities</h1>
              <p style={{ margin: '6px 0 0', color: colors.textTertiary, fontSize: '0.92rem' }}>
                Events near you that fit your calendar. Answer quickly: each one has a short response window.
              </p>
            </header>
            <PhotographerOpportunitiesView focusCandidateId={focus} />
          </div>
        </main>
      </div>
    </div>
  );
}
