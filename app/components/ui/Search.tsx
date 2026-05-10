"use client";

import React from 'react';

interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

export const Search: React.FC<SearchProps> = ({ onClear, value, placeholder = 'Search…', ...rest }) => (
  <div className="ck-search">
    <i className="bi bi-search" />
    <input type="search" value={value} placeholder={placeholder} {...rest} />
    {onClear && value ? (
      <button
        onClick={onClear}
        type="button"
        aria-label="Clear"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          color: 'var(--ck-text-muted)',
        }}
      >
        <i className="bi bi-x-circle-fill" />
      </button>
    ) : null}
  </div>
);

export default Search;
