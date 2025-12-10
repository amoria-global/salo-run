"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import {
  StatCard,
  HeaderStat,
  ActivityItem,
  ClientItem,
  PaymentItem,
  PerformanceChart,
  MoneyIcon,
  ClockIcon,
  UsersIcon,
  GiftIcon,
  StarIcon
} from '../../components/dashboard';

interface PhotographerDashboardProps {
  userType?: 'photographer' | 'freelancer';
}

const PhotographerDashboard = ({ userType = 'photographer' }: PhotographerDashboardProps) => {
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const performanceData = [
    { day: 'Sun', value1: 130, value2: 150 },
    { day: 'Mon', value1: 90, value2: 100 },
    { day: 'Tue', value1: 100, value2: 130 },
    { day: 'Wed', value1: 60, value2: 70 },
    { day: 'Thu', value1: 70, value2: 80 },
    { day: 'Fri', value1: 130, value2: 150 },
    { day: 'Sat', value1: 90, value2: 70 }
  ];

  const recentActivities = [
    { label: 'Customer', value: 'Joseph Mugabo' },
    { label: 'Transaction', value: '-450', valueColor: '#ff0066' },
    { label: 'Archive', value: 'jsm_wedd.mp4' },
    { label: 'Package', value: 'Tier 1' },
    { label: 'Referral', value: 'Pacific Uwitonze',  valueColor: '#083A85' },
    { label: 'Logs', value: 'Today, 14. July 2025' }
  ];

  const clients = [
    {
      name: 'Kalisa Aime',
      event: 'Wedding',
      status: 'In Progress' as const,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      name: 'Ketty Bashabe',
      event: 'Birthday',
      status: 'Completed' as const,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      name: 'Juno Kizigenza',
      event: 'Festival',
      status: 'Pending' as const,
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
    }
  ];

  const recentPayments = [
    {
      name: 'Kalisa Aime',
      type: 'Earnings',
      amount: '$1,950',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      name: 'Amoria',
      type: 'Archive commission',
      amount: '$50.80',
      logo: '/logo.png'
    },
    {
      name: 'Amoria',
      type: 'Referral bonus',
      amount: '$3.0',
      logo: '/logo.png'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar userRole={userType} />

        <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4">
          <header className="flex justify-between items-center mt-0.5">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Good <span className="font-normal text-gray-600">Morning</span>, <span className="text-blue-600">Diane</span>
              </h1>
            </div>
            <div className="bg-white rounded-lg px-6 py-3 shadow-sm border border-gray-200 flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium mb-1" style={{ color: '#083A85' }}>Earnings</span>
                <span className="text-xl font-bold text-gray-900">$9.64k</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium mb-1" style={{ color: '#083A85' }}>Clients</span>
                <span className="text-xl font-bold text-gray-900">26</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium mb-1" style={{ color: '#083A85' }}>Accuracy</span>
                <span className="text-xl font-bold text-gray-900">73.5%</span>
              </div>
            </div>
          </header>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveFilter('today')}
          className={`px-3.5 py-1.5 border rounded-md text-xs cursor-pointer transition-all ${
            activeFilter === 'today'
              ? 'bg-[#F20C8F] text-white border-[#F20C8F]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#F20C8F]'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveFilter('week')}
          className={`px-3.5 py-1.5 border rounded-md text-xs cursor-pointer transition-all ${
            activeFilter === 'week'
              ? 'bg-[#F20C8F] text-white border-[#F20C8F]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#F20C8F]'
          }`}
        >
          This week
        </button>
        <button
          onClick={() => setActiveFilter('month')}
          className={`px-3.5 py-1.5 border rounded-md text-xs cursor-pointer transition-all ${
            activeFilter === 'month'
              ? 'bg-[#F20C8F] text-white border-[#F20C8F]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#F20C8F]'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setActiveFilter('custom')}
          className={`px-3.5 py-1.5 border rounded-md text-xs cursor-pointer transition-all ${
            activeFilter === 'custom'
              ? 'bg-[#F20C8F] text-white border-[#F20C8F]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#F20C8F]'
          }`}
        >
          Custom
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        <StatCard
          title="Total Earnings"
          value="$2,600"
          percentage="52.76%"
          timeframe="last week"
          icon={<MoneyIcon />}
          trend="up"
          href="/photographers/earnings"
        />
        <StatCard
          title="Pending"
          value="$700"
          percentage="36.8%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          href="/photographers/pending-payments"
        />
        <StatCard
          title="Total clients"
          value="5.0"
          percentage="5.4%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href="/photographers/clients"
        />
        <StatCard
          title="Bonuses"
          value="$3.05"
          percentage="47.38%"
          timeframe="last week"
          icon={<GiftIcon />}
          trend="down"
          href="/photographers/bonuses"
        />
        <StatCard
          title="Ratings"
          value="3.9/5"
          percentage="8%"
          timeframe="last 120 reviews"
          icon={<StarIcon />}
          trend="up"
          href="/photographers/reviews"
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div>
          <section className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance</h2>
            <PerformanceChart data={performanceData} height={200} />
          </section>

          <section className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Clients</h2>
              <a href="#" className="text-xs text-blue-600 font-medium hover:underline">See all</a>
            </div>
            <div className="flex flex-col gap-2.5">
              {clients.map((client, index) => (
                <ClientItem key={index} {...client} />
              ))}
            </div>
          </section>
        </div>

        <div>
          <section className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3.5">Recent Activities</h2>
            <div className="flex flex-col gap-3">
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent payments</h2>
              <a href="#" className="text-xs text-blue-600 font-medium hover:underline">See all</a>
            </div>
            <div className="flex flex-col gap-2.5">
              {recentPayments.map((payment, index) => (
                <PaymentItem key={index} {...payment} />
              ))}
            </div>
          </section>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default PhotographerDashboard;