import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className={`stats-card ${color}`}>
      <div className="stats-icon">
        {icon}
      </div>
      <div className="stats-content">
        <h3 className="stats-title">{title}</h3>
        <p className="stats-value">{value}</p>
        {subtitle && <p className="stats-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;