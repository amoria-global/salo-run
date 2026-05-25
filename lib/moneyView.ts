/**
 * moneyView.ts. Role-aware money formatting layer.
 *
 * Pure TypeScript (no React). Every function takes the user's dashboard role
 * and returns data shaped for the UI. Components never decide what to show;
 * they just render what this module returns.
 */

import type {
  WalletDTO,
  WalletMovementDTO,
  WalletCategory,
  WalletDirection,
} from './walletApi';

// ─── Role ────────────────────────────────────────────────────────────────────

export type DashboardRole =
  | 'photographer'
  | 'client'
  | 'event-coordinator'
  | 'admin';

/** Normalise the raw customerType string from the backend to a DashboardRole. */
export function toRole(customerType: string | undefined | null): DashboardRole {
  if (!customerType) return 'client';
  const lower = customerType.toLowerCase().replace(/_/g, '-');
  if (lower === 'photographer' || lower === 'videographer') return 'photographer';
  if (lower === 'event-coordinator') return 'event-coordinator';
  if (lower === 'admin') return 'admin';
  return 'client'; // CLIENT, VIEWER, or anything unexpected
}

// ─── MoneyItem (universal display row) ───────────────────────────────────────

export interface MoneyItem {
  id: string;
  /** Human-friendly title, e.g. "Tip received" */
  title: string;
  /** Optional second line. event name, person, etc. */
  subtitle?: string;
  /** Absolute value in USD (always positive) */
  amount: number;
  /** Original amount + currency when available */
  originalAmount?: number | null;
  originalCurrency?: string | null;
  /** Visual direction indicator */
  direction: 'in' | 'out';
  /** Colour hint. maps to the design-system colour scale */
  color: 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'neutral';
  /** ISO timestamp */
  timestamp: string;
  /** Category tag for the badge / filter pills */
  tag: string;
  /** Raw source for click-through navigation */
  sourceType?: string;
  sourceId?: string | null;
}

// ─── Category metadata ───────────────────────────────────────────────────────

interface CategoryMeta {
  /** Label shown per role [photographer, client/coordinator, admin] */
  label: Record<DashboardRole, string>;
  /** Tag pill text */
  tag: string;
  color: MoneyItem['color'];
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  BALANCE: {
    label: {
      photographer: 'Booking earnings',
      client: 'Booking payment',
      'event-coordinator': 'Event payment',
      admin: 'Balance',
    },
    tag: 'Booking',
    color: 'green',
  },
  TIPS: {
    label: {
      photographer: 'Tip received',
      client: 'Tip sent',
      'event-coordinator': 'Tip sent',
      admin: 'Tip',
    },
    tag: 'Tip',
    color: 'purple',
  },
  BONUSES: {
    label: {
      photographer: 'Bonus earned',
      client: 'Bonus',
      'event-coordinator': 'Bonus',
      admin: 'Bonus',
    },
    tag: 'Bonus',
    color: 'amber',
  },
  GIFTS: {
    label: {
      photographer: 'Gift received',
      client: 'Gift sent',
      'event-coordinator': 'Gift sent',
      admin: 'Gift',
    },
    tag: 'Gift',
    color: 'purple',
  },
  STREAM_FEES: {
    label: {
      photographer: 'Stream bonus',
      client: 'Stream revenue',
      'event-coordinator': 'Stream revenue',
      admin: 'Stream fee',
    },
    tag: 'Stream',
    color: 'blue',
  },
  DONATIONS: {
    label: {
      photographer: 'Donation received',
      client: 'Donation sent',
      'event-coordinator': 'Donation sent',
      admin: 'Donation',
    },
    tag: 'Donation',
    color: 'purple',
  },
  WITHDRAWAL: {
    label: {
      photographer: 'Withdrawal',
      client: 'Withdrawal',
      'event-coordinator': 'Withdrawal',
      admin: 'Withdrawal',
    },
    tag: 'Withdrawal',
    color: 'red',
  },
  REFUND: {
    label: {
      photographer: 'Refund issued',
      client: 'Refund received',
      'event-coordinator': 'Refund received',
      admin: 'Refund',
    },
    tag: 'Refund',
    color: 'amber',
  },
  CLIENT_SPEND: {
    label: {
      photographer: 'Client payment',
      client: 'Payment sent',
      'event-coordinator': 'Event payment',
      admin: 'Client spend',
    },
    tag: 'Payment',
    color: 'neutral',
  },
  AD_REVENUE: {
    label: {
      photographer: 'Ad revenue share',
      client: 'Ad revenue',
      'event-coordinator': 'Ad revenue',
      admin: 'Ad revenue',
    },
    tag: 'Ad revenue',
    color: 'green',
  },
  PHOTO_PURCHASE: {
    label: {
      photographer: 'Photo sale',
      client: 'Photo purchase',
      'event-coordinator': 'Photo purchase',
      admin: 'Photo purchase',
    },
    tag: 'Photo',
    color: 'blue',
  },
  PLATFORM_FEE: {
    label: {
      photographer: 'Platform fee',
      client: 'Platform fee',
      'event-coordinator': 'Platform fee',
      admin: 'Platform fee',
    },
    tag: 'Fee',
    color: 'neutral',
  },
  HELD: {
    label: {
      photographer: 'Held for delivery',
      client: 'Held in escrow',
      'event-coordinator': 'Held in escrow',
      admin: 'Held',
    },
    tag: 'Held',
    color: 'amber',
  },
  PENDING: {
    label: {
      photographer: 'Pending clearance',
      client: 'Processing',
      'event-coordinator': 'Processing',
      admin: 'Pending',
    },
    tag: 'Pending',
    color: 'amber',
  },
  BLOCKED: {
    label: {
      photographer: 'Blocked',
      client: 'Blocked',
      'event-coordinator': 'Blocked',
      admin: 'Blocked',
    },
    tag: 'Blocked',
    color: 'red',
  },
};

// ─── Visibility rules ────────────────────────────────────────────────────────

/**
 * Returns true if this movement should be hidden from the given role.
 *
 * Rules:
 *  - PLATFORM_FEE is never shown to non-admin users (internal ledger row)
 *  - HELD / PENDING / BLOCKED movements are surfaced as stat-chips, not rows
 *  - Client/coordinator never see STREAM_FEES debit (that's the platform's cut)
 *  - Photographer never sees CLIENT_SPEND (that's the client-side ledger)
 *  - Admin sees everything
 */
export function shouldHideMovement(
  m: WalletMovementDTO,
  role: DashboardRole,
): boolean {
  if (role === 'admin') return false;

  const cat = m.category as WalletCategory;

  // Internal platform ledger. hide from everyone except admin
  if (cat === 'PLATFORM_FEE') return true;

  // Stat-only categories. shown in hero/cards, not in the activity feed
  if (cat === 'HELD' || cat === 'PENDING' || cat === 'BLOCKED') return true;

  // Photographer shouldn't see client-side spend rows
  if (role === 'photographer' && cat === 'CLIENT_SPEND') return true;

  // Client/coordinator shouldn't see STREAM_FEES debit (platform's cut)
  // They should only see STREAM_FEES credit (their 65% revenue)
  if (
    (role === 'client' || role === 'event-coordinator') &&
    cat === 'STREAM_FEES' &&
    m.direction === 'DEBIT'
  ) {
    return true;
  }

  return false;
}

// ─── Format a single WalletMovement into a MoneyItem ─────────────────────────

/**
 * Converts a backend WalletMovementDTO into a role-appropriate MoneyItem.
 * Returns `null` when the movement should be hidden from this role.
 */
export function formatWalletMovement(
  m: WalletMovementDTO,
  role: DashboardRole,
): MoneyItem | null {
  if (shouldHideMovement(m, role)) return null;

  const cat = (m.category || 'BALANCE') as string;
  const meta = CATEGORY_META[cat];
  const direction: MoneyItem['direction'] = m.direction === 'CREDIT' ? 'in' : 'out';

  // Determine the human-friendly title
  let title: string;
  if (meta) {
    title = meta.label[role] || meta.label.admin;
  } else {
    // Unknown category. use description or fallback
    title = cat.replace(/_/g, ' ').toLowerCase();
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Use description as subtitle when available
  const subtitle = m.description || undefined;

  return {
    id: m.id,
    title,
    subtitle,
    amount: Math.abs(m.amountUsd),
    originalAmount: m.originalAmount,
    originalCurrency: m.originalCurrency,
    direction,
    color: meta?.color ?? 'neutral',
    timestamp: m.createdAt,
    tag: meta?.tag ?? 'Other',
    sourceType: m.sourceType,
    sourceId: m.sourceId,
  };
}

// ─── Wallet stats for the hero + stat cards ──────────────────────────────────

export interface StatCard {
  label: string;
  value: number;
  color: MoneyItem['color'];
  /** When true, this stat should be hidden because it's zero */
  hidden: boolean;
}

export interface WalletStats {
  /** Primary big number at top of wallet page */
  hero: { label: string; value: number };
  /** Sub-balance cards below the hero */
  cards: StatCard[];
  /** Optional pending/held chip shown near the hero */
  pendingChip?: { label: string; value: number } | null;
  /** Wallet status for suspend/closed banners */
  status: string;
}

/**
 * Build role-appropriate wallet statistics from a WalletDTO.
 *
 *  - Photographer sees "Available to withdraw" + earnings breakdown
 *  - Client sees "Total spent" + pending declarations
 *  - Coordinator sees "Available balance" + stream revenue + event spend
 *  - Admin sees full raw breakdown
 */
export function selectWalletStats(
  w: WalletDTO,
  role: DashboardRole,
): WalletStats {
  const status = w.status || 'ACTIVE';

  if (role === 'photographer') {
    // balanceAvailable already = sum of every withdrawable bucket
    // (booking+tips+bonuses+gifts+streamFees+donations+adRevenue+photoPurchase).
    // The old code re-added five of those buckets on top of it, ~doubling
    // the figure. "Total earnings" = the true combined balance.
    const totalEarnings = w.balanceAvailable;

    return {
      hero: { label: 'Available to withdraw', value: w.balanceAvailable },
      cards: [
        { label: 'Total earnings', value: totalEarnings, color: 'green', hidden: false },
        { label: 'Tips', value: w.balanceTips, color: 'purple', hidden: w.balanceTips === 0 },
        { label: 'Bonuses', value: w.balanceBonuses, color: 'amber', hidden: w.balanceBonuses === 0 },
        { label: 'Stream bonus', value: w.balanceStreamFees, color: 'blue', hidden: w.balanceStreamFees === 0 },
        { label: 'Photo sales', value: w.balancePhotoPurchase, color: 'blue', hidden: w.balancePhotoPurchase === 0 },
        { label: 'Gifts', value: w.balanceGifts, color: 'purple', hidden: w.balanceGifts === 0 },
        { label: 'Donations', value: w.balanceDonations, color: 'purple', hidden: w.balanceDonations === 0 },
        // Total funds in escrow. The backend aggregates album-delivery-held
        // and photobook-held into a single HELD wallet bucket
        // (heldForDelivery on BalanceResponseDTO), so we display the total
        // and explain the release schedule in the tooltip / docs instead of
        // exposing two separate cards that the API can't itemise yet.
        { label: 'In escrow (releases on album + photobook)', value: w.heldForDelivery || w.deliveryHeldAmount || 0, color: 'amber', hidden: !(w.heldForDelivery || w.deliveryHeldAmount) },
        { label: 'Total withdrawn', value: w.totalWithdrawn, color: 'neutral', hidden: w.totalWithdrawn === 0 },
      ],
      pendingChip:
        w.pendingAmount + w.heldForDelivery > 0
          ? { label: 'Pending clearance', value: w.pendingAmount + w.heldForDelivery }
          : null,
      status,
    };
  }

  if (role === 'client') {
    return {
      hero: { label: 'Total spent', value: w.clientSpent },
      cards: [
        { label: 'Available balance', value: w.balanceAvailable, color: 'green', hidden: w.balanceAvailable === 0 },
        { label: 'Refunds received', value: w.totalRefunded, color: 'amber', hidden: w.totalRefunded === 0 },
        { label: 'Tips sent', value: w.balanceTips, color: 'purple', hidden: w.balanceTips === 0 },
        { label: 'Gifts sent', value: w.balanceGifts, color: 'purple', hidden: w.balanceGifts === 0 },
        { label: 'Donations', value: w.balanceDonations, color: 'purple', hidden: w.balanceDonations === 0 },
      ],
      pendingChip:
        w.pendingAmount > 0
          ? { label: 'Processing', value: w.pendingAmount }
          : null,
      status,
    };
  }

  if (role === 'event-coordinator') {
    return {
      hero: { label: 'Available balance', value: w.balanceAvailable },
      cards: [
        { label: 'Stream revenue', value: w.balanceStreamFees, color: 'blue', hidden: w.balanceStreamFees === 0 },
        { label: 'Event spend', value: w.clientSpent, color: 'neutral', hidden: w.clientSpent === 0 },
        { label: 'Tips sent', value: w.balanceTips, color: 'purple', hidden: w.balanceTips === 0 },
        { label: 'Donations', value: w.balanceDonations, color: 'purple', hidden: w.balanceDonations === 0 },
        { label: 'Refunds received', value: w.totalRefunded, color: 'amber', hidden: w.totalRefunded === 0 },
        { label: 'Total withdrawn', value: w.totalWithdrawn, color: 'neutral', hidden: w.totalWithdrawn === 0 },
      ],
      pendingChip:
        w.pendingAmount > 0
          ? { label: 'Processing', value: w.pendingAmount }
          : null,
      status,
    };
  }

  // Admin. show everything
  return {
    hero: { label: 'Available balance', value: w.balanceAvailable },
    cards: [
      { label: 'Tips', value: w.balanceTips, color: 'purple', hidden: false },
      { label: 'Bonuses', value: w.balanceBonuses, color: 'amber', hidden: false },
      { label: 'Gifts', value: w.balanceGifts, color: 'purple', hidden: false },
      { label: 'Stream fees', value: w.balanceStreamFees, color: 'blue', hidden: false },
      { label: 'Donations', value: w.balanceDonations, color: 'purple', hidden: false },
      { label: 'Held for delivery', value: w.heldForDelivery, color: 'amber', hidden: false },
      { label: 'Pending', value: w.pendingAmount, color: 'amber', hidden: false },
      { label: 'Blocked', value: w.blockedAmount, color: 'red', hidden: false },
      { label: 'Client spent', value: w.clientSpent, color: 'neutral', hidden: false },
      { label: 'Total withdrawn', value: w.totalWithdrawn, color: 'neutral', hidden: false },
      { label: 'Total refunded', value: w.totalRefunded, color: 'amber', hidden: false },
    ],
    pendingChip: null,
    status,
  };
}

// ─── Payment declaration formatter ───────────────────────────────────────────

/** Minimal shape of a payment declaration as used by the dashboard pages. */
export interface PaymentDeclaration {
  id: string | number;
  declarationId?: string;
  eventName?: string;
  eventId?: string;
  amount: number;
  paidAmount?: number;
  currency?: string;
  status: string;
  date?: string;
  paymentType?: string;
  photographerName?: string;
  escrowPercentage?: number;
  heldAmount?: number;
  releasedAmount?: number;
  eventCompletionStatus?: string;
}

/**
 * Formats a payment declaration into a role-appropriate MoneyItem.
 *
 *  - Photographer: "Booking. {eventName}" (income perspective)
 *  - Client: "Payment. {eventName}" (spend perspective)
 *  - Coordinator (organizer): "Event payment. {eventName}". never shows booking fee
 *  - Admin: raw view with all data
 */
export function formatPaymentDeclaration(
  p: PaymentDeclaration,
  role: DashboardRole,
  isOrganizer: boolean = false,
): MoneyItem {
  const paid = p.paidAmount ?? p.amount;
  const statusLower = (p.status || '').toLowerCase();
  const isPending = statusLower === 'pending' || statusLower === 'partially_paid';
  const isFailed = statusLower === 'failed';

  let title: string;
  let direction: MoneyItem['direction'];
  let color: MoneyItem['color'];

  if (role === 'photographer') {
    title = p.eventName ? `Booking. ${p.eventName}` : 'Booking payment';
    direction = 'in';
    color = isFailed ? 'red' : isPending ? 'amber' : 'green';
  } else if (role === 'client') {
    title = p.eventName ? `Payment. ${p.eventName}` : 'Payment';
    direction = 'out';
    color = isFailed ? 'red' : isPending ? 'amber' : 'neutral';
  } else if (role === 'event-coordinator') {
    title = p.eventName ? `Event payment. ${p.eventName}` : 'Event payment';
    direction = isOrganizer ? 'out' : 'in';
    color = isFailed ? 'red' : isPending ? 'amber' : isOrganizer ? 'neutral' : 'green';
  } else {
    // admin
    title = p.eventName
      ? `Declaration. ${p.eventName}`
      : `Declaration #${p.declarationId || p.id}`;
    direction = 'in';
    color = isFailed ? 'red' : isPending ? 'amber' : 'green';
  }

  const subtitle = p.photographerName
    ? role === 'photographer'
      ? undefined
      : p.photographerName
    : undefined;

  return {
    id: String(p.declarationId || p.id),
    title,
    subtitle,
    amount: Math.abs(paid),
    direction,
    color,
    timestamp: p.date || new Date().toISOString(),
    tag: p.paymentType || 'Booking',
    sourceType: 'PAYMENT_DECLARATION',
    sourceId: p.eventId || String(p.id),
  };
}

// ─── Activity filter pills ───────────────────────────────────────────────────

/** Returns the set of filter tags appropriate for the role. */
export function getFilterTags(role: DashboardRole): string[] {
  if (role === 'photographer') {
    return ['All', 'Booking', 'Tip', 'Bonus', 'Stream', 'Photo', 'Donation', 'Withdrawal'];
  }
  if (role === 'client') {
    return ['All', 'Payment', 'Tip', 'Gift', 'Donation', 'Photo', 'Refund'];
  }
  if (role === 'event-coordinator') {
    return ['All', 'Payment', 'Stream', 'Tip', 'Donation', 'Refund', 'Withdrawal'];
  }
  // admin
  return [
    'All', 'Booking', 'Tip', 'Bonus', 'Gift', 'Stream', 'Photo',
    'Donation', 'Withdrawal', 'Refund', 'Fee', 'Held', 'Pending', 'Blocked',
  ];
}

// ─── Colour map for UI components ────────────────────────────────────────────

export const COLOR_MAP: Record<MoneyItem['color'], { bg: string; text: string; border: string }> = {
  green:   { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  red:     { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  blue:    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  amber:   { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  purple:  { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  neutral: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
};
