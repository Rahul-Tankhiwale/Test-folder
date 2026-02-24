// components/FinancialNews.js
import React, { useState, useEffect } from 'react';
import '../styles/financialNews.css';

const FinancialNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Use your preferred API
        const response = await fetch(
          `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=4&apiKey=${process.env.REACT_APP_NEWS_API_KEY}`
        );
        const data = await response.json();
        setNews(data.articles || []);
      } catch (err) {
        setError('Failed to load news');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return `${Math.floor((now - date) / (1000 * 60))}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openArticle = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="financial-news">
        <h4>Financial News</h4>
        <div className="news-loading">
          <div className="loading-spinner"></div>
          <p>Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="financial-news">
        <h4>Financial News</h4>
        <div className="news-error">
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-news">
      <div className="news-header">
        <h4>📈 Financial News</h4>
        <span className="news-count">{news.length} updates</span>
      </div>
      
      <div className="news-list">
        {news.map((article, index) => (
          <div 
            key={index} 
            className="news-card"
            onClick={() => openArticle(article.url)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && openArticle(article.url)}
          >
            <div className="news-source">
              <span className="source-name">
                {article.source?.name || 'Unknown'}
              </span>
              <span className="news-time">
                {formatTime(article.publishedAt)}
              </span>
            </div>
            
            <h5 className="news-title">
              {article.title.length > 80 
                ? article.title.substring(0, 80) + '...' 
                : article.title}
            </h5>
            
            <p className="news-description">
              {article.description?.length > 100
                ? article.description.substring(0, 100) + '...'
                : article.description || 'No description available.'}
            </p>
            
            {article.urlToImage && (
              <div className="news-image">
                <img 
                  src={article.urlToImage} 
                  alt={article.title}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            
            <div className="news-footer">
              <span className="read-more">Read more →</span>
            </div>
          </div>
        ))}
      </div>
      
      {news.length === 0 && (
        <div className="no-news">
          <p>No financial news available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialNews;