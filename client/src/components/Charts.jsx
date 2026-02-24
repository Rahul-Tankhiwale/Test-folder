import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import "../styles/charts.css";

const COLORS = ["#4E79A7", "#59A14F", "#E15759", "#F28E2B", "#76B7B2", "#EDC948", "#AF7AA1", "#FF9DA7"];

/* ================= HELPERS ================= */

// Group expenses by category
const getCategoryData = (transactions) => {
  const map = {};
  transactions.forEach((t) => {
    if (t.type === 'expense') {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    }
  });
  
  // Convert to array and sort by value (descending)
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

// Group expenses by month for line chart (expenses only)
const getMonthlyExpenseData = (transactions) => {
  const map = {};
  transactions.forEach((t) => {
    if (t.type === 'expense') {
      const date = new Date(t.date);
      const monthYear = date.toLocaleString("default", { month: "short" });
      map[monthYear] = (map[monthYear] || 0) + Number(t.amount);
    }
  });
  
  // Get last 6 months in correct order
  const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const last6Months = Object.entries(map)
    .sort(([a], [b]) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));
  
  return last6Months.length > 0 ? last6Months : [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 }
  ];
};

// Group income vs expenses by month for area chart
const getMonthlyIncomeExpenseData = (transactions) => {
  const map = {};
  transactions.forEach((t) => {
    const date = new Date(t.date);
    const monthYear = date.toLocaleString("default", { month: "short" });
    
    if (!map[monthYear]) {
      map[monthYear] = { month: monthYear, income: 0, expense: 0, net: 0 };
    }
    
    if (t.type === 'income') {
      map[monthYear].income += Number(t.amount);
    } else {
      map[monthYear].expense += Number(t.amount);
    }
    
    map[monthYear].net = map[monthYear].income - map[monthYear].expense;
  });
  
  // Get last 6 months in correct order
  const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Object.values(map)
    .sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month))
    .slice(-6);
};

// Format currency
const formatCurrency = (value) => `$${value.toLocaleString()}`;

// Tooltip for all charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <strong>{label}</strong>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-item" style={{ color: entry.color }}>
            {entry.name}: <strong>{formatCurrency(entry.value)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom label for pie chart - outside labels
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
  if (percent < 0.05) return null; // Don't show labels for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text 
        x={x} 
        y={y} 
        fill="var(--text-secondary)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
      <line
        x1={cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)}
        y1={cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
        x2={x - (x > cx ? 5 : -5)}
        y2={y}
        stroke="var(--border)"
        strokeWidth={1}
      />
    </g>
  );
};

/* ================= COMPONENT ================= */

const Charts = ({ transactions = [], small = false }) => {
  const categoryData = getCategoryData(transactions);
  const monthlyExpenseData = getMonthlyExpenseData(transactions);
  const monthlyIncomeExpenseData = getMonthlyIncomeExpenseData(transactions);

  /* ---------- SMALL SPARKLINE (RIGHT PANEL) ---------- */
  if (small) {
    return (
      <div className="small-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyExpenseData}>
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#4E79A7"
              strokeWidth={2}
              dot={false}
            />
            <Tooltip formatter={(v) => formatCurrency(v)} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="charts-section">
      <div className="charts-header">
        <h3>Financial Analytics</h3>
        <p className="charts-subtitle">Visual insights into your spending patterns</p>
      </div>
      
      <div className="charts-grid">
        {/* ================= DONUT CHART ================= */}
        <div className="chart-card pie-chart-card">
          <div className="chart-header">
            <h4>Spending Distribution</h4>
            <p className="chart-description">
              Shows how your total expenses are divided across categories
            </p>
          </div>

          <div className="chart-container">
            {categoryData.length > 0 ? (
              <div className="pie-chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      label={renderCustomizedLabel}
                      labelLine={true}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v) => formatCurrency(v)}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text)'
                      }}
                    />
                    {/* Center label showing total */}
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="var(--accent)"
                      fontSize={16}
                      fontWeight="bold"
                    >
                      Total
                    </text>
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      dy="20"
                      fill="var(--text)"
                      fontSize={14}
                    >
                      {formatCurrency(categoryData.reduce((sum, item) => sum + item.value, 0))}
                    </text>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend below the chart */}
                <div className="pie-legend">
                  {categoryData.map((entry, index) => (
                    <div key={index} className="legend-item">
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="legend-name">{entry.name}</span>
                      <span className="legend-value">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-data-message">
                <div className="no-data-icon">📊</div>
                <p>No expense data available</p>
                <small>Add some expenses to see the distribution</small>
              </div>
            )}
          </div>
        </div>

        {/* ================= LINE CHART ================= */}
        <div className="chart-card line-chart-card">
          <div className="chart-header">
            <h4>Monthly Expense Trend</h4>
            <p className="chart-description">
              Tracks how your expenses change month-by-month
            </p>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart 
                data={monthlyExpenseData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Monthly Expense"
                  stroke="#4E79A7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, fill: '#4E79A7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= AREA CHART ================= */}
        <div className="chart-card wide area-chart-card">
          <div className="chart-header">
            <h4>Income vs Expenses</h4>
            <p className="chart-description">
              Compares monthly income and expenses with net balance
            </p>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart 
                data={monthlyIncomeExpenseData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#59A14F" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#59A14F" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E15759" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E15759" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Monthly Income"
                  stroke="#59A14F"
                  strokeWidth={2}
                  fill="url(#incomeFill)"
                />
                
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Monthly Expense"
                  stroke="#E15759"
                  strokeWidth={2}
                  fill="url(#expenseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= BAR CHART ================= */}
        <div className="chart-card wide bar-chart-card">
          <div className="chart-header">
            <h4>Monthly Comparison</h4>
            <p className="chart-description">
              Visual comparison of monthly expenses
            </p>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={monthlyExpenseData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--border)" 
                  strokeOpacity={0.3} 
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar
                  dataKey="amount"
                  name="Monthly Expense"
                  fill="#4E79A7"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;