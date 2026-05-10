"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

interface PendingDeclaration {
  id: string;
  eventName: string;
  amount: number;
  currency: string;
  dueDate: string;
  escrowPercentage: number;
  milestoneSequence: number;
  isOverdue: boolean;
}

interface PendingMilestonePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingMilestonePaymentModal({ isOpen, onClose }: PendingMilestonePaymentModalProps) {
  const { colors, actualTheme } = useTheme();
  const [pendingPayments, setPendingPayments] = useState<PendingDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending payments when modal opens
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/payments/pending-declarations`);
        const data = await res.json();
        if (data.action === 1) {
          setPendingPayments(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch pending payments:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen || loading || pendingPayments.length === 0) return null;

  const firstPayment = pendingPayments[0];
  const remainingCount = pendingPayments.length - 1;
  const isOverdue = firstPayment.isOverdue;

  return (
    // Fixed overlay with blur backdrop
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: "0.75rem",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
        }}
      >
        {/* Icon Circle */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: isOverdue
            ? (actualTheme === "dark" ? "#7F1D1D" : "#FEE2E2")
            : (actualTheme === "dark" ? "#78350F" : "#FEF3C7"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}>
          <i
            className={isOverdue ? "bi bi-exclamation-triangle-fill" : "bi bi-clock-history"}
            style={{
              fontSize: "32px",
              color: isOverdue ? "#DC2626" : "#F59E0B"
            }}
          />
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: "1.35rem",
          fontWeight: "700",
          color: colors.textPrimary,
          margin: "0 0 1rem",
        }}>
          {isOverdue ? "Payment Overdue" : "Payment Required"}
        </h3>

        {/* Payment Details */}
        <div style={{
          backgroundColor: actualTheme === "dark" ? "#1E293B" : "#F8FAFC",
          border: `1.5px solid ${colors.borderPrimary}`,
          borderRadius: "0.5rem",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          textAlign: "left",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
          }}>
            <span style={{
              fontSize: "0.875rem",
              color: colors.textSecondary,
            }}>Event</span>
            <span style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: colors.textPrimary,
            }}>{firstPayment.eventName}</span>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
          }}>
            <span style={{
              fontSize: "0.875rem",
              color: colors.textSecondary,
            }}>Amount Due</span>
            <span style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: isOverdue ? "#DC2626" : "#F59E0B",
            }}>
              {firstPayment.currency} {firstPayment.amount.toLocaleString()}
            </span>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}>
            <span style={{
              fontSize: "0.875rem",
              color: colors.textSecondary,
            }}>Milestone</span>
            <span style={{
              fontSize: "0.875rem",
              color: colors.textPrimary,
            }}>
              {firstPayment.milestoneSequence === 1 ? "First Payment" : "Second Payment"}
              {" "}({firstPayment.escrowPercentage}%)
            </span>
          </div>
        </div>

        {/* Additional Payments Indicator */}
        {remainingCount > 0 && (
          <p style={{
            fontSize: "0.875rem",
            color: colors.textSecondary,
            margin: "0 0 1.5rem",
            fontStyle: "italic",
          }}>
            + {remainingCount} more pending payment{remainingCount > 1 ? "s" : ""}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "0.75rem",
        }}>
          <button
            onClick={() => {
              window.location.href = '/client/payments';
            }}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "none",
              borderRadius: "0.5rem",
              backgroundColor: isOverdue ? "#DC2626" : "#F59E0B",
              color: "white",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Pay Now
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.25rem",
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: "0.5rem",
              backgroundColor: "transparent",
              color: colors.textSecondary,
              fontSize: "1rem",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
