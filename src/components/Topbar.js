import React from 'react';
import { FaSearch } from 'react-icons/fa';

const Topbar = ({
  search,
  isMobile,
  onSearchChange
}) => {
  return (
    <div className="topbar">
      <div style={{ width: 40, height: 40, marginRight: 18 }}></div>
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
