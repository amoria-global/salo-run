"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

const BankIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="#3B82F6" strokeWidth="2"/>
    <path d="M20.188 10.9343C20.5762 11.4056 20.7703 11.6412 20.7703 12C20.7703 12.3588 20.5762 12.5944 20.188 13.0657C18.7679 14.7899 15.6357 18 12 18C8.36427 18 5.23206 14.7899 3.81197 13.0657C3.42381 12.5944 3.22973 12.3588 3.22973 12C3.22973 11.6412 3.42381 11.4056 3.81197 10.9343C5.23206 9.21014 8.36427 6 12 6C15.6357 6 18.7679 9.21014 20.188 10.9343Z" stroke="#3B82F6" strokeWidth="2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="#9CA3AF" strokeWidth="2"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="1.5" fill="#6B7280"/>
    <circle cx="12" cy="12" r="1.5" fill="#6B7280"/>
    <circle cx="12" cy="18" r="1.5" fill="#6B7280"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VisaIcon = () => (
  <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="20" rx="2" fill="#1A1F71"/>
    <path d="M13.5 13.5L14.5 6.5H16.5L15.5 13.5H13.5ZM11.5 6.5L9.5 11.5L9.3 10.5L8.5 7.2C8.5 7.2 8.4 6.5 7.5 6.5H4.5L4.5 6.7C4.5 6.7 5.5 6.9 6.7 7.6L8.5 13.5H10.7L13.5 6.5H11.5ZM24.5 13.5H26.5L24.8 6.5H23.2C22.5 6.5 22.3 7 22.3 7L19.2 13.5H21.4L21.8 12.3H24.5L24.5 13.5ZM22.4 10.7L23.5 7.8L24.1 10.7H22.4ZM19.5 8.5L19.8 6.7C19.8 6.7 18.7 6.3 17.5 6.3C16.2 6.3 13.5 6.9 13.5 9.3C13.5 11.5 16.5 11.6 16.5 12.7C16.5 13.8 13.8 13.5 12.8 12.7L12.5 14.6C12.5 14.6 13.6 15 15.1 15C16.6 15 19.5 14.1 19.5 11.8C19.5 9.4 16.5 9.2 16.5 8.3C16.5 7.4 18.6 7.6 19.5 8.5Z" fill="white"/>
  </svg>
);

// Chart Type Icons
const LineChartIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12L7 8L12 13L17 6L21 10" stroke={active ? '#3B82F6' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 20H21" stroke={active ? '#3B82F6' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BarChartIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="10" width="4" height="10" rx="1" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <rect x="10" y="6" width="4" height="14" rx="1" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <rect x="16" y="12" width="4" height="8" rx="1" fill={active ? '#3B82F6' : '#9CA3AF'}/>
  </svg>
);

const ScatterChartIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="14" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <circle cx="10" cy="8" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <circle cx="15" cy="12" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <circle cx="19" cy="6" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <path d="M3 20H21" stroke={active ? '#3B82F6' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

type ChartType = 'line' | 'bar' | 'scatter';

interface EarningsChartProps {
  data: { date: string; value: number }[];
  height?: number;
  chartType: ChartType;
}

const EarningsChart: React.FC<EarningsChartProps> = ({ data, height = 140, chartType }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 10;
  const paddingRight = 10;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = 500;
  const barWidth = 35;
  const barGap = (chartWidth - paddingLeft - paddingRight - (data.length * barWidth)) / (data.length - 1);

  const points = data.map((item, index) => {
    const x = chartType === 'bar'
      ? paddingLeft + index * (barWidth + barGap) + barWidth / 2
      : paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
    const y = paddingTop + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, ...item };
  });

  // Create smooth bezier curve for line chart
  const pathD = points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const tension = 0.3;
    const cpx1 = prev.x + (point.x - prev.x) * tension;
    const cpx2 = point.x - (point.x - prev.x) * tension;
    return `C ${cpx1} ${prev.y} ${cpx2} ${point.y} ${point.x} ${point.y}`;
  }).join(' ');

  // Area path for line chart
  const areaPath = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <>
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            {points.map((point, index) => {
              const barHeight = chartHeight - (point.y - paddingTop);
              const barX = paddingLeft + index * (barWidth + barGap);
              return (
                <g key={index}>
                  <rect
                    x={barX}
                    y={point.y}
                    width={barWidth}
                    height={barHeight}
                    fill={hoveredIndex === index ? '#2563EB' : 'url(#barGradient)'}
                    rx={4}
                    ry={4}
                    style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </>
        );

      case 'scatter':
        return (
          <>
            {/* Connecting lines (optional, subtle) */}
            <path
              d={points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Scatter points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredIndex === index ? 10 : 8}
                  fill={hoveredIndex === index ? '#2563EB' : '#3B82F6'}
                  stroke="white"
                  strokeWidth="3"
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Inner dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill="white"
                  pointerEvents="none"
                />
              </g>
            ))}
          </>
        );

      case 'line':
      default:
        return (
          <>
            <defs>
              <linearGradient id="earningsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#earningsAreaGradient)" />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Hover detection areas */}
            {points.map((point, index) => (
              <rect
                key={`hover-${index}`}
                x={point.x - 25}
                y={0}
                width={50}
                height={height}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}

            {/* Data point (only show on hover) */}
            {hoveredIndex !== null && (
              <>
                {/* Vertical line */}
                <line
                  x1={points[hoveredIndex].x}
                  y1={points[hoveredIndex].y}
                  x2={points[hoveredIndex].x}
                  y2={height - paddingBottom}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
                {/* Point */}
                <circle
                  cx={points[hoveredIndex].x}
                  cy={points[hoveredIndex].y}
                  r={6}
                  fill="white"
                  stroke="#3B82F6"
                  strokeWidth="3"
                />
              </>
            )}
          </>
        );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Frame label */}
      <div style={{ fontSize: '0.75rem', color: '#D1D5DB', marginBottom: '0.5rem' }}>Frame</div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
          {renderChart()}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div style={{
            position: 'absolute',
            left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
            top: chartType === 'bar' ? `${points[hoveredIndex].y - 80}px` : `${points[hoveredIndex].y - 70}px`,
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>
              Wednesday, {points[hoveredIndex].date.replace('July ', '')} July 2025
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: '600' }}>$</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Earnings</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                ${(points[hoveredIndex].value / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        )}

        {/* X-axis labels */}
        <div style={{
          position: 'absolute',
          bottom: '0px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 5px'
        }}>
          {data.map((item, index) => (
            <span key={index} style={{
              fontSize: '0.75rem',
              color: '#9CA3AF',
              fontWeight: '500',
              minWidth: '45px',
              textAlign: 'center'
            }}>
              {item.date}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PayrollGaugeProps {
  initial: number;
  pending: number;
  paid: number;
}

const PayrollGauge: React.FC<PayrollGaugeProps> = ({ initial, pending, paid }) => {
  const total = initial + pending + paid;
  const initialAngle = (initial / total) * 180;
  const pendingAngle = (pending / total) * 180;

  const createArc = (startAngle: number, endAngle: number, color: string) => {
    const radius = 70;
    const centerX = 80;
    const centerY = 80;
    const startRad = (180 + startAngle) * (Math.PI / 180);
    const endRad = (180 + endAngle) * (Math.PI / 180);
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return (
      <path
        key={color}
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        {createArc(0, initialAngle, '#3B82F6')}
        {createArc(initialAngle, initialAngle + pendingAngle, '#FBBF24')}
        {createArc(initialAngle + pendingAngle, 180, '#10B981')}
      </svg>
    </div>
  );
};

interface StatusBadgeProps {
  status: 'Completed' | 'Pending' | 'In progress' | 'Initiated' | 'Failed';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'In progress': return '#3B82F6';
      case 'Initiated': return '#6B7280';
      case 'Failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: getColor() }}>
      {status}
    </span>
  );
};

interface TransactionTypeBadgeProps {
  type: 'Referral Bonus' | 'Earnings' | 'Archive Commission' | 'Bonus' | 'Withdrawal';
}

const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({ type }) => {
  const getColor = () => {
    switch (type) {
      case 'Referral Bonus': return '#F20C8F';
      case 'Earnings': return '#10B981';
      case 'Archive Commission': return '#8B5CF6';
      case 'Bonus': return '#F59E0B';
      case 'Withdrawal': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: getColor() }}>
      {type}
    </span>
  );
};

const TransactionsPage = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1W');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('line');

  const earningsData = [
    { date: 'July 13', value: 5200 },
    { date: 'July 14', value: 5100 },
    { date: 'July 15', value: 5300 },
    { date: 'July 16', value: 5400 },
    { date: 'July 17', value: 5600 },
    { date: 'July 18', value: 5500 },
    { date: 'July 19', value: 5400 }
  ];

  const transactions = [
    { id: 1, date: 'July, 13 20:05 PM', name: 'Amoria Pay', type: 'Referral Bonus' as const, avatar: '/logo.png', method: 'Mobile Money', amount: '$250.0', status: 'Completed' as const, requestId: 'AX23412' },
    { id: 2, date: 'July, 2 18:46 PM', name: 'Kagabo Innocent', type: 'Earnings' as const, avatar: 'https://randomuser.me/api/portraits/men/32.jpg', method: 'Mobile Money', amount: '$5,500.0', status: 'Pending' as const, requestId: 'AX23412' },
    { id: 3, date: 'July, 15 20:05 PM', name: 'Amoria Pay', type: 'Archive Commission' as const, avatar: '/logo.png', method: 'Master Card', amount: '$50.0', status: 'In progress' as const, requestId: 'AX23412' },
    { id: 4, date: 'July, 13 20:05 PM', name: 'Penny Gloria', type: 'Earnings' as const, avatar: 'https://randomuser.me/api/portraits/women/44.jpg', method: 'Mobile Money', amount: '$200.0', status: 'Completed' as const, requestId: 'AX23412' },
    { id: 5, date: 'July, 13 20:05 PM', name: 'Amoria Bonus', type: 'Bonus' as const, avatar: '/logo.png', method: 'Bank Transfer', amount: '$250.0', status: 'Initiated' as const, requestId: 'AX23412' },
    { id: 6, date: 'July, 13 20:05 PM', name: 'Diane Marry', type: 'Withdrawal' as const, avatar: 'https://randomuser.me/api/portraits/women/68.jpg', method: 'Visa Card', amount: '$250.0', status: 'Failed' as const, requestId: 'AX23412' },
    { id: 7, date: 'July, 13 20:05 PM', name: 'Amoria Pay', type: 'Referral Bonus' as const, avatar: '/logo.png', method: 'Mobile Money', amount: '$250.0', status: 'Completed' as const, requestId: 'AX23412' },
    { id: 8, date: 'July, 7 14:44 PM', name: 'Kagabo Innocent', type: 'Earnings' as const, avatar: 'https://randomuser.me/api/portraits/men/32.jpg', method: 'Mobile Money', amount: '$5,500.0', status: 'Pending' as const, requestId: 'AX23412' },
    { id: 9, date: 'July, 19 20:03 PM', name: 'Amoria Pay', type: 'Archive Commission' as const, avatar: '/logo.png', method: 'Mobile Money', amount: '$50.0', status: 'Completed' as const, requestId: 'AX23412' },
    { id: 10, date: 'July, 7 14:44 PM', name: 'Kagabo Innocent', type: 'Earnings' as const, avatar: 'https://randomuser.me/api/portraits/men/32.jpg', method: 'Mobile Money', amount: '$5,500.0', status: 'Pending' as const, requestId: 'AX23412' },
    { id: 11, date: 'July, 13 20:05 PM', name: 'Amoria Pay', type: 'Archive Commission' as const, avatar: '/logo.png', method: 'Mobile Card', amount: '$50.0', status: 'In progress' as const, requestId: 'AX23412' },
    { id: 12, date: 'July, 13 20:05 PM', name: 'Penny Gloria', type: 'Earnings' as const, avatar: 'https://randomuser.me/api/portraits/women/44.jpg', method: 'Mobile Money', amount: '$200.0', status: 'Completed' as const, requestId: 'AX23412' },
    { id: 13, date: 'July, 13 20:05 PM', name: 'Amoria Bonus', type: 'Bonus' as const, avatar: '/logo.png', method: 'Bank Transfer', amount: '$250.0', status: 'Pending' as const, requestId: 'AX23412' }
  ];

  const totalPages = 10;
  const resultsPerPage = 5;
  const totalResults = 25;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600' }}>Transactions</h1>
          </header>

          {/* Top Row - Earnings Chart and Payroll Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginBottom: '1rem' }}>

            {/* Earnings Chart */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Earnings</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>$18,500.04</span>
                    <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: '500' }}>+23% vs last week</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Chart Type Selector */}
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', padding: '0.25rem' }}>
                    <button
                      onClick={() => setChartType('line')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'line' ? 'white' : 'transparent',
                        boxShadow: chartType === 'line' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Line Chart"
                    >
                      <LineChartIcon active={chartType === 'line'} />
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'bar' ? 'white' : 'transparent',
                        boxShadow: chartType === 'bar' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Bar Chart"
                    >
                      <BarChartIcon active={chartType === 'bar'} />
                    </button>
                    <button
                      onClick={() => setChartType('scatter')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'scatter' ? 'white' : 'transparent',
                        boxShadow: chartType === 'scatter' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Scatter Chart"
                    >
                      <ScatterChartIcon active={chartType === 'scatter'} />
                    </button>
                  </div>
                  {/* Time Period Filter */}
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F9FAFB', borderRadius: '0.375rem', padding: '0.25rem' }}>
                    {(['1W', '1M', '3M', '6M', '1Y'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setActiveTimeFilter(period)}
                        style={{
                          padding: '0.375rem 0.625rem',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          backgroundColor: activeTimeFilter === period ? '#083A85' : 'transparent',
                          color: activeTimeFilter === period ? 'white' : '#6B7280',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <EarningsChart data={earningsData} height={150} chartType={chartType} />
            </div>

            {/* Payroll Summary */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>Payroll summary</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>From 13 - 18 July 2025</div>
                </div>
                <a href="#" style={{ fontSize: '0.85rem', color: '#2563EB', textDecoration: 'none', fontWeight: '500' }}>View report</a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Initial</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>$1,200.13</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Pending</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>$350.13</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Paid</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>$949.87</div>
                </div>
              </div>
              <PayrollGauge initial={1200.13} pending={350.13} paid={949.87} />
            </div>
          </div>

          {/* Available to Withdraw Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BankIcon />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>$2,849.80</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                      <EyeIcon />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>Available to withdraw</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Previous Deposit: </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>$450.00</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Last Withdraw: </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>$1,345.00</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Active Account:</span>
                  <VisaIcon />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>*****980</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button style={{ backgroundColor: '#083A85', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                  Withdraw
                </button>
                <button style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MoreIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions History Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>Transactions History</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#6B7280', cursor: 'pointer' }}>
                <CalendarIcon />
                19 Jun - 29 July 2024
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Transaction</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Request Id</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: '#6B7280' }}>{transaction.date}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={transaction.avatar} alt={transaction.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{transaction.name}</div>
                          <TransactionTypeBadge type={transaction.type} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: '#6B7280' }}>{transaction.method}</td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{transaction.amount}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}><StatusBadge status={transaction.status} /></td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{transaction.requestId}</span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><CopyIcon /></button>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><DownloadIcon /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><ViewIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>Showing {resultsPerPage} of {totalResults} Results</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === 1 ? 0.5 : 1 }}>
                  <ChevronLeftIcon />
                </button>
                {[1, 2, 3].map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ width: '32px', height: '32px', border: currentPage === page ? '1px solid #083A85' : '1px solid #E5E7EB', borderRadius: '0.375rem', backgroundColor: currentPage === page ? '#083A85' : 'white', color: currentPage === page ? 'white' : '#6B7280', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {page}
                  </button>
                ))}
                <span style={{ padding: '0 0.5rem', color: '#6B7280' }}>...</span>
                <button onClick={() => setCurrentPage(totalPages)} style={{ width: '32px', height: '32px', border: currentPage === totalPages ? '1px solid #083A85' : '1px solid #E5E7EB', borderRadius: '0.375rem', backgroundColor: currentPage === totalPages ? '#083A85' : 'white', color: currentPage === totalPages ? 'white' : '#6B7280', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                  {totalPages}
                </button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
