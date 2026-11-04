'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import OtpInput from './OtpInput';
import {
  attemptsText,
  formatCountdown,
  groupKey,
  localDeadline,
  lockText,
  OTP_LENGTH,
  refusalFrom,
  secondsLeft,
  sentFrom,
  type CodeRefusal,
} from '../lib/otp';

type Flow = 'totp-on' | 'totp-off' | 'email-on' | 'email-off';

export type TwoFactorStatus = {
  enabled: boolean;
  required: boolean;
  totpEnabled: boolean;
  emailEnabled: boolean;
  maskedEmail?: string;
};

type Theme = {
  colors: { textPrimary: string; textSecondary: string; borderPrimary: string; bgTertiary: string };
  dark: boolean;
};

/** Whole seconds left until a deadline, re-rendering once a second while it runs. */
function useCountdown(deadlineMs: number | null): number {
  const [, tick] = useState(0);
  useEffect(() => {
    if (deadlineMs == null) return;
    const id = setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= deadlineMs) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);
  return secondsLeft(deadlineMs);
}

/**
 * Sign-in methods card body: authenticator app, email code, or both. Every code is checked by the
 * server; this component collects it and shows the answer (tries left, lock time, resend wait).
 */
export default function TwoFactorMethods({
  theme,
  onStatus,
}: {
  theme: Theme;
  /** Tells the page what the account now has, so its badge and cached user stay right. */
  onStatus: (s: TwoFactorStatus) => void;
}) {
  const { colors, dark } = theme;
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [refusal, setRefusal] = useState<CodeRefusal | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [sentTo, setSentTo] = useState<string | undefined>();
  const submitting = useRef(false);

  const lockSeconds = useCountdown(lockedUntil);
  const resendSeconds = useCountdown(resendAt);
  const locked = lockSeconds > 0;

  const publish = useCallback(
    (s: TwoFactorStatus) => {
      setStatus(s);
      onStatus(s);
    },
    [onStatus],
  );

  const loadStatus = useCallback(async () => {
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/2fa/status`);
      if (!res.ok) return;
      const b = await res.json();
      if (b.action !== 1) return;
      publish({
        enabled: b.twoFactorEnabled === true,
        required: b.twoFactorRequired === true,
        totpEnabled: b.totpEnabled === true,
        emailEnabled: b.emailEnabled === true,
        maskedEmail: b.maskedEmail,
      });
    } catch {
      /* the card stays on its last state */
    }
  }, [publish]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const post = async (path: string, body?: unknown) => {
    const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res.json();
  };

  const clear = () => {
    setCode('');
    setRefusal(null);
    setNotice(null);
    setLockedUntil(null);
    setResendAt(null);
    setSentTo(undefined);
    setDone(false);
  };

  const refuse = (r: CodeRefusal) => {
    setRefusal(r);
    if (r.retryAfterSeconds) {
      const until = Date.now() + r.retryAfterSeconds * 1000;
      if (r.errorCode === 'LOCKED') setLockedUntil(until);
      else setResendAt(until);
    }
  };

  const sendEmail = async (purpose: 'ENABLE' | 'DISABLE') => {
    setBusy(true);
    setRefusal(null);
    try {
      const out = sentFrom(await post('2fa/email/send', { purpose }), 'We could not send a code. Try again.');
      if ('sent' in out) {
        setResendAt(localDeadline(out.sent.resendAvailableAt, out.sent.serverTime, Date.now()));
        setSentTo(out.sent.maskedEmail);
      } else {
        refuse(out.refused);
      }
    } catch {
      setRefusal(refusalFrom(null, 'We could not send a code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const open = async (next: Flow) => {
    clear();
    setFlow(next);
    if (next === 'totp-on') {
      setBusy(true);
      try {
        const b = await post('totp/setup');
        if (b.qrCode || b.secret) {
          setQr(b.qrCode ?? '');
          setSecret(b.secret ?? '');
        } else {
          setFlow(null);
          setNotice({ text: b.message || 'Failed to start setup', ok: false });
        }
      } catch {
        setFlow(null);
        setNotice({ text: 'Failed to start setup', ok: false });
      } finally {
        setBusy(false);
      }
    } else if (next === 'email-on') {
      await sendEmail('ENABLE');
    } else if (next === 'email-off') {
      await sendEmail('DISABLE');
    }
  };

  const close = () => {
    clear();
    setFlow(null);
    setQr('');
    setSecret('');
  };

  const submit = async (value: string) => {
    if (!flow || submitting.current || locked || value.length !== OTP_LENGTH) return;
    submitting.current = true;
    setBusy(true);
    setRefusal(null);
    const path = { 'totp-on': 'totp/enable', 'totp-off': 'totp/disable', 'email-on': '2fa/email/enable', 'email-off': '2fa/email/disable' }[flow];
    try {
      const b = await post(path, { code: value });
      if (b.action === 1) {
        setDone(true);
        const wasOn = flow.endsWith('-on');
        await loadStatus();
        setNotice({
          text: wasOn ? 'Two-factor authentication is on.' : 'That sign-in method is now off.',
          ok: true,
        });
        setFlow(null);
        setQr('');
        setSecret('');
        setCode('');
        setDone(false);
      } else {
        setCode('');
        setShakeKey((k) => k + 1);
        refuse(refusalFrom(b, 'That code is not right.'));
      }
    } catch {
      setCode('');
      setShakeKey((k) => k + 1);
      setRefusal(refusalFrom(null, 'Something went wrong. Try again.'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const border = colors.borderPrimary;
  const isEmail = flow === 'email-on' || flow === 'email-off';
  const turningOn = flow === 'totp-on' || flow === 'email-on';
  // Turning off the only method pauses withdrawals; turning one off while another stays on does not.
  const lastMethod = !!status && (flow === 'totp-off' ? !status.emailEnabled : flow === 'email-off' ? !status.totpEnabled : false);
  const error = locked ? lockText(lockSeconds) : refusal?.message;
  const hint = !locked && refusal ? attemptsText(refusal.attemptsLeft) : undefined;

  const row = (icon: string, title: string, text: string, on: boolean, off: Flow, on_: Flow) => (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 1rem', borderRadius: 12,
        border: `1px solid ${border}`, background: colors.bgTertiary, flexWrap: 'wrap',
      }}
    >
      <i className={`bi ${icon}`} aria-hidden style={{ fontSize: 20, color: on ? '#16A34A' : '#083A85' }} />
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: colors.textPrimary }}>
          {title}{' '}
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: on ? '#166534' : colors.textSecondary }}>{on ? 'ON' : 'OFF'}</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: colors.textSecondary }}>{text}</div>
      </div>
      <button
        onClick={() => open(on ? off : on_)}
        disabled={busy}
        className={on ? 'ck-btn ck-btn-soft' : 'ck-btn ck-btn-primary'}
        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: on ? '#DC2626' : undefined, opacity: busy ? 0.6 : 1 }}
      >
        {on ? 'Turn off' : 'Set up'}
      </button>
    </div>
  );

  return (
    <div>
      {status?.required && !status.enabled && !flow ? (
        <div
          role="status"
          style={{
            padding: '0.85rem 1rem', borderRadius: 11, marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.5,
            background: dark ? 'rgba(245,158,11,0.10)' : '#FFFBEB',
            border: `1px solid ${dark ? 'rgba(245,158,11,0.32)' : '#FDE68A'}`,
            color: dark ? '#FCD34D' : '#92400E',
          }}
        >
          Your wallet has funds. Turn on two-factor authentication to withdraw them.
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.85rem',
            background: notice.ok ? (dark ? 'rgba(22,163,74,0.14)' : '#DCFCE7') : (dark ? 'rgba(220,38,38,0.14)' : '#FEE2E2'),
            color: notice.ok ? (dark ? '#4ADE80' : '#166534') : (dark ? '#FCA5A5' : '#991B1B'),
          }}
        >
          {notice.text}
        </div>
      ) : null}

      {!status ? (
        <div style={{ height: 120, borderRadius: 12, background: colors.bgTertiary, opacity: 0.6 }} aria-busy="true" />
      ) : !flow ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {row('bi-phone', 'Authenticator app', 'A code from an app like Google Authenticator or Authy', status.totpEnabled, 'totp-off', 'totp-on')}
          {row('bi-envelope', 'Email code', status.maskedEmail ? `A code sent to ${status.maskedEmail}` : 'A code sent to your email', status.emailEnabled, 'email-off', 'email-on')}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {!turningOn && lastMethod ? (
            <div
              role="alert"
              style={{
                padding: '0.85rem 1rem', borderRadius: 11, fontSize: '0.85rem', lineHeight: 1.5,
                background: dark ? 'rgba(220,38,38,0.12)' : '#FEF2F2',
                border: `1px solid ${dark ? 'rgba(220,38,38,0.35)' : '#FECACA'}`,
                color: dark ? '#FCA5A5' : '#991B1B',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 2 }}>Turning this off will disable withdrawals</strong>
              It is your only sign-in method. Two-factor authentication protects the money in your wallet, so you will not be able to
              withdraw until you turn a method back on. Your balance stays safe.
            </div>
          ) : null}

          <p style={{ margin: 0, fontSize: '0.9rem', color: colors.textSecondary }}>
            {isEmail
              ? `We sent a 6-digit code to ${sentTo ?? status.maskedEmail ?? 'your email'}.`
              : flow === 'totp-off'
                ? 'Enter a code from your authenticator app to turn it off.'
                : 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
          </p>

          {flow === 'totp-on' && qr ? (
            <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
              <div style={{ padding: '0.75rem', background: '#fff', borderRadius: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code for your authenticator app" style={{ width: 200, height: 200 }} />
              </div>
              {secret ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: 6 }}>Or enter this key manually:</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <code
                      aria-label={`Setup key ${groupKey(secret)}`}
                      style={{
                        padding: '0.5rem 0.9rem', borderRadius: 8, border: `1px solid ${border}`, background: colors.bgTertiary,
                        color: colors.textPrimary, fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.92rem', userSelect: 'all',
                      }}
                    >
                      {groupKey(secret)}
                    </code>
                    <button
                      type="button"
                      className="ck-btn ck-btn-soft"
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(secret);
                          setNotice({ text: 'Key copied to the clipboard.', ok: true });
                        } catch {
                          setNotice({ text: 'Could not copy. Select the key and copy it by hand.', ok: false });
                        }
                      }}
                    >
                      <i className="bi bi-clipboard" aria-hidden /> Copy
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <OtpInput
            id="twofactor-code"
            label={turningOn && !isEmail ? 'Enter the 6-digit code from your app' : '6-digit code'}
            value={code}
            onChange={setCode}
            onComplete={submit}
            error={error}
            hint={hint}
            busy={busy}
            success={done}
            disabled={locked}
            shakeKey={shakeKey}
            colors={{ border, bg: colors.bgTertiary, text: colors.textPrimary, muted: colors.textSecondary }}
          />

          {isEmail ? (
            <button
              type="button"
              onClick={() => sendEmail(flow === 'email-on' ? 'ENABLE' : 'DISABLE')}
              disabled={resendSeconds > 0 || busy || locked}
              style={{
                background: 'none', border: 'none', padding: 4, fontSize: '0.85rem', fontWeight: 600,
                color: resendSeconds > 0 || locked ? colors.textSecondary : '#083A85',
                cursor: resendSeconds > 0 || locked ? 'not-allowed' : 'pointer',
              }}
            >
              {resendSeconds > 0 ? `Resend code in ${formatCountdown(resendSeconds)}` : 'Resend code'}
            </button>
          ) : null}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => submit(code)}
              disabled={busy || locked || code.length !== OTP_LENGTH}
              className="ck-btn ck-btn-primary"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem', opacity: busy || locked || code.length !== OTP_LENGTH ? 0.6 : 1 }}
            >
              {busy ? 'Checking…' : turningOn ? 'Verify & turn on' : 'Confirm turn off'}
            </button>
            <button onClick={close} disabled={busy} className="ck-btn ck-btn-soft" style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
