import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fetchMock = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({
  useDashboardAuth: () => ({ user: { id: 'u1' } }),
  dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a),
}));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'http://api' }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (s: string) => s }) }));
vi.mock('@/app/context/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'RWF',
    formatPrice: (n: number) => `RWF ${Math.round(n * 1400).toLocaleString('en-US')}`,
    formatPriceIso: (n: number) => `RWF ${Math.round(n).toLocaleString('en-US')}`,
    priceParts: (n: number) => ({ prefix: 'RWF', text: Math.round(n).toLocaleString('en-US'), tight: false }),
  }),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => <a href={href} {...r}>{children}</a> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/lib/publicProfileLink', () => ({ fetchPublicProfileUrl: () => Promise.resolve('https://connekyt.com/p/x') }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));

import type { ReferralRow, ReferralStats } from '@/app/lib/referral';
import { tiers } from '@/app/lib/referral';
import { GrowCardView, GrowCardSkeleton } from './GrowCard';
import GrowCard from './GrowCard';
import { HowItCountsBody, HowItCountsSheet } from './HowReferralsCount';
import { MilestonesView } from './MilestonesPage';
import ReferralList from './ReferralList';
import ReferredChecklistCard, { showReferredCard } from './ReferredChecklistCard';
import MilestoneCongrats from './MilestoneCongrats';
import InviteShare from './InviteShare';
import ShareMenu from './ShareMenu';
import SaleSplitDetails, { parseSaleSplit } from './SaleSplitDetails';

function stats(n: number, over: Partial<ReferralStats> = {}): ReferralStats {
  const share = n >= 40 ? 90 : n >= 30 ? 85 : n >= 20 ? 80 : n >= 10 ? 75 : 70;
  const next = n >= 40 ? null : n >= 30 ? 40 : n >= 20 ? 30 : n >= 10 ? 20 : 10;
  const nextShare = next == null ? null : share + 5;
  return {
    code: n >= 40 ? null : 'JM7K4Q2X', link: n >= 40 ? null : 'https://connekyt.com/join?ref=JM7K4Q2X',
    qualifying: n, cap: 40, sharePercent: share, nextMilestone: next, nextSharePercent: nextShare, maxRate: n >= 40, complete: n >= 40,
    pending: 2, underReview: 1, minQualifyingUsd: 5, referrals: [], hasReferrer: false, referrerName: null, myReferral: null, unlocked: null, ...over,
  };
}

const row = (over: Partial<ReferralRow>): ReferralRow => ({
  name: 'Jane D.', status: 'pending', date: '2026-11-01', signedUp: true, verifiedPublished: false, firstSale: false, hint: 'waiting_verified_published', ...over,
});

let root: Root;
let host: HTMLDivElement;
const text = () => host.textContent || '';
const q = (id: string) => host.querySelector(`[data-testid="${id}"]`);
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const render = (el: React.ReactElement) => { act(() => root.render(el)); };

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ action: 1, data: null }) });
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.removeAttribute('data-theme'); });

const THEMES = ['light', 'dark'] as const;
const WIDTHS = [360, 390] as const;

describe('Grow your store card', () => {
  for (const theme of THEMES) for (const width of WIDTHS) {
    describe(`${theme} at ${width}px`, () => {
      beforeEach(() => { document.documentElement.dataset.theme = theme; host.style.width = `${width}px`; });

      it('at 0 referrals shows 70%, 0 of 10 and what unlocks 75%', () => {
        render(<GrowCardView stats={stats(0)} onInvite={() => {}} onHow={() => {}} />);
        expect(q('grow-rate')?.textContent).toBe('70%');
        expect(q('grow-progress')?.textContent).toBe('0 of 10 referrals');
        expect(q('grow-more')?.textContent).toBe('10 more to unlock 75%');
        expect(q('grow-invite')).not.toBeNull();
        expect(text()).toContain('Grow your store');
        expect(text()).toContain('Earn up to 90% on every photo you sell');
      });

      it('at 11 referrals shows 75%, 11 of 20 and 9 more to unlock 80%', () => {
        render(<GrowCardView stats={stats(11)} onInvite={() => {}} onHow={() => {}} />);
        expect(q('grow-rate')?.textContent).toBe('75%');
        expect(q('grow-progress')?.textContent).toBe('11 of 20 referrals');
        expect(q('grow-more')?.textContent).toBe('9 more to unlock 80%');
        expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('10');
      });

      it('at 39 referrals is one away from the maximum', () => {
        render(<GrowCardView stats={stats(39)} onInvite={() => {}} onHow={() => {}} />);
        expect(q('grow-rate')?.textContent).toBe('85%');
        expect(q('grow-progress')?.textContent).toBe('39 of 40 referrals');
        expect(q('grow-more')?.textContent).toBe('1 more to unlock 90%');
      });

      it('at 40 shows the maximum state, View sale earnings and no invite', () => {
        render(<GrowCardView stats={stats(40)} onInvite={() => {}} onHow={() => {}} />);
        expect(q('grow-max')?.textContent).toBe('90% unlocked · Maximum rate active');
        expect(q('grow-view-earnings')?.textContent).toBe('View sale earnings');
        expect(q('grow-invite')).toBeNull();
        expect(q('grow-how')).toBeNull();
      });
    });
  }

  it('opens the 3 step explainer from the How referrals count link', async () => {
    render(<GrowCard state={{ status: 'ready', data: stats(11) }} onRetry={() => {}} />);
    expect(q('how-it-counts')).toBeNull();
    act(() => { (q('grow-how') as HTMLButtonElement).click(); });
    await settle();
    const body = q('how-it-counts');
    expect(body).not.toBeNull();
    expect(body?.querySelectorAll('li').length).toBe(3);
    expect(body?.textContent).toContain('Your friend signs up with your link or code.');
    expect(body?.textContent).toContain('at least RWF 7,000');
    expect(body?.textContent).toContain('Referrals that look suspicious are reviewed first.');
  });

  it('shows a loading skeleton and a retryable error', () => {
    render(<GrowCardSkeleton />);
    expect(q('grow-loading')?.getAttribute('aria-busy')).toBe('true');
    const retry = vi.fn();
    render(<GrowCard state={{ status: 'error' }} onRetry={retry} />);
    expect(q('grow-error')).not.toBeNull();
    act(() => { host.querySelector('button')?.click(); });
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('has the Milestones link and the wide layout hook', () => {
    render(<GrowCardView stats={stats(11)} onInvite={() => {}} onHow={() => {}} />);
    expect(q('grow-milestones')?.getAttribute('href')).toBe('/user/photographer/milestones');
    expect(host.querySelector('.gr-card.gr-wide-ok')).not.toBeNull();
  });
});

describe('Milestones screen', () => {
  const store = { earnings: 120000, available: 45000, photosSold: null, topAlbum: null };
  for (const theme of THEMES) for (const width of WIDTHS) {
    for (const n of [0, 11, 39, 40]) {
      it(`renders at ${n} referrals, ${theme}, ${width}px`, () => {
        document.documentElement.dataset.theme = theme;
        host.style.width = `${width}px`;
        render(<MilestonesView stats={stats(n, { referrals: [row({})] })} store={store} />);
        expect(q('milestones-page')).not.toBeNull();
        expect(q('ms-rate')?.textContent).toContain(`${stats(n).sharePercent}%`);
        expect(host.querySelectorAll('[data-testid="tier-row"]').length).toBe(5);
        expect(q('how-it-counts')).not.toBeNull();
        expect(q('store-stats')).not.toBeNull();
        if (n >= 40) {
          expect(q('ms-max')?.textContent).toBe('90% unlocked · Maximum rate active');
          expect(q('invite-share')).toBeNull();
        } else {
          expect(q('invite-share')).not.toBeNull();
          expect(q('referral-code')?.textContent).toBe('JM7K4Q2X');
        }
      });
    }
  }

  it('shows the money example in the viewer currency and the tier states', () => {
    render(<MilestonesView stats={stats(11)} store={store} />);
    expect(q('ms-progress')?.textContent).toBe('11 of 20 qualified referrals');
    expect(q('ms-more')?.textContent).toBe('9 more referrals unlock 80%');
    expect(q('ms-example')?.textContent).toBe("That's RWF 500 more on a RWF 10,000 sale.");
    const states = [...host.querySelectorAll('[data-testid="tier-row"]')].map((e) => e.getAttribute('data-state'));
    expect(states).toEqual(tiers(11).map((t) => t.state));
    expect(states).toEqual(['done', 'current', 'locked', 'locked', 'max']);
    expect(q('ms-counts')?.textContent).toContain('2 pending');
    expect(q('ms-counts')?.textContent).toContain('1 under review');
    expect(q('ms-counts')?.textContent).toContain('Program rules');
    expect(q('share-line')?.textContent).toBe('A referral counts after your friend is verified, publishes a photo and makes their first sale.');
  });

  it('shows the empty state when nobody was referred yet', () => {
    render(<MilestonesView stats={stats(0)} store={store} />);
    expect(q('referral-empty')?.textContent).toContain('No referrals yet');
  });

  it('shows only the tiles the backend can fill in the store strip', () => {
    render(<MilestonesView stats={stats(0)} store={store} />);
    const t = q('store-stats')?.textContent || '';
    expect(t).toContain("This month's earnings");
    expect(t).toContain('Available payout');
    expect(t).not.toContain('Photos sold');
    expect(t).not.toContain('Top-selling album');
  });
});

describe('referral list', () => {
  it('shows three checks, a status and a hint for each status', () => {
    render(<ReferralList rows={[
      row({ status: 'pending', hint: 'waiting_verified_published' }),
      row({ name: 'Ben R.', status: 'pending', verifiedPublished: true, hint: 'waiting_first_sale' }),
      row({ name: 'Amy K.', status: 'qualified', verifiedPublished: true, firstSale: true, hint: 'qualified' }),
      row({ name: 'Zed Q.', status: 'under_review', hint: 'under_review' }),
      row({ name: 'Old O.', status: 'revoked', hint: 'revoked' }),
    ]} />);
    const rows = [...host.querySelectorAll('[data-testid="referral-row"]')];
    expect(rows.map((r) => r.querySelector('[data-testid="referral-status"]')?.textContent)).toEqual(['Pending', 'Pending', 'Qualified', 'Under review', 'Revoked']);
    expect(rows.map((r) => r.querySelector('[data-testid="referral-hint"]')?.textContent)).toEqual([
      'Waiting for verification and their first published photo', 'Waiting for their first sale', 'Counted toward your milestones',
      "We're checking this referral (usually within 48 h)", "This referral didn't qualify",
    ]);
    const on = (r: Element) => [...r.querySelectorAll('[data-testid="ref-check"]')].map((c) => c.getAttribute('data-on'));
    expect(on(rows[0])).toEqual(['true', 'false', 'false']);
    expect(on(rows[1])).toEqual(['true', 'true', 'false']);
    expect(on(rows[2])).toEqual(['true', 'true', 'true']);
    // under review and revoked show only the neutral line, no checks that could hint at the signal
    expect(on(rows[3])).toEqual([]);
    expect(on(rows[4])).toEqual([]);
    expect(rows[2].textContent).toContain('Signed up');
    expect(rows[2].textContent).toContain('Verified & published');
    expect(rows[2].textContent).toContain('First sale');
  });
});

describe('referred photographer checklist', () => {
  it('shows the referrer name only and the three steps while the referral is open', () => {
    render(<ReferredChecklistCard mine={{ referrerName: 'Jane D.', status: 'pending', verifiedPublished: true, firstSale: false }} />);
    expect(q('referred-card')?.textContent).toContain('Help Jane D. unlock rewards');
    expect(q('referred-card')?.textContent).toContain('Verify your account · publish your first photo · make your first sale');
    expect([...host.querySelectorAll('[data-testid="referred-step"]')].map((e) => e.getAttribute('data-on'))).toEqual(['true', 'false']);
  });
  it('disappears when the referral qualifies, is revoked or there is none', () => {
    expect(showReferredCard({ referrerName: 'Jane D.', status: 'qualified', verifiedPublished: true, firstSale: true })).toBe(false);
    expect(showReferredCard({ referrerName: 'Jane D.', status: 'revoked', verifiedPublished: false, firstSale: false })).toBe(false);
    expect(showReferredCard(null)).toBe(false);
    render(<ReferredChecklistCard mine={{ referrerName: 'Jane D.', status: 'qualified', verifiedPublished: true, firstSale: true }} />);
    expect(q('referred-card')).toBeNull();
  });
});

describe('How referrals count explainer', () => {
  it('has the three numbered steps and the footer', () => {
    render(<HowItCountsBody minUsd={5} />);
    expect(host.querySelectorAll('li').length).toBe(3);
    expect(text()).toContain('Their account is verified and they publish their first photo for sale.');
  });
  it('renders as a sheet when open and nothing when closed', () => {
    render(<HowItCountsSheet open={false} onClose={() => {}} />);
    expect(q('how-it-counts')).toBeNull();
    render(<HowItCountsSheet open onClose={() => {}} />);
    expect(q('how-it-counts')).not.toBeNull();
  });
});

describe('invite share block', () => {
  it('has the one line rule, the code with Copy, WhatsApp, More apps and Save QR', () => {
    render(<InviteShare code="JM7K4Q2X" link="https://connekyt.com/join?ref=JM7K4Q2X" />);
    expect(text()).toContain('A referral counts after your friend is verified, publishes a photo and makes their first sale.');
    for (const label of ['Copy', 'WhatsApp', 'More apps', 'Save QR']) expect(text()).toContain(label);
  });
  it('renders nothing when the code is withdrawn at the cap', () => {
    render(<InviteShare code={null} link={null} />);
    expect(q('invite-share')).toBeNull();
  });
});

describe('Share & invite card', () => {
  const ready = (n: number) => ({ status: 'ready' as const, data: stats(n) });
  it('shows Earn 70%, then Unlock 75%, then Your share, and hides the referral parts at 40', () => {
    render(<ShareMenu canCreateAlbum referral={ready(0)} />);
    expect(q('share-invite-badge')?.textContent).toBe('Earn 70%');
    render(<ShareMenu canCreateAlbum referral={ready(4)} />);
    expect(q('share-invite-badge')?.textContent).toBe('Unlock 75%');
    render(<ShareMenu canCreateAlbum referral={ready(11)} />);
    expect(q('share-invite-badge')?.textContent).toBe('Your share: 75%');
    render(<ShareMenu canCreateAlbum referral={ready(40)} />);
    expect(q('share-invite-badge')).toBeNull();
    expect(text()).not.toContain('Referral');
    act(() => { (q('home-share') as HTMLElement).click(); });
    expect(q('share-referral-item')).toBeNull();
  });
  it('keeps the menu item with an 11/20 chip before the cap', () => {
    render(<ShareMenu canCreateAlbum referral={ready(11)} />);
    act(() => { (q('home-share') as HTMLElement).click(); });
    expect(q('share-referral-item')).not.toBeNull();
    expect(q('share-menu-progress')?.textContent).toBe('11/20');
  });
});

describe('milestone congratulations sheet', () => {
  it('shows once at 10 with the new rate and acknowledges it', async () => {
    render(<MilestoneCongrats stats={stats(10, { unlocked: { milestone: 10, sharePercent: 75 } })} />);
    await settle();
    const t = q('milestone-congrats')?.textContent || '';
    expect(t).toContain('Milestone unlocked');
    expect(t).toContain('You now earn 75% on every photo you sell');
    expect(t).toContain('10 qualified referrals. Your new rate applies to every sale from now on. 10 more referrals unlock 80%.');
    expect(t).toContain('Invite more photographers');
    const acks = fetchMock.mock.calls.filter((c) => String(c[0]).endsWith('/referral/milestone/ack'));
    expect(acks.length).toBe(1);
  });
  it('says Maximum rate unlocked at 40 and offers no invite', async () => {
    render(<MilestoneCongrats stats={stats(40, { unlocked: { milestone: 40, sharePercent: 90 } })} />);
    await settle();
    const t = q('milestone-congrats')?.textContent || '';
    expect(t).toContain('Maximum rate unlocked: you earn 90% on every photo you sell');
    expect(t).not.toContain('Invite more photographers');
  });
  it('shows nothing when no milestone is unseen', () => {
    render(<MilestoneCongrats stats={stats(11)} />);
    expect(q('milestone-congrats')).toBeNull();
  });
});

describe('wallet sale details', () => {
  const raw = { sellingPrice: 10000, ratePercent: 75, platformShare: 2500, photographerShare: 7500, confirmedAt: '2026-11-20T14:32:00', currency: 'RWF' };
  it('shows what you earned, the rate and the split from the stored snapshot', () => {
    render(<SaleSplitDetails split={parseSaleSplit(raw)} />);
    expect(q('sale-earned')?.textContent).toBe('RWF 7,500');
    expect(q('sale-line')?.textContent).toBe('75% of a RWF 10,000 photo sale');
    const t = text();
    for (const s of ['Selling price', 'Your rate at sale', 'Platform share', 'Confirmed', 'RWF 2,500', 'Refunds use this same split.']) expect(t).toContain(s);
  });
  it('renders nothing without a snapshot', () => {
    expect(parseSaleSplit(null)).toBeNull();
    expect(parseSaleSplit({ sellingPrice: 1 })).toBeNull();
    render(<SaleSplitDetails split={null} />);
    expect(q('sale-split')).toBeNull();
  });
});
