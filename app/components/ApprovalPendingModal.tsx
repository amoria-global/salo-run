"use client";

import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth } from "../providers/AuthProvider";

interface ApprovalPendingModalProps {
  isOpen: boolean;
}

export default function ApprovalPendingModal({ isOpen }: ApprovalPendingModalProps) {
  const { colors, actualTheme } = useTheme();
  const { logout } = useDashboardAuth();

  if (!isOpen) return null;

  const handleOkay = () => {
    logout();
  };

  return (
    <div
      style={{
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: "0.75rem",
          padding: "1.75rem",
          maxWidth: "420px",
          width: "90%",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: actualTheme === "dark" ? "#3B2E1A" : "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <i
            className="bi bi-hourglass-split"
            style={{ fontSize: "28px", color: "#D97706" }}
          ></i>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            color: colors.textPrimary,
            margin: "0 0 0.5rem",
          }}
        >
          Account Pending Approval
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: "0.85rem",
            color: colors.textSecondary,
            margin: "0 0 1.5rem",
            lineHeight: "1.5",
          }}
        >
          Your account is currently under review. Please wait for admin approval
          before accessing the platform.
        </p>

        {/* Okay Button */}
        <button
          onClick={handleOkay}
          style={{
            width: "100%",
            padding: "0.625rem",
            border: "none",
            borderRadius: "0.5rem",
            backgroundColor: "#083A85",
            color: "white",
            fontSize: "0.9rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Okay
        </button>
      </div>
    </div>
  );
}
