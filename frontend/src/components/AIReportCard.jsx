import React from 'react';
import './AIReportCard.css';

const getScoreColor = (value) => {
  const normalized = value ?? 0;
  if (normalized >= 75) return '#22c55e';
  if (normalized >= 50) return '#f59e0b';
  return '#ef4444';
};

const getVerdictStyle = (verdict) => {
  const styles = {
    APPROVED: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    REVIEW: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
    REJECTED: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  };

  return styles[verdict] || styles.REVIEW;
};

// 🔥 Helper to render string OR object safely
const renderItem = (item) => {
  if (typeof item === 'string') {
    return item;
  }

  if (typeof item === 'object' && item !== null) {
    return (
      <>
        {item.rule && <strong>{item.rule}</strong>}
        {item.description && (
          <>
            <br />
            <span className="text-sm text-gray-400">
              {item.description}
            </span>
          </>
        )}
      </>
    );
  }

  return JSON.stringify(item); // fallback safety
};

const AIReportCard = ({ report, score, flags, title = 'Compliance Analysis' }) => {
  if (!report) return null;

  const scorePercent = Math.round(score ?? report.score ?? 0);

  const issues = Array.isArray(report.issues) ? report.issues : [];
  const suggestions = Array.isArray(report.suggestions) ? report.suggestions : [];
  const allFlags = Array.isArray(flags)
    ? flags
    : Array.isArray(report.flags)
    ? report.flags
    : [];

  return (
    <div className="compliance-report">
      <div className="compliance-report-header">
        <div>
          <span className="compliance-report-badge">AI Report</span>
          <h5 className="compliance-report-title">{title}</h5>
        </div>

        <div className="compliance-report-metrics">
          <span
            className="compliance-verdict-badge"
            style={getVerdictStyle(report.verdict)}
          >
            {report.verdict}
          </span>

          <strong
            className="compliance-score-pill"
            style={{
              color: getScoreColor(scorePercent),
              borderColor: getScoreColor(scorePercent),
            }}
          >
            {scorePercent}%
          </strong>
        </div>
      </div>

      {report.summary && (
        <div className="compliance-summary-block">
          <span className="compliance-section-kicker">Summary</span>
          <p className="compliance-summary">{report.summary}</p>
        </div>
      )}

      <div className="compliance-meta-grid">
        <div className="compliance-meta-card">
          <span className="compliance-meta-label">Issues</span>
          <strong>{issues.length}</strong>
        </div>
        <div className="compliance-meta-card">
          <span className="compliance-meta-label">Suggestions</span>
          <strong>{suggestions.length}</strong>
        </div>
        <div className="compliance-meta-card">
          <span className="compliance-meta-label">Flags</span>
          <strong>{allFlags.length}</strong>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="compliance-section">
          <div className="compliance-section-header">
            <strong>Issues</strong>
            <span>{issues.length}</span>
          </div>
          <ul className="compliance-list compliance-list-danger">
            {issues.map((issue, index) => (
              <li key={index}>{renderItem(issue)}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="compliance-section">
          <div className="compliance-section-header">
            <strong>Suggestions</strong>
            <span>{suggestions.length}</span>
          </div>
          <ul className="compliance-list compliance-list-info">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{renderItem(suggestion)}</li>
            ))}
          </ul>
        </div>
      )}

      {allFlags.length > 0 && (
        <div className="compliance-flags">
          <span className="compliance-section-kicker">Flags</span>
          <div className="compliance-flag-row">
            {allFlags.map((flag, index) => (
              <span key={index} className="compliance-flag-chip">
                {typeof flag === 'string'
                  ? flag
                  : flag.rule || JSON.stringify(flag)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReportCard;