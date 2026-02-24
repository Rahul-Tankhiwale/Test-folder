import nlp from 'compromise';
import { 
  format, 
  subMonths, 
  differenceInDays, 
  startOfMonth, 
  endOfMonth,
  parseISO,
  isWithinInterval
} from 'date-fns';

class AIInsightsService {
  constructor(transactions, userProfile = {}) {
    this.transactions = transactions;
    this.userProfile = userProfile;
    this.insights = [];
  }

  generateInsights() {
    this.insights = [];
    
    // Run all analysis functions
    this.analyzeSpendingPatterns();
    this.detectUnusualSpending();
    this.suggestSavings();
    this.categorizeSpending();
    this.findDuplicates();
    this.predictFutureSpending();
    this.generateBudgetTips();
    this.analyzeIncomeConsistency();
    
    // Filter and sort insights
    return this.insights
      .filter(insight => insight.confidence > 0.5)
      .sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1, info: 0 };
        return priority[b.severity] - priority[a.severity] || b.confidence - a.confidence;
      })
      .slice(0, 7); // Return top 7 insights
  }

  /* ========== ANALYSIS FUNCTIONS ========== */

  analyzeSpendingPatterns() {
    if (this.transactions.length < 10) return;

    const monthlyData = this.groupByMonth();
    const months = Object.keys(monthlyData);
    
    if (months.length < 2) return;

    const expenses = months.map(month => monthlyData[month].expense);
    const avgExpense = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    
    // Check last month vs average
    const lastMonth = months[months.length - 1];
    const lastMonthExpense = monthlyData[lastMonth].expense;
    const diff = lastMonthExpense - avgExpense;
    const percentChange = (diff / avgExpense) * 100;

    if (Math.abs(percentChange) > 15) {
      this.insights.push({
        type: 'spending_trend',
        title: percentChange > 0 ? 'Spending Increased' : 'Spending Decreased',
        message: `Your spending last month was ${Math.abs(percentChange).toFixed(0)}% ${percentChange > 0 ? 'higher' : 'lower'} than average`,
        icon: percentChange > 0 ? '📈' : '📉',
        severity: Math.abs(percentChange) > 30 ? 'high' : 'medium',
        confidence: 0.8,
        action: percentChange > 0 ? 'Review recent expenses' : 'Great job maintaining budget',
        data: { 
          month: lastMonth, 
          amount: lastMonthExpense, 
          average: avgExpense,
          change: percentChange 
        }
      });
    }
  }

  detectUnusualSpending() {
    const expenses = this.transactions.filter(t => t.type === 'expense');
    if (expenses.length < 5) return;

    // Calculate median expense to avoid outlier skew
    const amounts = expenses.map(t => t.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    
    // Find transactions more than 3x median
    const unusual = expenses.filter(t => t.amount > median * 3);
    
    unusual.forEach(transaction => {
      this.insights.push({
        type: 'unusual_spending',
        title: 'Large Transaction Alert',
        message: `Unusually large ${transaction.category} expense: $${transaction.amount.toFixed(2)}`,
        icon: '⚠️',
        severity: 'medium',
        confidence: 0.7,
        action: 'Verify this was a planned expense',
        data: transaction
      });
    });
  }

  suggestSavings() {
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalIncome > 0) {
      const savings = totalIncome - totalExpense;
      const savingsRate = (savings / totalIncome) * 100;
      
      if (savingsRate < 10) {
        this.insights.push({
          type: 'savings_alert',
          title: 'Low Savings Rate',
          message: `You're saving only ${savingsRate.toFixed(1)}% of your income`,
          icon: '💰',
          severity: 'high',
          confidence: 0.9,
          action: 'Aim to save at least 20% of your income',
          data: { savingsRate, targetRate: 20 }
        });
      } else if (savingsRate > 30) {
        this.insights.push({
          type: 'savings_success',
          title: 'Excellent Savings',
          message: `Great job! You're saving ${savingsRate.toFixed(1)}% of your income`,
          icon: '🎉',
          severity: 'info',
          confidence: 0.95,
          action: 'Consider investing your savings',
          data: { savingsRate }
        });
      }
    }
  }

  categorizeSpending() {
    const expenses = this.transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return;

    const categories = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const totalExpense = Object.values(categories).reduce((a, b) => a + b, 0);
    
    // Find category with highest percentage
    const sortedCategories = Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpense) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      
      if (topCategory.percentage > 35) {
        this.insights.push({
          type: 'category_dominance',
          title: 'Category Dominance',
          message: `${topCategory.category} makes up ${topCategory.percentage.toFixed(1)}% of your expenses`,
          icon: '🎯',
          severity: 'medium',
          confidence: 0.95,
          action: 'Consider diversifying your spending',
          data: topCategory
        });
      }
    }

    // Check for too many small categories
    if (Object.keys(categories).length > 15) {
      this.insights.push({
        type: 'category_spread',
        title: 'Too Many Categories',
        message: 'You have expenses spread across many categories',
        icon: '📋',
        severity: 'low',
        confidence: 0.6,
        action: 'Consider consolidating similar categories',
        data: { categoryCount: Object.keys(categories).length }
      });
    }
  }

  findDuplicates() {
    const expenses = this.transactions.filter(t => t.type === 'expense');
    
    // Group by category, amount, and date proximity
    const potentialDuplicates = [];
    
    for (let i = 0; i < expenses.length; i++) {
      for (let j = i + 1; j < expenses.length; j++) {
        const t1 = expenses[i];
        const t2 = expenses[j];
        
        const sameCategory = t1.category === t2.category;
        const similarAmount = Math.abs(t1.amount - t2.amount) < 1; // Within $1
        const daysBetween = differenceInDays(parseISO(t1.date), parseISO(t2.date));
        
        if (sameCategory && similarAmount && Math.abs(daysBetween) < 3) {
          potentialDuplicates.push({ t1, t2, daysBetween });
        }
      }
    }

    potentialDuplicates.forEach(({ t1, t2 }) => {
      this.insights.push({
        type: 'duplicate_alert',
        title: 'Possible Duplicate Expense',
        message: `Similar ${t1.category} expenses found within a few days`,
        icon: '🔍',
        severity: 'low',
        confidence: 0.6,
        action: 'Check if these are separate expenses',
        data: { 
          first: { ...t1, date: format(parseISO(t1.date), 'MMM dd') },
          second: { ...t2, date: format(parseISO(t2.date), 'MMM dd') }
        }
      });
    });
  }

  predictFutureSpending() {
    const monthlyData = this.groupByMonth();
    const months = Object.keys(monthlyData);
    
    if (months.length >= 2) {
      const monthlyExpenses = months.map(m => monthlyData[m].expense);
      const avgExpense = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;
      
      // Simple trend calculation
      const trend = monthlyExpenses[monthlyExpenses.length - 1] - monthlyExpenses[0];
      const isIncreasing = trend > 0;
      
      this.insights.push({
        type: 'future_prediction',
        title: 'Spending Forecast',
        message: `Based on past ${months.length} months, expect to spend around $${avgExpense.toFixed(2)} monthly`,
        icon: '🔮',
        severity: 'info',
        confidence: 0.7,
        action: isIncreasing ? 'Watch for spending creep' : 'Maintain your spending discipline',
        data: { 
          averageMonthly: avgExpense,
          trend: isIncreasing ? 'increasing' : 'decreasing',
          monthsAnalyzed: months.length 
        }
      });
    }
  }

  generateBudgetTips() {
    const tips = [
      {
        check: () => {
          const foodExpenses = this.transactions
            .filter(t => t.type === 'expense' && 
              ['food', 'dining', 'restaurant', 'groceries', 'coffee'].some(keyword => 
                t.category.toLowerCase().includes(keyword)
              ))
            .reduce((sum, t) => sum + t.amount, 0);
          return foodExpenses > 300;
        },
        insight: {
          type: 'budget_tip',
          title: 'Food Spending',
          message: 'Your food expenses seem high',
          icon: '🍽️',
          severity: 'low',
          confidence: 0.6,
          action: 'Try meal planning to save on food costs'
        }
      },
      {
        check: () => {
          const subscriptions = this.transactions
            .filter(t => t.type === 'expense' && 
              (t.description?.toLowerCase().includes('subscription') ||
               t.category.toLowerCase().includes('subscription') ||
               ['netflix', 'spotify', 'prime', 'disney'].some(service => 
                 t.description?.toLowerCase().includes(service) ||
                 t.category.toLowerCase().includes(service)
               )))
            .length;
          return subscriptions > 3;
        },
        insight: {
          type: 'subscription_alert',
          title: 'Multiple Subscriptions',
          message: 'You have several subscription services',
          icon: '🔄',
          severity: 'low',
          confidence: 0.7,
          action: 'Review and cancel unused subscriptions'
        }
      },
      {
        check: () => {
          const impulsePurchases = this.transactions
            .filter(t => t.type === 'expense' && 
              ['impulse', 'shopping', 'entertainment', 'hobby'].some(keyword =>
                t.category.toLowerCase().includes(keyword)
              ))
            .reduce((sum, t) => sum + t.amount, 0);
          return impulsePurchases > 200;
        },
        insight: {
          type: 'impulse_spending',
          title: 'Impulse Spending',
          message: 'You might be making impulse purchases',
          icon: '🛍️',
          severity: 'medium',
          confidence: 0.6,
          action: 'Implement a 24-hour rule for non-essential purchases'
        }
      }
    ];

    tips.forEach(({ check, insight }) => {
      if (check()) {
        this.insights.push(insight);
      }
    });
  }

  analyzeIncomeConsistency() {
    const incomes = this.transactions.filter(t => t.type === 'income');
    if (incomes.length < 3) return;

    const monthlyIncome = this.groupByMonth();
    const months = Object.keys(monthlyIncome);
    
    const incomeAmounts = months.map(m => monthlyIncome[m].income).filter(amt => amt > 0);
    
    if (incomeAmounts.length >= 2) {
      const avgIncome = incomeAmounts.reduce((a, b) => a + b, 0) / incomeAmounts.length;
      const variance = incomeAmounts.reduce((sum, val) => sum + Math.pow(val - avgIncome, 2), 0) / incomeAmounts.length;
      const stdDev = Math.sqrt(variance);
      const coefficient = (stdDev / avgIncome) * 100;

      if (coefficient > 30) {
        this.insights.push({
          type: 'income_variability',
          title: 'Irregular Income',
          message: 'Your income varies significantly month-to-month',
          icon: '📊',
          severity: 'medium',
          confidence: 0.8,
          action: 'Consider building a larger emergency fund',
          data: { 
            averageIncome: avgIncome,
            variability: coefficient.toFixed(1) + '%',
            monthsAnalyzed: incomeAmounts.length 
          }
        });
      }
    }
  }

  /* ========== HELPER FUNCTIONS ========== */

  groupByMonth() {
    const groups = {};
    
    this.transactions.forEach(t => {
      try {
        const date = parseISO(t.date);
        const monthKey = format(date, 'MMMM yyyy');
        
        if (!groups[monthKey]) {
          groups[monthKey] = { income: 0, expense: 0, count: 0 };
        }
        
        if (t.type === 'income') {
          groups[monthKey].income += t.amount;
        } else {
          groups[monthKey].expense += t.amount;
        }
        groups[monthKey].count++;
      } catch (error) {
        console.error('Date parsing error:', error);
      }
    });
    
    // Sort by date
    const sortedEntries = Object.entries(groups).sort((a, b) => {
      return new Date(a[0]) - new Date(b[0]);
    });
    
    return Object.fromEntries(sortedEntries);
  }

  getFinancialHealthScore() {
    if (this.transactions.length < 5) return null;
    
    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (totalIncome === 0) return 0;
    
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    
    // Calculate score based on savings rate
    let score = 0;
    if (savingsRate < 0) score = 20;
    else if (savingsRate < 10) score = 40;
    else if (savingsRate < 20) score = 60;
    else if (savingsRate < 30) score = 80;
    else score = 100;
    
    return score;
  }
}

export default AIInsightsService;