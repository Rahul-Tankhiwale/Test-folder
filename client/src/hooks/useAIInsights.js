import { useState, useEffect, useCallback } from 'react';
import AIInsightsService from '../services/aiInsightsService';

const useAIInsights = (transactions, userProfile = {}) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(null);

  const generateInsights = useCallback(() => {
    if (transactions.length < 3) {
      setInsights([]);
      setHealthScore(null);
      return;
    }

    setLoading(true);
    
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        const service = new AIInsightsService(transactions, userProfile);
        const newInsights = service.generateInsights();
        const score = service.getFinancialHealthScore();
        
        setInsights(newInsights);
        setHealthScore(score);
      } catch (error) {
        console.error('Error generating insights:', error);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    }, 100);
  }, [transactions, userProfile]);

  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  const refreshInsights = () => {
    generateInsights();
  };

  return {
    insights,
    loading,
    healthScore,
    refreshInsights,
    hasData: transactions.length >= 3
  };
};

export default useAIInsights;