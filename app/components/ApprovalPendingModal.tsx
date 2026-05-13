"use client";

import { useDashboardAuth } from "../providers/AuthProvider";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

interface ApprovalPendingModalProps {
  isOpen: boolean;
  profileCompletion?: number;
}

export default function ApprovalPendingModal({ isOpen, profileCompletion = 0 }: ApprovalPendingModalProps) {
  const { logout } = useDashboardAuth();

  if (!isOpen) return null;

  const isIncomplete = profileCompletion < 90;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => logout()}
      hideClose
      size="md"
      lockBackdrop
      title={isIncomplete ? 'Profile saved successfully' : 'Profile submitted for review'}
      footer={<Button variant="primary" fullWidth onClick={() => logout()}>Okay</Button>}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 9999,
          background: isIncomplete ? '#FEF3C7' : '#EFF6FF',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          margin: '4px auto 16px',
        }}>
          <i className={`bi ${isIncomplete ? 'bi-check-circle' : 'bi-hourglass-split'}`}
            style={{ fontSize: 28, color: isIncomplete ? '#16A34A' : '#2563EB' }} />
        </div>
      </div>

      {isIncomplete ? (
        <>
          <p style={{ margin: '0 0 14px', color: 'var(--ck-text-soft)', lineHeight: 1.6 }}>
            Your progress has been saved. Your profile is currently at <strong style={{ color: 'var(--ck-text)' }}>{profileCompletion}%</strong> completion.
          </p>
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: 16,
            marginBottom: 14,
          }}>
            <p style={{ margin: '0 0 6px', color: '#D97706', fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="bi bi-info-circle" /> To activate your account
            </p>
            <p style={{ margin: 0, color: '#92400E', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Complete at least <strong>90%</strong> of your profile: bio, specialties, equipment, skills, education, and work experience. Once you reach 90%, your profile will be submitted for review.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--ck-text-soft)' }}>
            You can log back in anytime to continue filling out your profile.
          </p>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 14px', color: 'var(--ck-text-soft)', lineHeight: 1.6 }}>
            Great job! Your profile is at <strong style={{ color: 'var(--ck-text)' }}>{profileCompletion}%</strong> and has been submitted for review.
          </p>
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 12,
            padding: 16,
            marginBottom: 14,
          }}>
            <p style={{ margin: '0 0 6px', color: '#2563EB', fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="bi bi-clock-history" /> What happens next?
            </p>
            <p style={{ margin: 0, color: '#1E40AF', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Our team will review your profile to verify your credentials and ensure quality standards. This typically takes <strong>a few hours</strong>. You'll be notified once your account is approved.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--ck-text-soft)' }}>
            Once approved, you'll be able to receive event bookings and connect with clients.
          </p>
        </>
      )}
    </Modal>
  );
}
