import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  percentage: string;
  timeframe: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  href?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  percentage,
  timeframe,
  icon,
  trend = 'up',
  href
}) => {
  return (
    <div className="bg-white rounded-lg p-3.5 shadow-sm h-full">
      <div className="flex items-start justify-between mb-2 min-h-[36px]">
        <span className="text-2xl text-gray-600 font-medium">{title}</span>
        <div className="w-9 h-9 flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="text-xl font-extrabold mb-1.5" style={{ color: '#000000' }}>{value}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '+' : ''}{percentage}
          </span>
          <span className="text-[0.7rem] text-gray-400">{timeframe}</span>
        </div>
        <a href={href || '#'} className="p-1 hover:opacity-80 transition-opacity cursor-pointer" title="View details">
          <i className="bi bi-box-arrow-up-right text-sm" style={{ color: '#0267FF' }}></i>
        </a>
      </div>
    </div>
  );
};
