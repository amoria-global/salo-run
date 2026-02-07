"use client";

import { on } from "events";
import React from "react";

interface WelcomeUnlockModalProps {
  title: string ;
  onYes: boolean | (() => void);
  onNo: boolean | (() => void);
  onCancel: () => void;
  onContinueToPayment: () => void;
}

export default function WelcomeunlockModal({
  title,
  onYes,
  onNo,
    onCancel,
    onContinueToPayment,
}:WelcomeUnlockModalProps): React.JSX.Element | null {
 

  return (
    <>
      {/* Overlay with Backdrop Blur */}
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
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
          }}
        >
          {/* Header with Welcome Icon */}
          <div
            style={{
              padding: "32px 24px 20px",
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(8, 58, 133, 0.05) 0%, rgba(255, 255, 255, 1) 100%)",
            }}
          >
            {/* Success Checkmark Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #083A85 0%, #0d4ea8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 14px rgba(8, 58, 133, 0.3)",
              }}
            >
              <i
                className="bi bi-check-lg"
                style={{ fontSize: "32px", color: "#fff" }}
              ></i>
            </div>

            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
            {title}
            </h2>

          </div>

          {/* Action Buttons */}
          <div
            style={{
              padding: "20px 24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Continue to payment Button */}
            <button
              onClick={onContinueToPayment}
              style={{
                width: "100%",
                padding: "14px 20px",
                backgroundColor: "#083A85",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#062d6b";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(8, 58, 133, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#083A85";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >

                yes, Continue to Payment
            </button>

            {/* cancel Button */}
            <button
              onClick={onCancel}
              style={{
                width: "100%",
                padding: "14px 20px",
                backgroundColor: "#fff",
                color: "#374151",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.borderColor = "#083A85";
                e.currentTarget.style.color = "#083A85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#374151";
              }}
            >
              Cancel Process
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
