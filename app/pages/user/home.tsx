'use client';

/**
 * Dashboard for the consumer `User` role.
 *
 * Dedicated User section (/user/user/*) — NOT the client dashboard. A User
 * consumes rather than runs a business, so this surfaces what they've bought
 * and watched, each wired to the customer-scoped endpoints:
 *   Snapshot · Recent watches (/customer/streams) · Photos purchased +
 *   Archives (/customer/albums) · Recent payments (/customer/payments/pending,
 *   paid in-page via PayNowModal) · Settings · Help.
 *
 * Renders inside the salo-run shell (Sidebar + Topbar) so it inherits the
 * dashboard chrome/layout. Brand tokens: navy #083A85, pink #F20C8F.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { getLandingUrl } from '@/lib/urls';
import PayNowModal, { Payment } from '../../components/UnlockModal';

const NAVY = '#083A85';
const PINK = '#F20C8F';

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);

type Album = { id: string; title: string; thumbnail?: string; photographer?: string; photoCount: number; date?: string; locked: boolean; archived: boolean };
type Stream = { id: string; eventId?: string; title: string; photographer?: string; coverImage?: string; date?: string; duration?: string };
type Pending = { id: string; eventName: string; photographerName?: string; amount: number; paidAmount: number };
type Ev = { id: string; title: string; eventDate?: string; status: string; photographer?: string };
type Don = { id: string; amount: number; currency?: string; message?: string; date?: string };

function money(n: number): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

export default function UserHome(): React.JSX.Element {
  const { user } = useDashboardAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'there';

  const [loading, setLoading] = useState(true);
  const [spent, setSpent] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [donations, setDonations] = useState<Don[]>([]);

  // In-page pay modal
  const [payTarget, setPayTarget] = useState<Payment | null>(null);

  const load = async () => {
    const api = getApiUrl();
    const [aRes, alRes, stRes, peRes, evRes, doRes] = await Promise.allSettled([
      dashboardAuthFetch(`${api}/api/remote/customer/analytics`),
      dashboardAuthFetch(`${api}/api/remote/customer/albums`),
      dashboardAuthFetch(`${api}/api/remote/customer/streams`),
      dashboardAuthFetch(`${api}/api/remote/customer/payments/pending`),
      dashboardAuthFetch(`${api}/api/remote/customer/events`),
      dashboardAuthFetch(`${api}/api/remote/donations?page=0&size=20`),
    ]);

    if (aRes.status === 'fulfilled' && aRes.value.ok) {
      const j = await aRes.value.json();
      const d = (j?.data ?? {}) as Raw;
      setSpent(num(d.totalSpent) ?? 0);
      setPhotosCount(num(d.totalPhotos) ?? 0);
    }
    if (alRes.status === 'fulfilled' && alRes.value.ok) {
      const j = await alRes.value.json();
      const rows = Array.isArray(j?.data) ? (j.data as Raw[]) : [];
      setAlbums(
        rows.map((r) => ({
          id: String(r.id ?? ''),
          title: str(r.title) ?? 'Album',
          thumbnail: normalizeImageUrl(str(r.thumbnail) ?? str(r.coverImage) ?? undefined),
          photographer: str(r.photographer),
          photoCount: num(r.photoCount) ?? 0,
          date: str(r.receivedDate) ?? str(r.date),
          locked: r.isLocked === true,
          archived: r.isArchived === true,
        })).filter((a) => a.id),
      );
    }
    if (stRes.status === 'fulfilled' && stRes.value.ok) {
      const j = await stRes.value.json();
      const rows = Array.isArray(j?.data) ? (j.data as Raw[]) : [];
      setStreams(
        rows.map((r) => ({
          id: String(r.id ?? ''),
          eventId: str(r.eventId),
          title: str(r.streamTitle) ?? str(r.eventTitle) ?? 'Live stream',
          photographer: str(r.photographerName),
          coverImage: normalizeImageUrl(str(r.coverImage) ?? undefined),
          date: str(r.streamDate),
          duration: str(r.duration),
        })).filter((s) => s.id),
      );
    }
    if (peRes.status === 'fulfilled' && peRes.value.ok) {
      const j = await peRes.value.json();
      const rows = Array.isArray(j?.data) ? (j.data as Raw[]) : [];
      setPending(
        rows.map((r) => ({
          id: String(r.id ?? ''),
          eventName: str(r.eventTitle) ?? str(r.eventName) ?? 'Event',
          photographerName: str(r.photographerName),
          amount: num(r.amountInUsd) ?? num(r.amount) ?? 0,
          paidAmount: num(r.paidAmountInUsd) ?? num(r.paidAmount) ?? 0,
        })).filter((p) => p.id),
      );
    }
    if (evRes.status === 'fulfilled' && evRes.value.ok) {
      const j = await evRes.value.json();
      const rows = Array.isArray(j?.data) ? (j.data as Raw[]) : Array.isArray((j?.data as Raw)?.content) ? ((j.data as Raw).content as Raw[]) : [];
      setEvents(
        rows.map((r) => ({
          id: String(r.id ?? ''),
          title: str(r.title) ?? str(r.eventTitle) ?? 'Event',
          eventDate: str(r.eventDate),
          status: (str(r.eventStatus) ?? str(r.status) ?? '').toUpperCase(),
          photographer: str(r.photographerName),
        })).filter((e) => e.id),
      );
    }
    if (doRes.status === 'fulfilled' && doRes.value.ok) {
      const j = await doRes.value.json();
      const rows = Array.isArray(j?.data) ? (j.data as Raw[]) : Array.isArray((j?.data as Raw)?.content) ? ((j.data as Raw).content as Raw[]) : [];
      setDonations(
        rows.map((r) => ({
          id: String(r.id ?? ''),
          amount: num(r.amount) ?? 0,
          currency: str(r.currencyCode) ?? str(r.currency),
          message: str(r.message),
          date: str(r.createdAt) ?? str(r.date),
        })).filter((d) => d.id),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchasedPhotos = useMemo(() => albums.filter((a) => !a.archived), [albums]);
  const archived = useMemo(() => albums.filter((a) => a.archived), [albums]);
  const totalPending = pending.reduce((s, p) => s + (p.amount - p.paidAmount), 0);

  const today = new Date().toISOString().slice(0, 10);
  const liveEvents = useMemo(() => events.filter((e) => e.status === 'ONGOING'), [events]);
  const upcomingEvents = useMemo(
    () => events.filter((e) => !['ONGOING', 'COMPLETED', 'CANCELLED'].includes(e.status) && (!e.eventDate || e.eventDate >= today)),
    [events, today],
  );

  const stats = [
    { label: 'Spent', value: money(spent), icon: 'bi-wallet2' },
    { label: 'Streams', value: String(streams.length), icon: 'bi-camera-video' },
    { label: 'Photos', value: String(photosCount || purchasedPhotos.reduce((s, p) => s + p.photoCount, 0)), icon: 'bi-images' },
  ];

  const actions = [
    { label: 'Book a photographer', sub: 'Find & hire talent', icon: 'bi-camera', href: '/user/user/photographers', color: NAVY },
    { label: 'Live streams', sub: 'Watch & buy access', icon: 'bi-broadcast', href: '/user/user/streams', color: PINK },
    { label: 'My photos', sub: 'Purchased galleries', icon: 'bi-images', href: '/user/user/gallery', color: '#0EA5E9' },
    { label: 'Payments', sub: 'Pay & track', icon: 'bi-credit-card', href: '/user/user/payments', color: '#10B981' },
  ];

  const openPay = (p: Pending, idx: number) => {
    setPayTarget({
      id: idx + 1,
      declarationId: p.id,
      date: '',
      eventName: p.eventName,
      eventType: '',
      photographerName: p.photographerName || 'Booking',
      photographerImage: '',
      method: '',
      amount: money(p.amount - p.paidAmount),
      amountNum: Math.max(0, p.amount - p.paidAmount),
      paidAmount: p.paidAmount,
      status: 'pending',
      invoiceNumber: '',
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="client" />

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="bg-gray-50">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6">
            {/* Hero */}
            <header
              className="rounded-3xl px-6 sm:px-8 py-7 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a4da3 55%, ${PINK} 165%)` }}
            >
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70">Welcome back</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold leading-tight">{name}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80">Your photos, streams, and payments — all in one place.</p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 border border-white/15">
                    <div className="flex items-center gap-2 text-white/70">
                      <i className={`bi ${s.icon} text-sm`} />
                      <span className="text-[11px] font-semibold">{s.label}</span>
                    </div>
                    <div className="mt-1 text-lg sm:text-xl font-extrabold">{loading ? '—' : s.value}</div>
                  </div>
                ))}
              </div>
            </header>

            {/* Quick actions */}
            <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {actions.map((a) => (
                <Link key={a.label} href={a.href} className="group rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: a.color }}>
                    <i className={`bi ${a.icon} text-lg`} />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-gray-900">{a.label}</h3>
                  <p className="text-xs text-gray-500">{a.sub}</p>
                </Link>
              ))}
            </section>

            {/* Live now — join a stream currently broadcasting */}
            {!loading && liveEvents.length > 0 ? (
              <>
                <SectionHead title="Live now" />
                <div className="space-y-2">
                  {liveEvents.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-gray-900">{e.title}</h4>
                        <p className="truncate text-xs text-red-500 font-semibold">{[e.photographer, 'Live now'].filter(Boolean).join(' · ')}</p>
                      </div>
                      <a
                        href={`${getLandingUrl()}/user/events/view-event?id=${e.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white"
                      >
                        <i className="bi bi-play-fill" /> Join
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* Upcoming events */}
            <SectionHead title="Upcoming events" actionLabel={upcomingEvents.length > 0 ? 'My bookings' : undefined} href="/user/user/events" />
            {loading ? (
              <div className="h-16 rounded-2xl bg-white border border-gray-200 animate-pulse" />
            ) : upcomingEvents.length === 0 ? (
              <Empty icon="bi-calendar-event" text="No upcoming events — book a photographer or buy stream access." />
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map((e) => (
                  <a
                    key={e.id}
                    href={`${getLandingUrl()}/user/events/view-event?id=${e.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3 shadow-sm transition hover:shadow-md"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#083A85]"><i className="bi bi-calendar-event" /></span>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-gray-900">{e.title}</h4>
                      <p className="truncate text-xs text-gray-500">{[e.photographer, e.eventDate].filter(Boolean).join(' · ') || 'Upcoming'}</p>
                    </div>
                    <i className="bi bi-chevron-right text-gray-400" />
                  </a>
                ))}
              </div>
            )}

            {/* Recent watches */}
            <SectionHead title="Recent watches" actionLabel={streams.length > 0 ? 'All streams' : undefined} href="/user/user/streams" />
            {loading ? <RailSkeleton /> : streams.length === 0 ? (
              <Empty icon="bi-camera-video" text="No streams yet — buy access to watch live events." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {streams.slice(0, 8).map((s) => (
                  <Link key={s.id} href="/user/user/streams" className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-md">
                    <div className="relative aspect-video bg-gray-100">
                      {s.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.coverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300"><i className="bi bi-play-circle text-3xl" /></div>
                      )}
                      {s.duration && s.duration !== '0:00:00' ? (
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">{s.duration}</span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <h4 className="truncate text-sm font-bold text-gray-900">{s.title}</h4>
                      <p className="truncate text-xs text-gray-500">{[s.photographer, s.date].filter(Boolean).join(' · ') || 'Watched'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Photos purchased */}
            <SectionHead title="Photos purchased" actionLabel={purchasedPhotos.length > 0 ? 'Gallery' : undefined} href="/user/user/gallery" />
            {loading ? <RailSkeleton /> : purchasedPhotos.length === 0 ? (
              <Empty icon="bi-images" text="No purchased photos yet — find yours from any event." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {purchasedPhotos.slice(0, 8).map((p) => (
                  <Link key={p.id} href="/user/user/gallery" className="group rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm transition hover:shadow-md">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300"><i className="bi bi-images text-3xl" /></div>
                      )}
                      {p.locked ? (
                        <span className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#083A85]/85 text-white"><i className="bi bi-lock-fill text-[10px]" /></span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <h4 className="truncate text-sm font-bold text-gray-900">{p.title}</h4>
                      <p className="truncate text-xs text-gray-500">{p.photoCount > 0 ? `${p.photoCount} photo${p.photoCount === 1 ? '' : 's'}` : p.photographer || 'Album'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Archives */}
            {!loading && archived.length > 0 ? (
              <>
                <SectionHead title="Archives" actionLabel="Gallery" href="/user/user/gallery" />
                <div className="space-y-2">
                  {archived.slice(0, 5).map((p) => (
                    <Link key={p.id} href="/user/user/gallery" className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3 shadow-sm transition hover:shadow-md">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#083A85]"><i className="bi bi-archive" /></span>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-gray-900">{p.title}</h4>
                        <p className="truncate text-xs text-gray-500">{[p.photoCount > 0 ? `${p.photoCount} photos` : null, p.date].filter(Boolean).join(' · ') || 'Archived'}</p>
                      </div>
                      <i className="bi bi-chevron-right text-gray-400" />
                    </Link>
                  ))}
                </div>
              </>
            ) : null}

            {/* Recent payments */}
            <SectionHead title="Recent payments" />
            {loading ? (
              <div className="h-20 rounded-2xl bg-white border border-gray-200 animate-pulse" />
            ) : pending.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <i className="bi bi-check-circle text-emerald-600 text-lg" />
                <p className="text-sm text-gray-700">You&apos;re all settled up — no payments due.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-2xl px-5 py-4 text-white" style={{ backgroundColor: NAVY }}>
                  <span className="text-sm text-white/80">Total due</span>
                  <span className="text-xl font-extrabold">{money(totalPending)}</span>
                </div>
                {pending.slice(0, 5).map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-gray-900">{p.eventName}</h4>
                      <p className="truncate text-xs text-gray-500">{(p.photographerName || 'Booking')} · {money(p.amount - p.paidAmount)}</p>
                    </div>
                    <button onClick={() => openPay(p, idx)} className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: NAVY }}>Pay</button>
                  </div>
                ))}
              </div>
            )}

            {/* Donations */}
            {!loading && donations.length > 0 ? (
              <>
                <SectionHead title="Your donations" actionLabel="Donate" href="/user/user/donate" />
                <div className="space-y-2">
                  {donations.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-[#F20C8F]"><i className="bi bi-heart-fill" /></span>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-gray-900">{d.amount ? money(d.amount) : 'Donation'}</h4>
                        <p className="truncate text-xs text-gray-500">{d.message || (d.date ? d.date.slice(0, 10) : 'Thank you for giving')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* Settings & Help */}
            <div className="mt-8 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/user/user/preferences" className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:shadow-md">
                <i className="bi bi-gear text-xl text-[#083A85]" />
                <h3 className="mt-2 text-sm font-bold text-gray-900">Settings</h3>
                <p className="text-xs text-gray-500">Profile & preferences</p>
              </Link>
              <a href="https://connekyt.com/user/help-center" target="_blank" rel="noreferrer" className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm transition hover:shadow-md block">
                <i className="bi bi-life-preserver text-xl text-[#083A85]" />
                <h3 className="mt-2 text-sm font-bold text-gray-900">Help</h3>
                <p className="text-xs text-gray-500">Support & FAQs</p>
              </a>
            </div>
          </div>
        </div>
      </div>

      <PayNowModal
        isOpen={!!payTarget}
        onClose={() => setPayTarget(null)}
        payment={payTarget}
        onPaymentSuccess={() => {
          setPayTarget(null);
          void load();
        }}
      />
    </div>
  );
}

function SectionHead({ title, actionLabel, href }: { title: string; actionLabel?: string; href?: string }): React.JSX.Element {
  return (
    <div className="mt-8 mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
      {actionLabel && href ? <Link href={href} className="text-sm font-bold" style={{ color: NAVY }}>{actionLabel}</Link> : null}
    </div>
  );
}

function RailSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="aspect-video bg-gray-100 animate-pulse" />
          <div className="p-3 space-y-2"><div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" /><div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" /></div>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-dashed border-gray-300 p-6 text-gray-500">
      <i className={`bi ${icon} text-xl`} />
      <p className="text-sm">{text}</p>
    </div>
  );
}
