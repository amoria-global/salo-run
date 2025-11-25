"use client";

import Link from 'next/link';
import Sidebar from './components/sidebar';
import Topbar from './components/topbar';

export default function NotFound() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col items-center justify-center px-4 relative">
          <div className="text-center">
            {/* 404 Number with Gradient */}
            <h1
              className="text-[150px] font-extrabold leading-none mb-4"
              style={{
                background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </h1>
            {/* Message */}
            <p className="text-xl text-gray-700 mb-6">
             This page doesn't exist.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/user/client/home"
                className="px-4 py-2 rounded-md text-white text-sm font-medium transition-all hover:opacity-90 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 100%)' }}
              >
                <i className="bi bi-house-door mr-2"></i>
                Go Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 rounded-md border text-sm font-medium transition-all hover:scale-105 cursor-pointer"
                style={{ borderColor: '#083A85', color: '#083A85' }}
              >
                <i className="bi bi-arrow-left mr-2"></i>
                Go Back
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-10 blur-3xl"
            style={{ background: '#F20C8F' }}
          />
          <div
            className="absolute bottom-20 right-20 w-40 h-40 rounded-full opacity-10 blur-3xl"
            style={{ background: '#083A85' }}
          />
        </div>
      </div>
    </div>
  );
}
