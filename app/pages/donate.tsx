'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/sidebar';
import Topbar from '../components/topbar';
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
import { Card, Button } from '../components/ui';

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
  const { user } = useDashboardAuth();

  const [tiers, setTiers] = useState<number[]>(FALLBACK_TIERS);
  const [exchangeRates, setExchangeRates] = useState<Record<string, ExchangeRate>>({});
  const [baseCurrency, setBaseCurrency] = useState('RWF');
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);

  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [currency, setCurrency] = useState('RWF');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [step, setStep] = useState<Step>('form');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [donationId, setDonationId] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const stopPollingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      setDonorName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setDonorEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    getDonationTiers().then(res => {
      if (res.success && res.data) {
        if (res.data.tiers?.length) setTiers(res.data.tiers.map(t => t.amount));
        if (res.data.baseCurrency) setBaseCurrency(res.data.baseCurrency);
      }
    });
  }, []);

  useEffect(() => { getCurrencyRates().then(res => { if (res.success && res.data) setExchangeRates(res.data); }); }, []);
  useEffect(() => { getCurrencies().then(res => { if (res.success && res.data) setCurrencies(res.data); }); }, []);

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

  const currencyList = Object.keys(exchangeRates).length > 0
    ? Object.keys(exchangeRates)
    : currencies.map(c => c.code).filter(Boolean);
  if (!currencyList.includes(baseCurrency)) currencyList.unshift(baseCurrency);

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

  const handlePay = async () => {
    if (!paymentMethod) { setError('Please select a payment method'); return; }
    if (paymentMethod !== 'card' && !phone.trim()) { setError('Please enter your phone number'); return; }
    setLoading(true);
    setError('');
    try {
      const telecom = paymentMethod === 'mtn' ? 'MTN' : paymentMethod === 'airtel' ? 'AIRTEL' : '';
      const method = paymentMethod === 'card' ? 'CARD' : 'MOBILE_MONEY';
      const res = await initiateDonationPayment({
        donationId,
        phone: phone || undefined,
        telecomProvider: telecom || undefined,
        paymentMethod: method,
        redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to initiate payment');
      if (res.data.paymentUrl) setPaymentUrl(res.data.paymentUrl);
      setStep('polling');
      stopPollingRef.current = pollDonationStatus(res.data.refid, {
        onSuccess: () => setStep('success'),
        onFailure: () => setStep('failed'),
        onError: (err) => { setError(err); setStep('failed'); },
      });
      if (res.data.paymentUrl && paymentMethod === 'card') {
        window.open(res.data.paymentUrl, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
    setPhone('');
    setError('');
    setDonationId('');
    setPaymentUrl('');
    if (stopPollingRef.current) stopPollingRef.current();
  };

  const stepIndex = { form: 0, payment: 1, polling: 2, success: 3, failed: 3 }[step];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ck-surface-soft)', width: '100%', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <main className="ck-page" style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* Hero — gradient banner with eyebrow + heart tile */}
            <section className="ck-fade-in-up" style={{
              position: 'relative',
              borderRadius: 20,
              padding: '32px 28px 28px',
              background: 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.08) 100%)',
              border: '1px solid var(--ck-stroke)',
              marginBottom: 22,
              overflow: 'hidden',
              textAlign: 'center',
            }}>
              {/* gradient stripe */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              }} />
              {/* decorative pink glow */}
              <div style={{
                position: 'absolute', top: -80, right: -60,
                width: 220, height: 220, borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(242,12,143,0.18), rgba(242,12,143,0))',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 9999,
                  background: 'linear-gradient(135deg, #F20C8F 0%, #ff4fae 100%)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  boxShadow: '0 12px 28px rgba(242, 12, 143, 0.32)',
                }}>
                  <i className="bi bi-heart-fill" style={{ fontSize: 28, color: '#fff' }} />
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#F20C8F',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>Give back</div>
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(1.85rem, 3.5vw, 2.25rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--ck-text)',
                  lineHeight: 1.05,
                }}>
                  Support a <span className="ck-gradient-text">cause</span>
                </h1>
                <p style={{
                  margin: '10px auto 0',
                  color: 'var(--ck-text-soft)',
                  fontSize: '0.96rem',
                  maxWidth: 480,
                  lineHeight: 1.5,
                }}>
                  Your donation helps support vulnerable families, educate children, and empower those in need.
                </p>
              </div>
            </section>

            {/* Progress rail */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 18,
              padding: '14px 16px',
              background: 'var(--ck-surface)',
              border: '1px solid var(--ck-stroke)',
              borderRadius: 12,
              boxShadow: 'var(--ck-shadow-sm)',
            }}>
              {[
                { label: 'Donation', icon: 'bi-heart' },
                { label: 'Payment', icon: 'bi-credit-card' },
                { label: 'Confirm', icon: 'bi-check2-circle' },
              ].map(({ label, icon }, i) => {
                const reachedIndex = step === 'success' ? 3 : stepIndex >= 2 ? 2 : stepIndex;
                const active = i === Math.min(reachedIndex, 2);
                const completed = i < reachedIndex;
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      height: 3,
                      borderRadius: 9999,
                      background: completed || active ? 'linear-gradient(90deg, #083A85, #F20C8F)' : 'var(--ck-stroke)',
                      opacity: active && !completed ? 1 : completed ? 0.6 : 1,
                    }} />
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: active ? 'var(--ck-blue)' : completed ? 'var(--ck-text-soft)' : 'var(--ck-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      <i className={`bi ${icon}`} style={{ fontSize: 12 }} />
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FORM */}
            {step === 'form' && (
              <Card padding={24}>
                <Section label="Donation category">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {CATEGORIES.map((cat, i) => {
                      const selected = activeCategory === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveCategory(i)}
                          style={{
                            padding: 16, borderRadius: 12,
                            border: '1px solid',
                            borderColor: selected ? '#F20C8F' : 'var(--ck-stroke)',
                            background: selected ? 'rgba(242,12,143,0.05)' : 'var(--ck-surface)',
                            textAlign: 'left', cursor: 'pointer',
                            transition: 'all 180ms var(--ck-ease)',
                            boxShadow: selected ? '0 0 0 3px rgba(242,12,143,0.10)' : 'none',
                            position: 'relative',
                          }}
                        >
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: selected ? 'rgba(242,12,143,0.10)' : 'var(--ck-surface-muted)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 10,
                            transition: 'background 180ms',
                          }}>
                            <i className={`bi ${cat.icon}`} style={{
                              fontSize: 17,
                              color: selected ? '#F20C8F' : 'var(--ck-text-soft)',
                            }} />
                          </div>
                          {selected && (
                            <div style={{
                              position: 'absolute', top: 12, right: 12,
                              width: 20, height: 20, borderRadius: 9999,
                              background: '#F20C8F',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff',
                            }}>
                              <i className="bi bi-check-lg" style={{ fontSize: 11 }} />
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.94rem',
                            fontWeight: 700,
                            letterSpacing: '-0.005em',
                            color: selected ? '#F20C8F' : 'var(--ck-text)',
                          }}>{cat.title}</div>
                          <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--ck-text-soft)',
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}>{cat.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {currencyList.length > 1 && (
                  <Section label="Currency">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {currencyList.slice(0, 6).map(code => (
                        <button
                          key={code}
                          onClick={() => { setCurrency(code); setCustomAmount(''); }}
                          style={{
                            padding: '7px 14px', borderRadius: 9,
                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${currency === code ? 'var(--ck-pink)' : 'var(--ck-stroke)'}`,
                            background: currency === code ? 'rgba(242,12,143,0.08)' : 'var(--ck-surface)',
                            color: currency === code ? 'var(--ck-pink)' : 'var(--ck-text-soft)',
                          }}
                        >{code}</button>
                      ))}
                    </div>
                  </Section>
                )}

                <Section label="Amount">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {tiers.map(tier => {
                      const converted = convert(tier);
                      const active = !isCustom && selectedTier === tier;
                      return (
                        <button
                          key={tier}
                          onClick={() => { setSelectedTier(tier); setIsCustom(false); setCustomAmount(''); }}
                          style={{
                            padding: '13px 12px', borderRadius: 10,
                            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                            border: `2px solid ${active ? 'var(--ck-blue)' : 'var(--ck-stroke)'}`,
                            background: active ? 'rgba(8,58,133,0.06)' : 'var(--ck-surface)',
                            color: active ? 'var(--ck-blue)' : 'var(--ck-text)',
                          }}
                        >{formatAmt(converted)}</button>
                      );
                    })}
                  </div>
                  <div
                    onClick={() => { setIsCustom(true); setSelectedTier(null); }}
                    style={{
                      marginTop: 10,
                      display: 'flex', alignItems: 'center',
                      border: `2px solid ${isCustom ? 'var(--ck-blue)' : 'var(--ck-stroke)'}`,
                      borderRadius: 10, overflow: 'hidden',
                      background: isCustom ? 'rgba(8,58,133,0.04)' : 'var(--ck-surface)',
                    }}
                  >
                    <span style={{ padding: '11px 14px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--ck-text-soft)', background: 'var(--ck-surface-muted)', borderRight: '1px solid var(--ck-stroke)' }}>
                      {currency}
                    </span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setIsCustom(true); setSelectedTier(null); }}
                      onFocus={() => { setIsCustom(true); setSelectedTier(null); }}
                      style={{ flex: 1, padding: '11px 14px', border: 'none', outline: 'none', fontSize: '0.95rem', fontWeight: 600, background: 'transparent', color: 'var(--ck-text)' }}
                      min="1"
                    />
                  </div>
                </Section>

                <hr className="ck-divider" style={{ margin: '20px 0' }} />

                <Section label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Your information</span>
                    <button
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 12px',
                        borderRadius: 9999,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: `1px solid ${isAnonymous ? 'var(--ck-pink)' : 'var(--ck-stroke)'}`,
                        background: isAnonymous ? 'var(--ck-pink)' : 'transparent',
                        color: isAnonymous ? '#fff' : 'var(--ck-text-soft)',
                      }}
                    >{isAnonymous ? 'Anonymous' : 'Make anonymous'}</button>
                  </div>
                }>
                  {!isAnonymous && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input className="ck-input" type="text" placeholder="Full name" value={donorName} onChange={e => setDonorName(e.target.value)} />
                      <input className="ck-input" type="email" placeholder="Email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} />
                    </div>
                  )}
                </Section>

                <Section label="Message (optional)">
                  <textarea
                    className="ck-input"
                    placeholder="Share why you're donating…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </Section>

                {getAmount() > 0 && (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #BBF7D0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 14,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#065F46' }}>Total donation</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ck-pink)' }}>{formatAmt(getAmount())}</span>
                  </div>
                )}

                {error && (
                  <p style={{ color: '#DC2626', fontSize: '0.85rem', textAlign: 'center', marginBottom: 12, marginTop: 0 }}>{error}</p>
                )}

                <Button
                  variant="accent"
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={!canSubmit || loading}
                  onClick={handleSubmit}
                  iconLeft={<i className="bi bi-heart-fill" />}
                >Proceed to payment</Button>
              </Card>
            )}

            {/* PAYMENT */}
            {step === 'payment' && (
              <Card padding={24}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ck-text)' }}>Choose payment method</h3>
                <p style={{ margin: '4px 0 18px', fontSize: '0.85rem', color: 'var(--ck-text-soft)' }}>
                  Donation: <strong style={{ color: 'var(--ck-pink)' }}>{formatAmt(getAmount())}</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {[
                    { id: 'mtn', label: 'MTN Mobile Money', icon: 'bi-phone' },
                    { id: 'airtel', label: 'Airtel Money', icon: 'bi-phone' },
                    { id: 'card', label: 'Visa / Mastercard', icon: 'bi-credit-card' },
                  ].map(m => {
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          padding: '14px 16px', borderRadius: 12,
                          border: `2px solid ${active ? 'var(--ck-blue)' : 'var(--ck-stroke)'}`,
                          background: active ? 'rgba(8,58,133,0.06)' : 'var(--ck-surface)',
                          cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 12,
                          transition: 'all 180ms',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: active ? 'rgba(8,58,133,0.10)' : 'var(--ck-surface-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`bi ${m.icon}`} style={{ fontSize: 16, color: active ? 'var(--ck-blue)' : 'var(--ck-text-soft)' }} />
                        </div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: active ? 'var(--ck-blue)' : 'var(--ck-text)' }}>{m.label}</span>
                        {active && <i className="bi bi-check-circle-fill" style={{ marginLeft: 'auto', color: 'var(--ck-blue)' }} />}
                      </button>
                    );
                  })}
                </div>

                {paymentMethod && paymentMethod !== 'card' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ck-text-soft)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Phone number
                    </label>
                    <input className="ck-input" type="tel" placeholder="07XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                )}

                {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', textAlign: 'center', marginBottom: 12 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="ghost" onClick={() => { setStep('form'); setError(''); }} style={{ flex: 1 }}>
                    <i className="bi bi-arrow-left" /> Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handlePay}
                    disabled={loading || !paymentMethod}
                    loading={loading}
                    style={{ flex: 2 }}
                  >Pay now</Button>
                </div>
              </Card>
            )}

            {/* POLLING */}
            {step === 'polling' && (
              <Card padding={36} style={{ textAlign: 'center' }}>
                <span className="ck-spinner" style={{ width: 38, height: 38, margin: '0 auto 16px' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--ck-text)' }}>Processing payment</h3>
                <p style={{ margin: '8px 0 0', color: 'var(--ck-text-soft)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {paymentMethod === 'card'
                    ? 'Complete the payment in the new tab. This page will update automatically.'
                    : 'Please check your phone and approve the payment prompt. This page will update automatically.'}
                </p>
                {paymentUrl && paymentMethod === 'card' && (
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: 14, color: 'var(--ck-blue)', fontSize: '0.88rem', fontWeight: 600 }}>
                    Open payment page again →
                  </a>
                )}
              </Card>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <Card padding={36} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 9999,
                  background: '#ECFDF5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <i className="bi bi-check-lg" style={{ fontSize: 30, color: '#059669' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ck-text)' }}>Thank you!</h3>
                <p style={{ margin: '8px 0 22px', color: 'var(--ck-text-soft)' }}>
                  Your donation has been received. You're making a real difference in someone's life.
                </p>
                <Button variant="accent" onClick={resetAll}>Make another donation</Button>
              </Card>
            )}

            {/* FAILED */}
            {step === 'failed' && (
              <Card padding={36} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 9999,
                  background: '#FEF2F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <i className="bi bi-x-lg" style={{ fontSize: 26, color: '#DC2626' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--ck-text)' }}>Payment failed</h3>
                <p style={{ margin: '8px 0 22px', color: 'var(--ck-text-soft)' }}>
                  {error || 'The payment could not be completed. Please try again.'}
                </p>
                <Button variant="primary" onClick={resetAll}>Try again</Button>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const Section: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{
      fontSize: '0.78rem',
      fontWeight: 700,
      color: 'var(--ck-text-soft)',
      display: 'flex',
      alignItems: 'center',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>{label}</div>
    {children}
  </div>
);
