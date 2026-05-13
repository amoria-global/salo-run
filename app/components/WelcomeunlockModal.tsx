"use client";

import React from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

interface WelcomeUnlockModalProps {
  title: string;
  description: string;
  onYes?: boolean | (() => void);
  onNo?: boolean | (() => void);
  onCancel: () => void;
  onContinueToPayment: () => void;
}

export default function WelcomeunlockModal({
  title,
  description,
  onCancel,
  onContinueToPayment,
}: WelcomeUnlockModalProps): React.JSX.Element | null {
  return (
    <Modal
      isOpen
      onClose={onCancel}
      size="sm"
      hideClose
      title={title}
      description={description}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <Button variant="primary" fullWidth onClick={onContinueToPayment} iconRight={<i className="bi bi-arrow-right" />}>
            Yes, continue to payment
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 9999,
          background: 'linear-gradient(135deg, #083A85 0%, #0d4ea8 100%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          margin: '4px auto 0',
          boxShadow: '0 6px 20px rgba(8, 58, 133, 0.30)',
        }}>
          <i className="bi bi-check-lg" style={{ fontSize: 28, color: '#fff' }} />
        </div>
      </div>
    </Modal>
  );
}
