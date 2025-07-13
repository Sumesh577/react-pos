import React from 'react';
import { FaSearch } from 'react-icons/fa';
import Logo from './Logo';

const Topbar = ({
  search,
  isMobile,
  onSearchChange
}) => {
  return (
    <div className="topbar">
      <div className="topbar-logo">
        <Logo size="small" />
      </div>
      <div className="search-bar-container">
        <FaSearch className="search-icon" />
        <input
          className="search-bar"
          type="text"
          placeholder="Search Products by name or SKU..."
          value={search}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
};

export default Topbar;
