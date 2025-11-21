import React from 'react';

interface ClientItemProps {
  name: string;
  event: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  avatar: string;
  onMenuClick?: () => void;
}

export const ClientItem: React.FC<ClientItemProps> = ({
  name,
  event,
  status,
  avatar,
  onMenuClick
}) => {
  const getStatusClass = () => {
    switch (status) {
      case 'In Progress':
        return 'bg-pink-50 text-pink-600';
      case 'Completed':
        return 'bg-green-50 text-green-600';
      case 'Pending':
        return 'bg-amber-50 text-amber-600';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors">
      <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-gray-900">{name}</span>
        <span className="text-xs text-gray-600">{event}</span>
      </div>
      <span className={`px-2.5 py-1 rounded text-[0.7rem] font-semibold ${getStatusClass()}`}>{status}</span>
      <button className="p-1 text-gray-400 hover:text-gray-600 text-xl" onClick={onMenuClick}>
        <span>⋮</span>
      </button>
    </div>
  );
};
