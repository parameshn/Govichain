import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;