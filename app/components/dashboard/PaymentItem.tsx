import React from 'react';

interface PaymentItemProps {
  name: string;
  type: string;
  amount: string;
  avatar?: string;
  logo?: string;
}

export const PaymentItem: React.FC<PaymentItemProps> = ({
  name,
  type,
  amount,
  avatar,
  logo
}) => {
  return (
    <div className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2.5">
        {avatar && <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />}
        {logo && <img src={logo} alt={name} className="w-9 h-9 rounded-full object-cover p-1.5 bg-gray-100" />}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-gray-900">{name}</span>
          <span className="text-xs text-gray-600">{type}</span>
        </div>
      </div>
      <span className="text-sm font-bold text-gray-900">{amount}</span>
    </div>
  );
};
