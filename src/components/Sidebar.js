import React from 'react';
import {
  FaHome, FaUser, FaCashRegister, FaHistory, FaChartPie, FaSyncAlt, FaUserCircle, FaTimes
} from 'react-icons/fa';
import Logo from './Logo';

const Sidebar = ({
  isMobile,
  showMobileMenu,
  activeNav,
  currentUser,
  onMobileMenuClose,
  onNavClick,
  onLogout
}) => {
  return (
    <aside className={`sidebar${showMobileMenu ? ' mobile-open' : ''}`}>
      {isMobile && (
        <button
          className="mobile-close-btn"
          onClick={onMobileMenuClose}
        >
          <FaTimes />
        </button>
      )}

      <div className="sidebar-content">
        <div className="sidebar-logo">
          <Logo size="medium" />
        </div>
        <nav className="nav">
          <button
            className={`nav-btn${activeNav === 'Home' ? ' active' : ''}`}
            onClick={() => onNavClick('Home')}
          >
            <FaHome />
          </button>
          <button
            className={`nav-btn${activeNav === 'Customer' ? ' active' : ''}`}
            onClick={() => onNavClick('Customer')}
          >
            <FaUser />
          </button>
          <button
            className={`nav-btn${activeNav === 'Cashier' ? ' active' : ''}`}
            onClick={() => onNavClick('Cashier')}
          >
            <FaCashRegister />
          </button>
          <button
            className={`nav-btn${activeNav === 'Orders' ? ' active' : ''}`}
            onClick={() => onNavClick('Orders')}
          >
            <FaHistory />
          </button>
          <button
            className={`nav-btn${activeNav === 'Reports' ? ' active' : ''}`}
            onClick={() => onNavClick('Reports')}
          >
            <FaChartPie />
          </button>
          <button
            className={`nav-btn${activeNav === 'Refresh' ? ' active' : ''}`}
            onClick={() => onNavClick('Refresh')}
          >
            <FaSyncAlt />
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="user-avatar">{currentUser?.avatar || <FaUserCircle />}</div>
        <div className="user-info">
          <div className="user-name">{currentUser?.name || 'User'}</div>
          <div className="user-role">{currentUser?.role || 'Cashier'}</div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <FaUser />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
