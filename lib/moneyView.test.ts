import { describe, it, expect } from 'vitest';
import { selectWalletStats, formatWalletMovement } from './moneyView';
import type { WalletDTO, WalletMovementDTO } from './walletApi';

/**
 * A photographer's wallet showed $0.00 available beside Stream bonus $11.40,
 * Album sales $0.33 and Donations $3.40, and an activity row "Booking earnings
 * -$18,000.00". The cards must be the breakdown of the hero, and a debit must not
 * be labelled as earnings.
 */

const wallet = (over: Partial<WalletDTO>): WalletDTO =>
  ({
    balanceAvailable: 0, balanceBooking: 0, balanceTips: 0, balanceBonuses: 0, balanceGifts: 0,
    balanceStreamFees: 0, balanceDonations: 0, balanceAdRevenue: 0, balancePhotoPurchase: 0,
    heldForDelivery: 0, pendingAmount: 0, blockedAmount: 0, totalWithdrawn: 0,
    totalRefunded: 0, clientSpent: 0, status: 'ACTIVE', ...over,
  }) as WalletDTO;

describe('photographer wallet cards', () => {
  it('are the breakdown of the hero, so the visible earnings add up to the available balance', () => {
    const w = wallet({
      balanceAvailable: 15.13, balanceStreamFees: 11.4, balancePhotoPurchase: 0.33, balanceDonations: 3.4,
    });
    const stats = selectWalletStats(w, 'photographer');
    const shown = stats.cards.filter((c) => !c.hidden && !/escrow|withdrawn/i.test(c.label));

    expect(stats.hero.value).toBeCloseTo(15.13);
    expect(shown.reduce((s, c) => s + c.value, 0)).toBeCloseTo(stats.hero.value);
  });

  it('do not repeat the hero as a "Total earnings" card', () => {
    const stats = selectWalletStats(wallet({ balanceAvailable: 5, balanceBooking: 5 }), 'photographer');
    expect(stats.cards.some((c) => c.label === 'Total earnings')).toBe(false);
    expect(stats.cards.find((c) => c.label === 'Booking earnings')?.value).toBe(5);
  });
});

describe('a debit on the booking balance', () => {
  const debit = {
    id: '1', walletId: 'w', category: 'BALANCE', direction: 'DEBIT', amountUsd: 18000,
    sourceType: 'PHOTOGRAPHER_TRANSACTION', description: 'Booking fee (9%)', createdAt: '2026-06-24T00:00:00Z',
  } as WalletMovementDTO;

  it('is a deduction for a photographer, not "Booking earnings"', () => {
    expect(formatWalletMovement(debit, 'photographer')?.title).toBe('Balance deduction');
  });

  it('keeps its label for a client, where BALANCE out is a payment', () => {
    expect(formatWalletMovement(debit, 'client')?.title).toBe('Booking payment');
  });

  it('still calls a credit "Booking earnings"', () => {
    expect(formatWalletMovement({ ...debit, direction: 'CREDIT' } as WalletMovementDTO, 'photographer')?.title)
      .toBe('Booking earnings');
  });
});
