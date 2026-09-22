'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/sidebar';
import Topbar from '../components/topbar';
import { useTheme } from '../context/ThemeContext';
import { useDashboardAuth } from '../providers/AuthProvider';
import {
  getDonationTiers,
  getCurrencyRates,
  getCurrencies,
  createPublicDonation,
  initiateDonationPayment,
  pollDonationStatus,
  type ExchangeRate,
  type CurrencyInfo,
} from '@/lib/donationApi';
import { PaymentMethodPicker, type PaymentMethodSelection } from '../components/payments/PaymentMethodPicker';
import { usePaymentCountry } from '@/lib/payments/usePaymentCountry';
import InternationalPhoneInput, { type PhoneValue } from '../components/phone/InternationalPhoneInput';

const FALLBACK_TIERS = [1000, 2000, 5000, 10000];

const CATEGORIES = [
  { icon: 'bi-people-fill', title: 'Family Support', description: 'Help families access healthcare, housing, and essential needs.' },
  { icon: 'bi-book-fill', title: 'Education', description: 'Provide books, supplies, and resources to children in need.' },
  { icon: 'bi-basket3-fill', title: 'Food Programs', description: 'Ensure nutritious meals reach those facing food insecurity.' },
  { icon: 'bi-heart-pulse-fill', title: 'Disability Support', description: 'Provide assistive devices and care for individuals with disabilities.' },
];

type Step = 'form' | 'payment' | 'polling' | 'success' | 'failed';

type DonateRole = 'photographer' | 'client' | 'event-coordinator';

interface DonatePageProps {
  userRole?: DonateRole;
}

export default function DonatePage({ userRole = 'client' }: DonatePageProps) {
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();

  // Data
  const [tiers, setTiers] = useState<number[]>(FALLBACK_TIERS);
  const [exchangeRates, setExchangeRates] = useState<Record<string, ExchangeRate>>({});
  const [baseCurrency, setBaseCurrency] = useState('RWF');
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);

  // Form
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [currency, setCurrency] = useState('RWF');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Payment
  const [step, setStep] = useState<Step>('form');
  const [paymentMethod, setPaymentMethod] = useState('');
  // Selected operator's canonical provider id (e.g. "MTN", "MPESA") + method type,
  // both come from PaymentMethodPicker so donations work in every PawaPay country.
  const [operatorProvider, setOperatorProvider] = useState('');
  const [methodType, setMethodType] = useState<'MOBILE_MONEY' | 'CARD'>('MOBILE_MONEY');
  const { country: payCountry, setCountry: setPayCountry } = usePaymentCountry();
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [donationId, setDonationId] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const stopPollingRef = useRef<(() => void) | null>(null);

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setDonorName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setDonorEmail(user.email || '');
    }
  }, [user]);

  // Fetch tiers
  useEffect(() => {
    getDonationTiers().then(res => {
      if (res.success && res.data) {
        if (res.data.tiers?.length) setTiers(res.data.tiers.map(t => t.amount));
        if (res.data.baseCurrency) setBaseCurrency(res.data.baseCurrency);
      }
    });
  }, []);

  // Fetch rates
  useEffect(() => {
    getCurrencyRates().then(res => {
      if (res.success && res.data) setExchangeRates(res.data);
    });
  }, []);

  // Fetch currencies
  useEffect(() => {
    getCurrencies().then(res => {
      if (res.success && res.data) setCurrencies(res.data);
    });
  }, []);

  // Conversion helpers
  const getRate = useCallback((code: string): number => {
    const base = exchangeRates[baseCurrency];
    const target = exchangeRates[code];
    if (base?.rateToUsd && target?.rateToUsd) return target.rateToUsd / base.rateToUsd;
    return 1;
  }, [exchangeRates, baseCurrency]);

  const convert = useCallback((rwf: number): number => {
    const rate = getRate(currency);
    return rate === 1 ? Math.round(rwf) : Math.round(rwf * rate * 100) / 100;
  }, [currency, getRate]);

  const formatAmt = (val: number): string => {
    const frac = getRate(currency) === 1 ? 0 : 2;
    return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: frac }).format(val)} ${currency}`;
  };

  const getAmount = (): number => {
    if (isCustom && customAmount) return parseFloat(customAmount) || 0;
    if (selectedTier !== null) return convert(selectedTier);
    return 0;
  };

  const canSubmit = getAmount() > 0 && (!isAnonymous ? donorName.trim() && donorEmail.trim() : true);

  // Currency list
  const currencyList = Object.keys(exchangeRates).length > 0
    ? Object.keys(exchangeRates)
    : currencies.map(c => c.code).filter(Boolean);
  if (!currencyList.includes(baseCurrency)) currencyList.unshift(baseCurrency);

  // Handle donation submission
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const matchedCurrency = currencies.find(c => c.code === currency);
      const res = await createPublicDonation({
        amount: getAmount().toString(),
        currencyId: matchedCurrency?.id,
        donorName: isAnonymous ? undefined : donorName || undefined,
        donorEmail: isAnonymous ? undefined : donorEmail || undefined,
        message: message || `${CATEGORIES[activeCategory].title} donation`,
      });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to create donation');
      setDonationId(res.data.id);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment initiation
  const handlePay = async () => {
    if (!paymentMethod) { setError('Please select a payment method'); return; }
    if (methodType !== 'CARD' && !phone?.isValid) {
      setError('Please enter a valid phone number for the selected country'); return;
    }
    setLoading(true);
    setError('');
    try {
      const telecom = methodType === 'CARD' ? '' : operatorProvider;
      const method = methodType;
      const res = await initiateDonationPayment({
        donationId,
        phone: phone?.digits || undefined,
        telecomProvider: telecom || undefined,
        paymentMethod: method,
        redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        country: payCountry || undefined,
      });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to initiate payment');
      if (res.data.paymentUrl) setPaymentUrl(res.data.paymentUrl);
      setStep('polling');
      // Start polling
      stopPollingRef.current = pollDonationStatus(res.data.refid, {
        onSuccess: () => setStep('success'),
        onFailure: () => setStep('failed'),
        onError: (err) => { setError(err); setStep('failed'); },
      });
      // Open card URL
      if (res.data.paymentUrl && paymentMethod === 'card') {
        window.open(res.data.paymentUrl, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (stopPollingRef.current) stopPollingRef.current(); };
  }, []);

  const resetAll = () => {
    setStep('form');
    setSelectedTier(null);
    setCustomAmount('');
    setIsCustom(false);
    setMessage('');
    setPaymentMethod('');
    setOperatorProvider('');
    setMethodType('MOBILE_MONEY');
    setPhone(null);
    setError('');
    setDonationId('');
    setPaymentUrl('');
    if (stopPollingRef.current) stopPollingRef.current();
  };

  const accent = '#F20C8F';

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', backgroundColor: colors.bgPrimary }}>
    <div style={{ padding: 'clamp(16px, 3vw, 32px)', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: 'clamp(22px, 3vw, 32px)',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #083A85 0%, #0D52BD 55%, #F20C8F 130%)',
          color: '#fff',
          boxShadow: '0 18px 44px rgba(8, 58, 133, 0.28)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -60,
            top: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(242,12,143,0.45) 0%, rgba(242,12,143,0) 65%)',
            filter: 'blur(2px)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-heart-fill" style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.24)',
                backdropFilter: 'blur(6px)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#fff',
                marginBottom: 8,
              }}
            >
              GIVE BACK
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 2.5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Support a cause
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.88)', maxWidth: 520, lineHeight: 1.5 }}>
              Your donation helps support vulnerable families, educate children, and empower those in need.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════ FORM STEP ═══════ */}
      {step === 'form' && (
        <div style={{
          background: colors.bgSecondary, borderRadius: '16px', padding: 'clamp(20px, 3vw, 28px)',
          border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard,
        }}>
          {/* Categories */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Donation Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {CATEGORIES.map((cat, i) => (
                <button key={i} data-ck-shape="card" onClick={() => setActiveCategory(i)} style={{
                  padding: '14px 12px', borderRadius: '12px', border: `2px solid ${activeCategory === i ? accent : colors.borderPrimary}`,
                  background: activeCategory === i ? (actualTheme === 'dark' ? `${accent}15` : `${accent}08`) : colors.bgCard,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}>
                  <i className={`bi ${cat.icon}`} style={{ fontSize: '18px', color: activeCategory === i ? accent : colors.textSecondary, display: 'block', marginBottom: '6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: activeCategory === i ? accent : colors.textPrimary }}>{cat.title}</div>
                  <div style={{ fontSize: '11px', color: colors.textSecondary, lineHeight: 1.4, marginTop: '2px' }}>{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          {currencyList.length > 1 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Currency
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {currencyList.slice(0, 6).map(code => (
                  <button key={code} onClick={() => { setCurrency(code); setCustomAmount(''); }} style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${currency === code ? accent : colors.borderPrimary}`,
                    background: currency === code ? (actualTheme === 'dark' ? `${accent}15` : `${accent}08`) : colors.bgCard,
                    color: currency === code ? accent : colors.textSecondary,
                  }}>
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Tiers */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Amount
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {tiers.map(tier => {
                const converted = convert(tier);
                const active = !isCustom && selectedTier === tier;
                return (
                  <button key={tier} onClick={() => { setSelectedTier(tier); setIsCustom(false); setCustomAmount(''); }} style={{
                    padding: '12px 10px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${active ? accent : colors.borderPrimary}`,
                    background: active ? (actualTheme === 'dark' ? `${accent}15` : `${accent}08`) : colors.bgCard,
                    color: active ? accent : colors.textPrimary,
                  }}>
                    {formatAmt(converted)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom amount */}
          <div style={{ marginBottom: '20px' }}>
            <div onClick={() => { setIsCustom(true); setSelectedTier(null); }} style={{
              display: 'flex', alignItems: 'center', border: `2px solid ${isCustom ? accent : colors.borderPrimary}`,
              borderRadius: '10px', overflow: 'hidden', background: isCustom ? (actualTheme === 'dark' ? `${accent}10` : `${accent}05`) : colors.bgCard, transition: 'all 0.2s',
            }}>
              <span style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: colors.textSecondary, background: colors.bgTertiary, borderRight: `1px solid ${colors.borderPrimary}` }}>
                {currency}
              </span>
              <input type="number" placeholder="Custom amount" value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setIsCustom(true); setSelectedTier(null); }}
                onFocus={() => { setIsCustom(true); setSelectedTier(null); }}
                style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: '14px', fontWeight: 500, background: 'transparent', color: colors.textPrimary }} min="1"
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: colors.borderPrimary, margin: '20px 0' }} />

          {/* Donor info */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Information
              </label>
              <button onClick={() => setIsAnonymous(!isAnonymous)} style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginLeft: 'auto',
                border: `1px solid ${isAnonymous ? accent : colors.borderPrimary}`,
                background: isAnonymous ? accent : 'transparent', color: isAnonymous ? '#fff' : colors.textSecondary,
              }}>
                {isAnonymous ? 'Anonymous' : 'Make Anonymous'}
              </button>
            </div>
            {!isAnonymous && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Full Name" value={donorName} onChange={e => setDonorName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.borderPrimary}`, fontSize: '13px', color: colors.textPrimary, background: colors.bgInput, outline: 'none' }}
                />
                <input type="email" placeholder="Email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.borderPrimary}`, fontSize: '13px', color: colors.textPrimary, background: colors.bgInput, outline: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Message */}
          <div style={{ marginBottom: '20px' }}>
            <textarea placeholder="Add a message (optional)" value={message} onChange={e => setMessage(e.target.value)} rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.borderPrimary}`, fontSize: '13px', color: colors.textPrimary, background: colors.bgInput, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Total */}
          {getAmount() > 0 && (
            <div style={{
              background: actualTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                <span>Total Donation:</span>
                <span style={{ color: accent }}>{formatAmt(getAmount())}</span>
              </div>
            </div>
          )}

          {error && <p style={{ color: colors.statusError, fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
            background: canSubmit ? accent : colors.bgTertiary, color: canSubmit ? '#fff' : colors.textTertiary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><i className="bi bi-heart-fill" /> Proceed to Payment</>}
          </button>
        </div>
      )}

      {/* ═══════ PAYMENT STEP ═══════ */}
      {step === 'payment' && (
        <div style={{
          background: colors.bgSecondary, borderRadius: '16px', padding: 'clamp(20px, 3vw, 28px)',
          border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard,
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>Choose Payment Method</h3>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>Donation: <strong style={{ color: accent }}>{formatAmt(getAmount())}</strong></p>

          <div style={{ marginBottom: '16px' }}>
            <PaymentMethodPicker
              country={payCountry}
              onCountryChange={(iso2) => { setPayCountry(iso2); setPaymentMethod(''); setOperatorProvider(''); }}
              selectedMethodId={paymentMethod || null}
              onSelect={(sel: PaymentMethodSelection) => {
                setPaymentMethod(sel.methodId);
                setOperatorProvider(sel.operator?.id ?? '');
                setMethodType(sel.type);
              }}
              allowCard
              disabled={loading}
            />
          </div>

          {paymentMethod && methodType !== 'CARD' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Phone Number</label>
              <InternationalPhoneInput
                defaultIso2={payCountry}
                dark={actualTheme === 'dark'}
                ariaLabel="Mobile money phone number"
                onChange={(value) => setPhone(value)}
              />
            </div>
          )}

          {error && <p style={{ color: colors.statusError, fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setStep('form'); setError(''); }} style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${colors.borderPrimary}`, background: 'transparent',
              color: colors.textSecondary, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>
              Back
            </button>
            <button onClick={handlePay} disabled={loading || !paymentMethod} style={{
              flex: 2, padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600,
              background: paymentMethod ? accent : colors.bgTertiary, color: paymentMethod ? '#fff' : colors.textTertiary,
              cursor: paymentMethod && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : 'Pay Now'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ POLLING STEP ═══════ */}
      {step === 'polling' && (
        <div style={{
          background: colors.bgSecondary, borderRadius: '16px', padding: '40px 28px', textAlign: 'center',
          border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard,
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: `3px solid ${accent}`, borderTopColor: 'transparent', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>Processing Payment</h3>
          <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
            {paymentMethod === 'card'
              ? 'Complete the payment in the new tab. This page will update automatically.'
              : 'Please check your phone and approve the payment prompt. This page will update automatically.'}
          </p>
          {paymentUrl && paymentMethod === 'card' && (
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '12px', color: accent, fontSize: '13px', fontWeight: 600 }}>
              Open payment page again
            </a>
          )}
        </div>
      )}

      {/* ═══════ SUCCESS STEP ═══════ */}
      {step === 'success' && (
        <div style={{
          background: colors.bgSecondary, borderRadius: '16px', padding: '40px 28px', textAlign: 'center',
          border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard,
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="bi bi-check-lg" style={{ fontSize: '28px', color: '#059669' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>Thank You!</h3>
          <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5, marginBottom: '20px' }}>
            Your donation has been received. You are making a real difference in someone&apos;s life.
          </p>
          <button onClick={resetAll} style={{
            padding: '12px 28px', borderRadius: '12px', border: 'none', background: accent, color: '#fff',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Make Another Donation
          </button>
        </div>
      )}

      {/* ═══════ FAILED STEP ═══════ */}
      {step === 'failed' && (
        <div style={{
          background: colors.bgSecondary, borderRadius: '16px', padding: '40px 28px', textAlign: 'center',
          border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard,
        }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="bi bi-x-lg" style={{ fontSize: '24px', color: '#dc2626' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>Payment Failed</h3>
          <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5, marginBottom: '20px' }}>
            {error || 'The payment could not be completed. Please try again.'}
          </p>
          <button onClick={resetAll} style={{
            padding: '12px 28px', borderRadius: '12px', border: 'none', background: accent, color: '#fff',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Try Again
          </button>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
        </div>
      </div>
    </div>
  );
}
