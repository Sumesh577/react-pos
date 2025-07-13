import React from 'react';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-lg',
    medium: 'w-10 h-10 text-xl',
    large: 'w-12 h-12 text-2xl'
  };

  return (
    <div className={`logo-container ${sizeClasses[size]} ${className}`}>
      <div className="logo-icon">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full"
        >
          {/* Modern POS/Cash Register Icon */}
          <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
          <path d="M7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>
          <path d="M7 13h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
        </svg>
      </div>
      <span className="logo-text">POS</span>
    </div>
  );
};

export default Logo;
