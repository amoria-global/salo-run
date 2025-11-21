"use client";

import Image from "next/image";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-white rounded-full mx-6 my-3 border border-gray-200 shadow-sm">
      {/* Left side - Dashboard title */}
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Right side - Notification, Bonus, and Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative cursor-pointer">
          <i className="bi bi-bell text-xl text-gray-700"></i>
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            9+
          </span>
        </div>

        {/* Bonus */}
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900">Bonus:</span>
          <span className="text-base font-semibold text-gray-900">$3.00</span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <Image
            src="https://i.pinimg.com/1200x/bb/6a/ef/bb6aef8c1bd48cd8b3b41725eaba18e3.jpg"
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-700">Moise caicedo</span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-900">$0.00</span>
              <i className="bi bi-chevron-down text-xs text-gray-700"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
