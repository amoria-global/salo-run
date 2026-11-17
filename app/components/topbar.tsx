"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import { getApiUrl } from '@/lib/api';
import PayNowModal from './UnlockModal';
import type { Payment } from './UnlockModal';
import Modal from './ui/Modal';
import Button from './ui/Button';
import KycVerificationModal from './KycVerificationModal';
import {
  desktopAlertPermission,
  freshUnread,
  playAlert,
  requestDesktopAlerts,
  showDesktopAlert,
  strongestAlert,
} from '@/app/lib/notificationAlerts';

import { useTopbarState } from './topbarState';
import { useUiGlass } from '../lib/useUiGlass';
import type { NotificationItem } from './topbarState';

interface TopbarProps {
  userRole?: 'client' | 'photographer' | 'admin' | 'event-coordinator';
}

const roleLabel = (r: string) => r === 'photographer' ? 'Photographer'
  : r === 'admin' ? 'Admin'
  : r === 'event-coordinator' ? 'Event Coordinator'
  : 'Client';

/** The Compact Glass shell (components/glass) draws its own top bar; with the flag off this is the top bar. */
export default function Topbar(props: TopbarProps) {
  const glass = useUiGlass();
  return glass ? null : <LegacyTopbar {...props} />;
}

function LegacyTopbar({ userRole = 'client' }: TopbarProps) {
  const {
    openPendingPayment, actualTheme, setTheme, colors, user, logout, refreshUserProfile, router, role, currency, setCurrency, formatPrice, currencies, language, setLanguage, languages, isDropdownOpen, setIsDropdownOpen, isNotificationsOpen, setIsNotificationsOpen, expandedNotifId, setExpandedNotifId, isCurrencyOpen, setIsCurrencyOpen, isLangOpen, setIsLangOpen, showLogoutModal, setShowLogoutModal, showKycModal, setShowKycModal, isCollaborator, notifications, setNotifications, unreadCount, setUnreadCount, giftAmount, setGiftAmount, selfLiveStreamFee, setSelfLiveStreamFee, selfBalanceAmount, setSelfBalanceAmount, selfTipsAmount, setSelfTipsAmount, selfBonusAmount, setSelfBonusAmount, walletBalance, setWalletBalance, walletStatus, setWalletStatus, pendingPaymentWarning, setPendingPaymentWarning, showPayNowModal, setShowPayNowModal, topbarPayment, setTopbarPayment, isAvailabilityOpen, setIsAvailabilityOpen, availMonth, setAvailMonth, blockedDates, setBlockedDates, availLoading, setAvailLoading, availSavingDate, setAvailSavingDate, dropdownRef, notificationsRef, seenNotifIdsRef, desktopAlerts, setDesktopAlerts, currencyRef, langRef, availabilityRef, getUserDisplayName, fetchNotifications, fetchFinancials, markAsRead, markAllAsRead, handleToggleExpand, handleNotificationClick, getNotificationIcon, fetchBlockedDates, toggleBlockedDate
  } = useTopbarState(userRole);

  return (
    <>
      <header className="ck-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ck-text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} className="topbar-title">
            {roleLabel(role)} Dashboard
          </h1>

          {userRole === 'photographer' && (
            <div ref={availabilityRef} style={{ position: 'relative', marginLeft: 20 }}>
              <button
                onClick={() => setIsAvailabilityOpen(o => !o)}
                aria-label="Manage availability"
                title="Mark days you're booked / unavailable"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px', borderRadius: 9999,
                  background: isAvailabilityOpen ? 'rgba(8,77,168,0.10)' : 'var(--ck-surface)',
                  border: `1px solid ${isAvailabilityOpen ? 'var(--ck-blue)' : 'var(--ck-stroke)'}`,
                  color: 'var(--ck-text)', fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'background 150ms, border-color 150ms',
                }}
              >
                <i className="bi bi-calendar2-check" style={{ fontSize: 15, color: 'var(--ck-blue)' }} />
                <span>Availability</span>
                {blockedDates.size > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999,
                    background: '#ef4444', color: '#fff', fontSize: 10.5, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>{blockedDates.size}</span>
                )}
                <i className="bi bi-chevron-down" style={{ fontSize: 10, color: 'var(--ck-text-soft)', transform: isAvailabilityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }} />
              </button>
              {isAvailabilityOpen && (() => {
                const { year, month } = availMonth;
                const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
                const firstDow = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const cells: React.ReactNode[] = [];
                for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />);
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const cellDate = new Date(year, month, d);
                  const isPast = cellDate < todayMid;
                  const isBlocked = blockedDates.has(dateStr);
                  const saving = availSavingDate === dateStr;
                  cells.push(
                    <button
                      key={d}
                      type="button"
                      disabled={isPast || saving}
                      onClick={() => { if (!isPast) toggleBlockedDate(dateStr); }}
                      title={isPast ? 'Past date' : isBlocked ? 'Booked. click to free up' : 'Available. click to mark booked'}
                      style={{
                        aspectRatio: '1', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        opacity: isPast ? 0.4 : (saving ? 0.6 : 1),
                        border: isBlocked ? '1px solid #dc2626' : '1px solid var(--ck-stroke)',
                        background: isPast ? 'transparent' : isBlocked ? '#ef4444' : 'var(--ck-surface-muted)',
                        color: isPast ? 'var(--ck-text-soft)' : isBlocked ? '#fff' : 'var(--ck-text)',
                        transition: 'background 150ms, color 150ms',
                      }}
                    >{d}</button>
                  );
                }
                return (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                    background: 'var(--ck-surface)', borderRadius: 14, boxShadow: 'var(--ck-shadow-lg)',
                    border: '1px solid var(--ck-stroke)', padding: 14, width: 320, zIndex: 50,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ck-text)' }}>My availability</div>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--ck-text-soft)', lineHeight: 1.5 }}>
                      Tap a day to mark yourself <strong style={{ color: 'var(--g-error, #ef4444)' }}>booked</strong>. Booked days show red on your public profile and clients can&apos;t book them. Tap again to free the day.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <button type="button" aria-label="Previous month"
                        onClick={() => setAvailMonth(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 })}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)', color: 'var(--ck-text)', cursor: 'pointer' }}>
                        <i className="bi bi-chevron-left" style={{ fontSize: 11 }} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ck-text)' }}>{monthLabel}</span>
                      <button type="button" aria-label="Next month"
                        onClick={() => setAvailMonth(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 })}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)', color: 'var(--ck-text)', cursor: 'pointer' }}>
                        <i className="bi bi-chevron-right" style={{ fontSize: 11 }} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--ck-text-soft)' }}>{w}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, opacity: availLoading ? 0.6 : 1 }}>
                      {cells}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--ck-stroke)', fontSize: 11, color: 'var(--ck-text-soft)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--ck-surface-muted)', border: '1px solid var(--ck-stroke)' }} />Available</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444' }} />Booked</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {(role === 'client' || role === 'event-coordinator') && walletBalance !== null && (
            <Link href={`/user/${role}/wallet`} className="topbar-wallet" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 9999,
              background: 'var(--ck-surface-muted)', border: '1px solid var(--ck-stroke)',
              textDecoration: 'none', color: 'var(--ck-text)',
              fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              <i className="bi bi-wallet2" style={{ color: 'var(--ck-blue)', fontSize: 14 }} />
              <span>{formatPrice(walletBalance)}</span>
              {walletStatus === 'SUSPENDED' && (
                <span className="ck-pill ck-status-error" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>SUSPENDED</span>
              )}
            </Link>
          )}

          {userRole === 'photographer' && (
            <>
              <div className="topbar-balance" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9999,
                background: 'var(--ck-surface-muted)', border: '1px solid var(--ck-stroke)',
                fontSize: '0.85rem', fontWeight: 600,
              }}>
                <i className="bi bi-bank" style={{ color: 'var(--ck-blue)', fontSize: 14 }} />
                <span style={{ color: 'var(--ck-text-soft)' }}>Balance</span>
                <span style={{ color: 'var(--ck-text)', fontWeight: 700 }}>{formatPrice(selfBalanceAmount)}</span>
              </div>
              <div className="topbar-tips" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9999,
                background: 'rgba(242,12,143,0.08)', border: '1px solid rgba(242,12,143,0.18)',
                fontSize: '0.85rem', fontWeight: 600,
              }}>
                <i className="bi bi-coin" style={{ color: '#F20C8F', fontSize: 14 }} />
                <span style={{ color: '#F20C8F', fontWeight: 700 }}>{formatPrice(selfTipsAmount)}</span>
              </div>
            </>
          )}

          <button
            onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="topbar-theme-btn"
            style={{
              border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)',
              borderRadius: 9999, width: 36, height: 36,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ck-text-soft)',
            }}
            title={actualTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <i className={`bi ${actualTheme === 'dark' ? 'bi-sun' : 'bi-moon'}`} style={{ fontSize: 15 }} />
          </button>

          <div ref={langRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-label="Change language"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 9999,
                border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)',
                color: 'var(--ck-text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <img src={`https://flagcdn.com/w40/${languages.find(l => l.code === language)?.flag || 'gb'}.png`} alt=""
                style={{ width: 18, height: 14, objectFit: 'cover', borderRadius: 2 }} />
              <span data-no-translate>{language.toUpperCase()}</span>
              <i className="bi bi-chevron-down" style={{ fontSize: 10, transform: isLangOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }} />
            </button>
            {isLangOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 14, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', padding: 6, minWidth: 210, zIndex: 50,
              }}>
                {languages.map((l) => (
                  <button key={l.code} onClick={() => { setLanguage(l.code); setIsLangOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: language === l.code ? 'var(--ck-surface-muted)' : 'transparent',
                      color: 'var(--ck-text)', fontSize: '0.85rem',
                      fontWeight: language === l.code ? 600 : 500, cursor: 'pointer', gap: 8,
                    }}
                    onMouseEnter={(e) => { if (language !== l.code) e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                    onMouseLeave={(e) => { if (language !== l.code) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-no-translate>
                      <img src={`https://flagcdn.com/w40/${l.flag}.png`} alt="" style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2 }} />
                      <span style={{ fontWeight: 700 }}>{l.nativeLabel}</span>
                      <span style={{ color: 'var(--ck-text-soft)', fontSize: '0.78rem' }}>{l.label}</span>
                    </span>
                    {language === l.code && <i className="bi bi-check-lg" style={{ color: 'var(--ck-blue)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={currencyRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 9999,
                border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)',
                color: 'var(--ck-text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <img src={`/flags/${currencies.find(c => c.code === currency)?.flag}.svg`} alt=""
                style={{ width: 18, height: 14, objectFit: 'cover', borderRadius: 2 }} />
              {currency}
              <i className="bi bi-chevron-down" style={{ fontSize: 10, transform: isCurrencyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }} />
            </button>
            {isCurrencyOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 14, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', padding: 6, minWidth: 220, zIndex: 50,
              }}>
                {currencies.map((c) => (
                  <button key={c.code} onClick={() => { setCurrency(c.code); setIsCurrencyOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: currency === c.code ? 'var(--ck-surface-muted)' : 'transparent',
                      color: 'var(--ck-text)', fontSize: '0.85rem',
                      fontWeight: currency === c.code ? 600 : 500, cursor: 'pointer', gap: 8,
                    }}
                    onMouseEnter={(e) => { if (currency !== c.code) e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                    onMouseLeave={(e) => { if (currency !== c.code) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={`/flags/${c.flag}.svg`} alt="" style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2 }} />
                      <span style={{ fontWeight: 700 }}>{c.code}</span>
                      <span style={{ color: 'var(--ck-text-soft)' }}>{c.name}</span>
                    </span>
                    {currency === c.code && <i className="bi bi-check-lg" style={{ color: 'var(--ck-blue)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={notificationsRef} style={{ position: 'relative' }}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{
                position: 'relative', width: 36, height: 36, borderRadius: 9999,
                background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
                cursor: 'pointer', color: 'var(--ck-text-soft)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }} aria-label="Notifications">
              <i className="bi bi-bell" style={{ fontSize: 15 }} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#F20C8F', color: 'white',
                  fontSize: 10, fontWeight: 700, borderRadius: 9999,
                  minWidth: 18, height: 18, padding: '0 4px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--ck-surface)',
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 16, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', width: 380, maxWidth: 'calc(100vw - 24px)',
                zIndex: 50, overflow: 'hidden',
              }} className="ck-fade-in-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--ck-stroke)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="ck-pill" style={{ background: 'rgba(242,12,143,0.10)', color: '#F20C8F', padding: '2px 8px' }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {desktopAlerts === 'default' && (
                    <button
                      onClick={async () => setDesktopAlerts(await requestDesktopAlerts())}
                      title="Get a desktop notification and sound for new booking requests, even when this tab is in the background"
                      style={{
                        background: 'none', border: 'none', color: 'var(--ck-blue)',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <i className="bi bi-bell" /> Enable desktop alerts
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{
                      background: 'none', border: 'none', color: 'var(--ck-blue)',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    }}>Mark all read</button>
                  )}
                </div>

                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ck-text-soft)' }}>
                      <i className="bi bi-bell-slash" style={{ fontSize: 26, color: 'var(--ck-text-muted)', display: 'block', marginBottom: 8 }} />
                      <div style={{ fontSize: '0.88rem' }}>You&apos;re all caught up</div>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const ico = getNotificationIcon(notification.type);
                      const isExpanded = expandedNotifId === notification.id;
                      return (
                        <div key={notification.id} onClick={() => handleToggleExpand(notification.id)}
                          style={{
                            display: 'flex', gap: 12, padding: '12px 18px',
                            borderBottom: '1px solid var(--ck-stroke-soft)',
                            background: notification.read ? 'transparent' : 'rgba(8,58,133,0.03)',
                            cursor: 'pointer', transition: 'background 180ms',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(8,58,133,0.03)'; }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9999, background: ico.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <i className={`bi ${ico.icon}`} style={{ color: ico.color, fontSize: 14 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: notification.read ? 500 : 700, color: 'var(--ck-text)' }}>{notification.title}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--ck-text-muted)', flexShrink: 0 }}>{notification.time}</span>
                            </div>
                            <p style={{
                              margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--ck-text-soft)',
                              overflow: isExpanded ? 'visible' : 'hidden',
                              textOverflow: isExpanded ? 'clip' : 'ellipsis',
                              whiteSpace: isExpanded ? 'normal' : 'nowrap',
                              wordBreak: isExpanded ? 'break-word' : 'normal', lineHeight: 1.4,
                            }}>{notification.message}</p>
                            {isExpanded && (
                              <button onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                                style={{
                                  marginTop: 8, padding: '5px 10px', borderRadius: 8,
                                  border: '1px solid var(--ck-blue)', background: 'transparent',
                                  color: 'var(--ck-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                }}>Open <i className="bi bi-arrow-right" /></button>
                            )}
                          </div>
                          {!notification.read && (
                            <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#F20C8F', alignSelf: 'center', flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ padding: 12, borderTop: '1px solid var(--ck-stroke)', textAlign: 'center', background: 'var(--ck-surface-soft)' }}>
                  <Link href={`/user/${role === 'admin' ? 'client' : role}/notifications`}
                    style={{ color: 'var(--ck-blue)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                    onClick={() => setIsNotificationsOpen(false)}>View all notifications →</Link>
                </div>
              </div>
            )}
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: 4, paddingRight: 10, borderRadius: 9999,
                background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)', cursor: 'pointer',
              }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" style={{ width: 30, height: 30, borderRadius: 9999, objectFit: 'cover' }} />
              ) : (
                <span className="ck-avatar" style={{ width: 30, height: 30, fontSize: '0.78rem' }}>
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
              <span className="topbar-profile-info" style={{
                fontSize: '0.85rem', fontWeight: 600, color: 'var(--ck-text)',
                whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{getUserDisplayName().split(' ')[0]}</span>
              <i className="bi bi-chevron-down" style={{
                fontSize: 10, color: 'var(--ck-text-soft)',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms',
              }} />
            </button>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 16, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', minWidth: 250, overflow: 'hidden', zIndex: 50,
              }} className="ck-fade-in-up">
                <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--ck-stroke)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ck-text)' }}>{getUserDisplayName()}</div>
                  {user?.email && <div style={{ fontSize: '0.8rem', color: 'var(--ck-text-soft)', marginTop: 2 }}>{user.email}</div>}
                  <div style={{ marginTop: 8 }}>
                    <span className="ck-pill" style={{ background: 'rgba(8,58,133,0.08)', color: 'var(--ck-blue)' }}>
                      <i className="bi bi-person-badge" /> {roleLabel(role)}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 6 }}>
                  <Link href={`/user/${role}/profile`} onClick={() => setIsDropdownOpen(false)}
                    className="ck-row" style={{ textDecoration: 'none', color: 'var(--ck-text)' }}>
                    <i className="bi bi-person" style={{ fontSize: 16, marginRight: 10, color: 'var(--ck-text-soft)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Profile</span>
                  </Link>
                  {/* Consumers have no wallet (no earnings). */}
                  {role !== 'admin' && (
                    <Link href={`/user/${role}/wallet`} onClick={() => setIsDropdownOpen(false)}
                      className="ck-row" style={{ textDecoration: 'none', color: 'var(--ck-text)' }}>
                      <i className="bi bi-wallet2" style={{ fontSize: 16, marginRight: 10, color: 'var(--ck-text-soft)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Wallet</span>
                    </Link>
                  )}
                  {role !== 'admin' && (
                    <Link href={`/user/${role}/preferences`} onClick={() => setIsDropdownOpen(false)}
                      className="ck-row" style={{ textDecoration: 'none', color: 'var(--ck-text)' }}>
                      <i className="bi bi-sliders" style={{ fontSize: 16, marginRight: 10, color: 'var(--ck-text-soft)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Preferences</span>
                    </Link>
                  )}
                </div>
                <div style={{ height: 1, background: 'var(--ck-stroke)' }} />
                <button onClick={() => { setIsDropdownOpen(false); setShowLogoutModal(true); }}
                  className="ck-row"
                  style={{
                    width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'var(--g-error, #DC2626)', margin: 6, padding: '12px 14px',
                  }}>
                  <i className="bi bi-box-arrow-right" style={{ fontSize: 16, marginRight: 10 }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {pendingPaymentWarning && (userRole === 'client' || userRole === 'event-coordinator') && (
        <div style={{
          margin: '10px 24px 0', padding: '14px 18px',
          background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
          borderLeft: '3px solid #F59E0B', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--ck-shadow-sm)',
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.10)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--g-warning, #F59E0B)', fontSize: 16 }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ck-text)', letterSpacing: '-0.005em' }}>
              Payment required · {formatPrice(pendingPaymentWarning.totalAmount)}
            </div>
            <div style={{
              fontSize: '0.78rem', color: 'var(--ck-text-soft)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {pendingPaymentWarning.firstEvent}
              {pendingPaymentWarning.count > 1 ? ` and ${pendingPaymentWarning.count - 1} other${pendingPaymentWarning.count - 1 > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <button onClick={openPendingPayment}
          style={{
            flexShrink: 0, padding: '8px 16px',
            fontSize: '0.82rem', fontWeight: 600, borderRadius: 9, border: 'none',
            background: '#F59E0B', color: '#fff', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'all 180ms', boxShadow: '0 4px 10px rgba(245,158,11,0.25)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#D97706'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F59E0B'; }}>
            Pay now <i className="bi bi-arrow-right" style={{ fontSize: 12 }} />
          </button>
        </div>
      )}

      {user && user.kycStatus !== 'APPROVED' && userRole !== 'admin' && user.customerType !== 'Viewer' && !isCollaborator && !pendingPaymentWarning && (() => {
        const isPending = user.kycStatus === 'PENDING';
        const isRejected = user.kycStatus === 'REJECTED';
        const cfg = isRejected
          ? { accent: '#DC2626', tint: 'rgba(220,38,38,0.10)', icon: 'bi-shield-exclamation', title: 'KYC verification rejected', detail: 'Your submission needs corrections. Resubmit to continue.' }
          : isPending
          ? { accent: '#3B82F6', tint: 'rgba(59,130,246,0.10)', icon: 'bi-shield-check', title: 'KYC under review', detail: 'We’re verifying your details. This typically takes a few hours.' }
          : { accent: 'var(--g-link, #083A85)', tint: 'rgba(8,58,133,0.10)', icon: 'bi-shield-lock', title: 'Verify your identity', detail: 'Complete KYC to unlock withdrawals and full platform features.' };
        return (
          <div style={{
            margin: '10px 24px 0', padding: '14px 18px',
            background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
            borderLeft: `3px solid ${cfg.accent}`, borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: 'var(--ck-shadow-sm)',
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10, background: cfg.tint,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className={`bi ${cfg.icon}`} style={{ color: cfg.accent, fontSize: 16 }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ck-text)', letterSpacing: '-0.005em' }}>{cfg.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ck-text-soft)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.detail}</div>
            </div>
            {!isPending && (
              <button onClick={() => setShowKycModal(true)}
                style={{
                  flexShrink: 0, padding: '8px 16px',
                  fontSize: '0.82rem', fontWeight: 600, borderRadius: 9, border: 'none',
                  background: cfg.accent, color: '#fff', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 180ms',
                  boxShadow: `0 4px 10px ${isRejected ? 'rgba(220,38,38,0.25)' : 'rgba(8,58,133,0.25)'}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                {isRejected ? 'Resubmit' : 'Complete KYC'} <i className="bi bi-arrow-right" style={{ fontSize: 12 }} />
              </button>
            )}
          </div>
        );
      })()}

      <PayNowModal isOpen={showPayNowModal}
        onClose={() => { setShowPayNowModal(false); setTopbarPayment(null); }}
        payment={topbarPayment}
        onPaymentSuccess={() => { setShowPayNowModal(false); setTopbarPayment(null); fetchFinancials(); }} />

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
        size="sm" title="Sign out of Connekyt?"
        description="You'll need to sign in again to access your dashboard."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setShowLogoutModal(false); logout(); }}>Sign out</Button>
          </>
        }>
        <div style={{
          width: 56, height: 56, borderRadius: 9999, background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 8px',
        }}>
          <i className="bi bi-box-arrow-right" style={{ color: 'var(--g-error, #DC2626)', fontSize: 22 }} />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--ck-text-soft)', margin: 0 }}>
          Your session will end on this device.
        </p>
      </Modal>

      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={() => { setShowKycModal(false); refreshUserProfile(); }}
        colors={colors as unknown as Record<string, string>}
        actualTheme={actualTheme}
      />

      <style jsx>{`
        @media (max-width: 768px) {
          .topbar-title { display: none; }
          .topbar-wallet, .topbar-balance, .topbar-tips { display: none !important; }
          .topbar-profile-info { display: none; }
        }
        @media (max-width: 1024px) {
          .topbar-balance, .topbar-tips { display: none !important; }
        }
      `}</style>
    </>
  );
}
