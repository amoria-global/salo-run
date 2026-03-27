"use client";

import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth } from "../providers/AuthProvider";

interface ApprovalPendingModalProps {
  isOpen: boolean;
  profileCompletion?: number;
}

export default function ApprovalPendingModal({ isOpen, profileCompletion = 0 }: ApprovalPendingModalProps) {
  const { colors, actualTheme } = useTheme();
  const { logout } = useDashboardAuth();

  if (!isOpen) return null;

  const isIncomplete = profileCompletion < 90;

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
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: isIncomplete
              ? (actualTheme === "dark" ? "#3B2E1A" : "#FEF3C7")
              : (actualTheme === "dark" ? "#1A2A4A" : "#DBEAFE"),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <i
            className={isIncomplete ? "bi bi-check-circle" : "bi bi-hourglass-split"}
            style={{ fontSize: "32px", color: isIncomplete ? "#16A34A" : "#2563EB" }}
          ></i>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.35rem",
            fontWeight: "700",
            color: colors.textPrimary,
            margin: "0 0 1rem",
          }}
        >
          {isIncomplete ? "Profile Saved Successfully!" : "Profile Submitted for Review!"}
        </h3>

        {/* Description */}
        {isIncomplete ? (
          <div style={{ textAlign: "left", margin: "0 0 1.75rem" }}>
            <p
              style={{
                fontSize: "1rem",
                color: colors.textSecondary,
                margin: "0 0 1rem",
                lineHeight: "1.7",
              }}
            >
              Your progress has been saved. Your profile is currently at <strong style={{ color: colors.textPrimary }}>{profileCompletion}%</strong> completion.
            </p>
            <div
              style={{
                backgroundColor: actualTheme === "dark" ? "#3B2E1A" : "#FFFBEB",
                border: `1.5px solid ${actualTheme === "dark" ? "#78350F" : "#FCD34D"}`,
                borderRadius: "0.5rem",
                padding: "1rem 1.25rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontSize: "1rem", color: "#D97706", fontWeight: "600", margin: "0 0 0.5rem" }}>
                <i className="bi bi-info-circle" style={{ marginRight: "0.4rem" }}></i>
                To activate your account:
              </p>
              <p style={{ fontSize: "0.95rem", color: colors.textSecondary, margin: 0, lineHeight: "1.7" }}>
                Complete at least <strong style={{ color: colors.textPrimary }}>90%</strong> of your profile — including your bio, specialties, equipment, skills, education, and work experience. Once you reach 90%, your profile will be submitted for review by our team.
              </p>
            </div>
            <p
              style={{
                fontSize: "0.95rem",
                color: colors.textSecondary,
                margin: 0,
                lineHeight: "1.6",
                fontStyle: "italic",
              }}
            >
              You can log back in anytime to continue filling out your profile.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "left", margin: "0 0 1.75rem" }}>
            <p
              style={{
                fontSize: "1rem",
                color: colors.textSecondary,
                margin: "0 0 1rem",
                lineHeight: "1.7",
              }}
            >
              Great job! Your profile is at <strong style={{ color: colors.textPrimary }}>{profileCompletion}%</strong> and has been submitted for review.
            </p>
            <div
              style={{
                backgroundColor: actualTheme === "dark" ? "#1A2A4A" : "#EFF6FF",
                border: `1.5px solid ${actualTheme === "dark" ? "#1E40AF" : "#93C5FD"}`,
                borderRadius: "0.5rem",
                padding: "1rem 1.25rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontSize: "1rem", color: "#2563EB", fontWeight: "600", margin: "0 0 0.5rem" }}>
                <i className="bi bi-clock-history" style={{ marginRight: "0.4rem" }}></i>
                What happens next?
              </p>
              <p style={{ fontSize: "0.95rem", color: colors.textSecondary, margin: 0, lineHeight: "1.7" }}>
                Our team will review your profile to verify your credentials and ensure quality standards. This typically takes <strong style={{ color: colors.textPrimary }}>a few hours</strong>. You will be notified once your account is approved.
              </p>
            </div>
            <p
              style={{
                fontSize: "0.95rem",
                color: colors.textSecondary,
                margin: 0,
                lineHeight: "1.6",
                fontStyle: "italic",
              }}
            >
              Once approved, you will be able to receive event bookings and connect with clients on the platform.
            </p>
          </div>
        )}

        {/* Okay Button */}
        <button
          onClick={handleOkay}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "none",
            borderRadius: "0.5rem",
            backgroundColor: "#083A85",
            color: "white",
            fontSize: "1rem",
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
