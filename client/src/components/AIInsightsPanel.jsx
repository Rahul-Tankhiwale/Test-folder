import React from 'react';
import useAIInsights from '../hooks/useAIInsights';
import "../styles/AIInsightsPanel.css"

const AIInsightsPanel = ({ transactions, userProfile }) => {
  const { insights, loading, healthScore, refreshInsights, hasData } = useAIInsights(transactions, userProfile);

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--text-secondary)';
      default: return 'var(--success)';
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getHealthScoreClass = (score) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  if (!hasData) {
    return (
      <div className="ai-insights-panel card">
        <div className="insights-header">
          <div className="header-left">
            <h3>AI Insights</h3>
          </div>
        </div>
        <div className="insights-empty">
          <div className="empty-icon">📊</div>
          <p>Add more transactions to get personalized insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights-panel card">
      <div className="insights-header">
        <div className="header-left">
          <h3>AI Insights</h3>
          {healthScore !== null && (
            <div className="health-score-container">
              <span className="health-score-label">Health Score:</span>
              <span className={`health-score ${getHealthScoreClass(healthScore)}`}>
                {healthScore}/100
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={refreshInsights} 
          className="refresh-btn"
          disabled={loading}
          title="Refresh insights"
        >
          {loading ? '🔄 Analyzing...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your finances...</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="insights-empty">
          <div className="empty-icon">✅</div>
          <p>Your finances look healthy! No issues detected.</p>
        </div>
      ) : (
        <>
          <div className="insights-list">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className="insight-item"
                style={{ borderLeft: `4px solid ${getSeverityColor(insight.severity)}` }}
              >
                <div className="insight-header">
                  <span className="insight-icon">{insight.icon}</span>
                  <div className="insight-title">
                    <h4>{insight.title}</h4>
                    <span className={`insight-severity ${insight.severity}`}>
                      {insight.severity}
                    </span>
                  </div>
                  <span className="insight-confidence">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                
                <p className="insight-message">{insight.message}</p>
                
                <div className="insight-action">
                  <strong>💡 Suggestion:</strong> 
                  <span className="insight-action-content">{insight.action}</span>
                </div>
                
                {insight.data && Object.keys(insight.data).length > 0 && (
                  <div className="insight-data">
                    <div className="data-grid">
                      {Object.entries(insight.data).map(([key, value]) => (
                        <div key={key} className="data-item">
                          <span className="data-label">{key}:</span>
                          <span className="data-value">
                            {typeof value === 'number' 
                              ? (key.includes('Rate') || key.includes('percentage') || key.includes('change'))
                                ? `${value.toFixed(1)}%`
                                : key.includes('amount') || key.includes('income') || key.includes('expense')
                                  ? `$${value.toFixed(2)}`
                                  : value.toFixed(2)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="insights-footer">
            <div className="insights-stats">
              <div className="stat">
                <span className="stat-label">Total Insights:</span>
                <span className="stat-value">{insights.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">High Priority:</span>
                <span className="stat-value">
                  {insights.filter(i => i.severity === 'high').length}
                </span>
              </div>
            </div>
            <small className="insights-note">
              Insights are generated automatically based on your transaction patterns
            </small>
          </div>
        </>
      )}
    </div>
  );
};

export default AIInsightsPanel;