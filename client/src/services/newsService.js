// services/newsService.js
const API_KEY = process.env.REACT_APP_NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

export const fetchFinancialNews = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/everything?q=finance OR investing OR stocks OR economy&language=en&sortBy=publishedAt&apiKey=${API_KEY}&pageSize=5`
    );
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

// Or using Alpha Vantage
export const fetchMarketNews = async () => {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${API_KEY}&limit=5`
    );
    const data = await response.json();
    return data.feed || [];
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
};