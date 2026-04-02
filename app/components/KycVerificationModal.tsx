"use client";
import React, { useState, useEffect, useRef } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  colors: Record<string, string>;
  actualTheme: string;
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function KycVerificationModal({ isOpen, onClose, onSuccess, colors, actualTheme }: KycVerificationModalProps) {
  const [step, setStep] = useState<'form' | 'uploading' | 'success' | 'failed'>('form');
  const [error, setError] = useState('');

  const [fullLegalName, setFullLegalName] = useState('');
  const [gender, setGender] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [govIdPreview, setGovIdPreview] = useState('');

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const govIdInputRef = useRef<HTMLInputElement>(null);

  // Load existing KYC data if rejected (for resubmission)
  const [existingKyc, setExistingKyc] = useState<{
    status: string;
    reviewComment?: string;
    fullLegalName?: string;
    gender?: string;
    locationAddress?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setError('');
    setSelfiePhoto(null);
    setSelfiePreview('');
    setGovernmentId(null);
    setGovIdPreview('');

    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/status`)
      .then(res => res.json())
      .then(data => {
        if (data.action === 1 && data.data?.latestSubmission) {
          const sub = data.data.latestSubmission;
          setExistingKyc({
            status: sub.status,
            reviewComment: sub.reviewComment,
            fullLegalName: sub.fullLegalName,
            gender: sub.gender,
            locationAddress: sub.locationAddress,
          });
          if (sub.status === 'REJECTED') {
            setFullLegalName(sub.fullLegalName || '');
            setGender(sub.gender || '');
            setLocationAddress(sub.locationAddress || '');
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfiePhoto(file);
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGovIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGovernmentId(file);
    if (file.type === 'application/pdf') {
      setGovIdPreview('pdf');
    } else {
      const reader = new FileReader();
      reader.onload = () => setGovIdPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!fullLegalName.trim()) { setError('Full legal name is required'); return; }
    if (!gender) { setError('Gender is required'); return; }
    if (!selfiePhoto) { setError('Selfie photo is required'); return; }
    if (!governmentId) { setError('Government ID document is required'); return; }

    setError('');
    setStep('uploading');

    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('fullLegalName', fullLegalName.trim());
      formData.append('gender', gender);
      if (locationAddress.trim()) formData.append('locationAddress', locationAddress.trim());
      formData.append('selfiePhoto', selfiePhoto);
      formData.append('governmentIdDocument', governmentId);

      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/submit`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.action === 1) {
        setStep('success');
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to submit KYC verification');
        setStep('failed');
      }
    } catch {
      setError('Network error. Please try again.');
      setStep('failed');
    }
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`,
    borderRadius: '0.75rem', fontSize: '0.9rem', color: colors.textPrimary,
    outline: 'none', backgroundColor: colors.bgCard, boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: '600',
    color: colors.textPrimary, marginBottom: '0.5rem',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div className="mobile-modal" style={{
        backgroundColor: colors.bgCard, borderRadius: '1rem', width: '560px', maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 0 1.5rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ color: '#083A85' }}><ShieldIcon /></div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                KYC Verification
              </h3>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: '0.15rem 0 0 0' }}>
                Verify your identity to enable withdrawals
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, cursor: 'pointer',
            padding: '0.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: colors.textPrimary,
          }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.5rem' }}>
                KYC Submitted Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Your KYC verification is under review. You will be notified once it has been approved.
              </p>
              <button onClick={onClose} style={{
                padding: '0.875rem 2rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
              }}>Done</button>
            </div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Submission Failed
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#DC2626', marginBottom: '1.5rem', lineHeight: '1.5' }}>{error}</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={() => setStep('form')} style={{
                  padding: '0.875rem 1.5rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                  background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                }}>Try Again</button>
                <button onClick={onClose} style={{
                  padding: '0.875rem 1.5rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem',
                  background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                }}>Close</button>
              </div>
            </div>
          )}

          {/* Uploading */}
          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{
                width: '48px', height: '48px', border: '3px solid #E5E7EB',
                borderTopColor: '#083A85', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto 1.25rem',
              }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '0.35rem' }}>
                Submitting KYC Verification
              </p>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Uploading your documents...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Form */}
          {step === 'form' && (
            <>
              {/* Rejection notice */}
              {existingKyc?.status === 'REJECTED' && existingKyc.reviewComment && (
                <div style={{
                  padding: '0.875rem 1rem', marginBottom: '1.25rem', borderRadius: '0.75rem',
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#DC2626', margin: '0 0 0.25rem 0' }}>
                    Previous submission rejected
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#991B1B', margin: 0, lineHeight: '1.4' }}>
                    {existingKyc.reviewComment}
                  </p>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.5rem',
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  color: '#DC2626', fontSize: '0.85rem',
                }}>{error}</div>
              )}

              {/* Full Legal Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Full Legal Name *</label>
                <input type="text" placeholder="As it appears on your ID" value={fullLegalName}
                  onChange={e => setFullLegalName(e.target.value)} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                />
              </div>

              {/* Gender */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Gender *</label>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Location / Address</label>
                <input type="text" placeholder="City, Country" value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                />
              </div>

              {/* Selfie Photo */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Selfie Photo *</label>
                <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.5rem 0' }}>
                  Take a clear photo of yourself
                </p>
                <input ref={selfieInputRef} type="file" accept="image/jpeg,image/png,image/jpg"
                  onChange={handleSelfieChange} style={{ display: 'none' }} />
                {selfiePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={selfiePreview} alt="Selfie preview"
                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '0.75rem', border: `2px solid ${colors.borderPrimary}` }} />
                    <button onClick={() => selfieInputRef.current?.click()} style={{
                      position: 'absolute', bottom: '8px', right: '8px', padding: '0.35rem 0.75rem',
                      background: '#083A85', color: 'white', border: 'none', borderRadius: '0.5rem',
                      fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                    }}>Change</button>
                  </div>
                ) : (
                  <button onClick={() => selfieInputRef.current?.click()} style={{
                    width: '100%', padding: '1.5rem', border: `2px dashed ${colors.borderPrimary}`,
                    borderRadius: '0.75rem', background: 'transparent', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    color: colors.textSecondary,
                  }}>
                    <CameraIcon />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Click to upload selfie</span>
                    <span style={{ fontSize: '0.7rem' }}>JPEG, PNG</span>
                  </button>
                )}
              </div>

              {/* Government ID */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Government ID *</label>
                <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.5rem 0' }}>
                  Passport, National ID, or Driver&#39;s License
                </p>
                <input ref={govIdInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleGovIdChange} style={{ display: 'none' }} />
                {govIdPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {govIdPreview === 'pdf' ? (
                      <div style={{
                        padding: '1.25rem', border: `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#DC2626" strokeWidth="2"/></svg>
                        <span style={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: '500' }}>{governmentId?.name}</span>
                      </div>
                    ) : (
                      <img src={govIdPreview} alt="Government ID preview"
                        style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '0.75rem', border: `2px solid ${colors.borderPrimary}` }} />
                    )}
                    <button onClick={() => govIdInputRef.current?.click()} style={{
                      position: 'absolute', bottom: '8px', right: '8px', padding: '0.35rem 0.75rem',
                      background: '#083A85', color: 'white', border: 'none', borderRadius: '0.5rem',
                      fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                    }}>Change</button>
                  </div>
                ) : (
                  <button onClick={() => govIdInputRef.current?.click()} style={{
                    width: '100%', padding: '1.5rem', border: `2px dashed ${colors.borderPrimary}`,
                    borderRadius: '0.75rem', background: 'transparent', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    color: colors.textSecondary,
                  }}>
                    <DocumentIcon />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Click to upload ID document</span>
                    <span style={{ fontSize: '0.7rem' }}>JPEG, PNG, or PDF</span>
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button onClick={handleSubmit} disabled={!fullLegalName || !gender || !selfiePhoto || !governmentId}
                style={{
                  width: '100%', padding: '0.875rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                  background: (!fullLegalName || !gender || !selfiePhoto || !governmentId) ? '#9CA3AF' : '#083A85',
                  color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: (!fullLegalName || !gender || !selfiePhoto || !governmentId) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'background 0.2s',
                }}>
                <ShieldIcon />
                Submit KYC Verification
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
