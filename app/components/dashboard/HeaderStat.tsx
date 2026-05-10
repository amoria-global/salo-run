import React from 'react';

interface HeaderStatProps {
  label: string;
  value: string;
}

export const HeaderStat: React.FC<HeaderStatProps> = ({ label, value }) => {
  return (
    <div className="bg-white rounded-md px-5 py-2.5 shadow-sm border border-gray-200">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[0.7rem] text-gray-600 font-medium">{label}</span>
        <span className="text-xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
};
