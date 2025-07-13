import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => (
  <div className={`loading-spinner ${size}`}>
    <FaSpinner className="spinner-icon" />
    <span>{text}</span>
  </div>
);

export default LoadingSpinner;
