"use client";

import Link from 'next/link';
import Sidebar from './components/sidebar';
import Topbar from './components/topbar';
import { useTheme } from './context/ThemeContext';

export default function NotFound() {
  const { colors, actualTheme } = useTheme();

  const gradientLight = 'linear-gradient(135deg, #F20C8F 0%, #083A85 100%)';
  const gradientDark = 'linear-gradient(135deg, #F472B6 0%, #60A5FA 100%)';
  const gradient = actualTheme === 'dark' ? gradientDark : gradientLight;

  return (
    <div className="flex h-screen" style={{ backgroundColor: colors.bgPrimary }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar bonusAmount={0} />

        <div
          className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 relative"
          style={{ backgroundColor: colors.bgPrimary }}
        >
          <div className="text-center">
            {/* 404 Number with Gradient */}
            <h1
              className="text-[150px] font-extrabold leading-none mb-4"
              style={{
                background: gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </h1>
            {/* Message */}
            <p className="text-xl mb-6" style={{ color: colors.textSecondary }}>
             This page doesn't exist.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/user/client/home"
                className="px-4 py-2 rounded-md text-white text-sm font-medium transition-all hover:opacity-90 hover:scale-105"
                style={{ background: gradient }}
              >
                <i className="bi bi-house-door mr-2"></i>
                Go Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-md border text-sm font-medium transition-all hover:scale-105 cursor-pointer"
                style={{
                  borderColor: colors.brandPrimary,
                  color: colors.brandPrimary,
                  backgroundColor: 'transparent'
                }}
              >
                <i className="bi bi-arrow-left mr-2"></i>
                Go Back
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-10 blur-3xl"
            style={{ background: colors.brandAccent }}
          />
          <div
            className="absolute bottom-20 right-20 w-40 h-40 rounded-full opacity-10 blur-3xl"
            style={{ background: colors.brandPrimary }}
          />
        </div>
      </div>
    </div>
  );
}
