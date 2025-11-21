import React from 'react';

const gradientStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const MoneyIcon = () => (
  <i className="bi bi-cash-coin" style={gradientStyle}></i>
);

export const ClockIcon = () => (
  <i className="bi bi-clock-history" style={gradientStyle}></i>
);

export const UsersIcon = () => (
  <i className="bi bi-people" style={gradientStyle}></i>
);

export const GiftIcon = () => (
  <i className="bi bi-gift" style={gradientStyle}></i>
);

export const StarIcon = () => (
  <i className="bi bi-star-fill" style={gradientStyle}></i>
);
