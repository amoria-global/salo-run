import React from 'react';

interface ActivityItemProps {
  label: string;
  value: string;
  valueColor?: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  label,
  value,
  valueColor
}) => {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span
        className="text-xs text-gray-900 font-semibold text-right"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
};
