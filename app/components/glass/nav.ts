/**
 * Navigation for the Compact Glass shell. Same destinations, permissions and workspace rules as the old sidebar
 * (components/sidebar.tsx); only the grouping is new. Every old route stays reachable.
 *
 * Photographer, as agreed for the redesign:
 *   Overview  Home, Notifications, Inbox
 *   Work      Events, Opportunities, Clients, Packages, Sell photos, Collaborate
 *   Money     Wallet (Transactions, All transactions and Payroll report open from it and stay at their routes)
 *   Bottom    Donate, Profile, Preferences, Log out
 */
import type { LucideIcon } from 'lucide-react';
import {
  Bookmark, BookOpen, Bell, Briefcase, CalendarDays, CreditCard, Handshake, Heart, House, Image as ImageIcon, MessageCircle, Package,
  Radio, Search, ShoppingBag, SlidersHorizontal, Tag, User, Users, Wallet, Clapperboard,
} from 'lucide-react';
import { SELL_PHOTOS_QUERY } from '@/lib/albums/sellPhotos';

export type GlassRole = 'photographer' | 'client' | 'event-coordinator';

export interface GlassNavItem {
  /** Stable key; also the name the old sidebar's workspace rules use. */
  key: string;
  /** i18n key (LanguageContext t()). */
  label: string;
  href: string;
  icon: LucideIcon;
  requires?: string[];
  /** Other routes that light this item up (Wallet covers the transaction pages). */
  alsoActive?: string[];
  badge?: 'notifications' | 'messages' | 'opportunities';
}

export interface GlassNavGroup { label: string; items: GlassNavItem[] }

const P = '/user/photographer';

const photographer: GlassNavGroup[] = [
  { label: 'Overview', items: [
    { key: 'Home', label: 'Home', href: `${P}/dashboard`, icon: House },
    { key: 'Notifications', label: 'Notifications', href: `${P}/notifications`, icon: Bell, badge: 'notifications' },
    { key: 'Inbox', label: 'Inbox', href: `${P}/inbox`, icon: MessageCircle, requires: ['messages.view'], badge: 'messages' },
  ] },
  { label: 'Work', items: [
    { key: 'Events', label: 'Events', href: `${P}/events`, icon: CalendarDays, requires: ['events.view'], alsoActive: [`${P}/host`] },
    { key: 'Photobooks', label: 'Photobooks', href: `${P}/photobooks`, icon: BookOpen, requires: ['events.view'] },
    { key: 'Opportunities', label: 'Opportunities', href: `${P}/opportunities`, icon: Radio, requires: ['events.view'], badge: 'opportunities' },
    { key: 'Clients', label: 'Clients', href: `${P}/clients`, icon: Users, requires: ['bookings.view'] },
    { key: 'Packages', label: 'Packages', href: `${P}/profile?tab=packages`, icon: Package },
    { key: 'Sell photos', label: 'Sell photos', href: `${P}/events?${SELL_PHOTOS_QUERY}`, icon: Tag, requires: ['events.view'] },
    { key: 'Collaborate', label: 'Collaborate', href: `${P}/collaborate`, icon: Handshake },
  ] },
  { label: 'Explore', items: [
    { key: 'Saved', label: 'Saved', href: `${P}/explore/saved`, icon: Bookmark },
    { key: 'My purchases', label: 'My purchases', href: `${P}/explore/purchases`, icon: ShoppingBag },
  ] },
  { label: 'Money', items: [
    { key: 'Wallet', label: 'Wallet', href: `${P}/wallet`, icon: Wallet, requires: ['payments.view'],
      alsoActive: [`${P}/transaction`, `${P}/all-transactions`, `${P}/payroll-report`] },
  ] },
];

const buyer = (base: string): GlassNavGroup[] => [
  { label: 'Overview', items: [
    { key: 'Home', label: 'Home', href: `${base}/home`, icon: House },
    { key: 'Notifications', label: 'Notifications', href: `${base}/notifications`, icon: Bell, badge: 'notifications' },
    { key: 'Inbox', label: 'Inbox', href: `${base}/inbox`, icon: MessageCircle, requires: ['messages.view'], badge: 'messages' },
  ] },
  { label: 'Work', items: [
    { key: 'My Events', label: 'My Events', href: `${base}/events`, icon: CalendarDays, requires: ['events.view'] },
    { key: 'Streams', label: 'Streams', href: `${base}/streams`, icon: Clapperboard },
    { key: 'Gallery', label: 'Gallery', href: `${base}/gallery`, icon: ImageIcon },
    { key: 'Photobooks', label: 'Photobooks', href: `${base}/photobooks`, icon: BookOpen, alsoActive: [`${base}/gallery/photobooks`] },
  ] },
  { label: 'Book a photographer', items: [
    { key: 'Post My Event', label: 'Post My Event', href: `${base}/events?post=1`, icon: Briefcase, requires: ['events.view'] },
    { key: 'Find a Photographer', label: 'Find a Photographer', href: `${base}/photographers`, icon: Search, requires: ['bookings.view'] },
  ] },
  { label: 'Explore', items: [
    { key: 'Saved', label: 'Saved', href: `${base}/explore/saved`, icon: Bookmark },
    { key: 'My purchases', label: 'My purchases', href: `${base}/explore/purchases`, icon: ShoppingBag },
  ] },
  { label: 'Money', items: [
    { key: 'Payments', label: 'Payments', href: `${base}/payments`, icon: CreditCard, requires: ['payments.view'] },
    { key: 'Wallet', label: 'Wallet', href: `${base}/wallet`, icon: Wallet, requires: ['payments.view'],
      alsoActive: [`${base}/transactions`] },
  ] },
];

export const NAV: Record<GlassRole, GlassNavGroup[]> = {
  photographer,
  client: buyer('/user/client'),
  'event-coordinator': buyer('/user/event-coordinator'),
};

export function bottomNav(role: GlassRole): GlassNavItem[] {
  const base = role === 'photographer' ? P : `/user/${role}`;
  return [
    { key: 'Donate', label: 'Donate', href: `${base}/donate`, icon: Heart },
    { key: 'Profile', label: 'Profile', href: `${base}/profile`, icon: User },
    { key: 'Preferences', label: 'Preferences', href: `${base}/preferences`, icon: SlidersHorizontal, requires: ['settings.manage'] },
  ];
}

/** The mobile tab bar: Home, Events, Jobs, Inbox, Wallet, as in the app. Everything else lives in the drawer. */
export function tabNav(role: GlassRole): GlassNavItem[] {
  const all = [...NAV[role].flatMap((g) => g.items)];
  const pick = (k: string) => all.find((i) => i.key === k);
  const keys = role === 'photographer'
    ? ['Home', 'Events', 'Opportunities', 'Inbox', 'Wallet']
    : ['Home', 'My Events', 'Find a Photographer', 'Inbox', 'Wallet'];
  return keys.map(pick).filter((i): i is GlassNavItem => !!i)
    .map((i) => (i.key === 'Opportunities' ? { ...i, label: 'Jobs' } : i.key === 'My Events' ? { ...i, label: 'Events' } : i));
}

/** Whether a nav item is the current page. A link with a query is current only when its query is present too. */
export function isActive(item: GlassNavItem, pathname: string, search: string): boolean {
  const [path, query] = item.href.split('?');
  if (item.alsoActive?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (query) return pathname === path && new URLSearchParams(search).toString().includes(query);
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  return true;
}

export function roleFromPath(pathname: string): GlassRole {
  if (pathname.startsWith('/user/client')) return 'client';
  if (pathname.startsWith('/user/event-coordinator')) return 'event-coordinator';
  return 'photographer';
}

/** A tab row for a group of related pages. The pages keep their own routes; the tabs are links between them. */
export interface SubTab { label: string; href: string; /** The sidebar item whose visibility rules also hide this tab. */ key?: string }

/**
 * Wallet and its money pages. Old routes keep working: each tab is just the page's own route, so a bookmark or a
 * notification link to /transaction, /all-transactions or /payroll-report still opens that page, now with the tabs.
 */
export function subTabsFor(role: GlassRole, pathname: string): SubTab[] | null {
  const base = role === 'photographer' ? '/user/photographer' : `/user/${role}`;
  const groups: SubTab[][] = role === 'photographer'
    ? [[
        { label: 'Wallet', href: `${base}/wallet` },
        { label: 'Transactions', href: `${base}/transaction`, key: 'Transactions' },
        { label: 'All transactions', href: `${base}/all-transactions`, key: 'Transactions' },
        { label: 'Payroll report', href: `${base}/payroll-report`, key: 'Transactions' },
      ]]
    : [[
        { label: 'Wallet', href: `${base}/wallet` },
        { label: 'Payments', href: `${base}/payments` },
        ...(role === 'client' ? [{ label: 'Transactions', href: `${base}/transactions` }] : []),
      ]];
  for (const g of groups) if (g.some((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))) return g;
  return null;
}
