import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TransactionList from "../components/TransactionList";
import ExportImportButtons from "../components/ExportImportButtons";
import ThemeToggle from "../components/ThemeToggle";
import useTransactions from "../hooks/useTransactions";
import "../styles/statements.css";

const Statements = () => {
  const navigate = useNavigate();
  const {
    transactions,
    loading,
    error,
    refreshTransactions,
    totals
  } = useTransactions();

  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (filter !== "all" && transaction.type !== filter) {
      return false;
    }

    // Filter by date range
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    
    if (dateRange === "today") {
      const today = new Date();
      return transactionDate.toDateString() === today.toDateString();
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return transactionDate >= weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return transactionDate >= monthAgo;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        transaction.category.toLowerCase().includes(term) ||
        transaction.description.toLowerCase().includes(term) ||
        transaction.amount.toString().includes(term)
      );
    }

    return true;
  });

  // Calculate filtered totals
  const filteredTotals = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += Number(transaction.amount);
      } else {
        acc.expense += Number(transaction.amount);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  filteredTotals.balance = filteredTotals.income - filteredTotals.expense;

  // Handle import success
  const handleImportSuccess = (importedData) => {
    alert(`Successfully imported ${importedData.length} transactions!`);
    refreshTransactions();
  };

  return (
    <div className="app-root">
      <Navbar />

      <div className="dashboard">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="dashboard-sidebar">
          <div className="brand">ExpTracker</div>
          <ul>
            <li onClick={() => navigate("/")}>Dashboard</li>
            <li className="active">Statements</li>
            <li onClick={() => alert("Payments page coming soon!")}>Payments</li>
            <li onClick={() => alert("Accounts page coming soon!")}>Accounts</li>
            <li className="sidebar-theme-toggle">
              <ThemeToggle />
            </li>
            <li 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="logout-item"
            >
              Logout
            </li>
          </ul>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="statements-main">
          <header className="statements-header">
            <div className="header-left">
              <h1>Transaction Statements</h1>
             
              <span className="muted">View and manage all your transactions</span>
            </div>
            
            <div className="header-actions">
              <ExportImportButtons 
                transactions={filteredTransactions}
                onImportSuccess={handleImportSuccess}
              />
            </div>
          </header>

          {/* Filter Controls */}
          <div className="filter-section card">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="filter">Transaction Type</label>
                <select 
                  id="filter" 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="dateRange">Date Range</label>
                <select 
                  id="dateRange" 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="search">Search</label>
                <div className="search-container">
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by category, description, amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                  {searchTerm && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTerm("")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-group">
                <label>&nbsp;</label>
                <button 
                  onClick={() => {
                    setFilter("all");
                    setDateRange("all");
                    setSearchTerm("");
                  }}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="filter-summary">
              <div className="summary-item">
                <span className="summary-label">Showing</span>
                <span className="summary-value">{filteredTransactions.length} of {transactions.length} transactions</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Filtered Income</span>
                <span className="summary-value income">${filteredTotals.income.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Filtered Expense</span>
                <span className="summary-value expense">${filteredTotals.expense.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Filtered Balance</span>
                <span className={`summary-value ${filteredTotals.balance >= 0 ? 'positive' : 'negative'}`}>
                  ${filteredTotals.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="statements-content">
            <TransactionList
              transactions={filteredTransactions}
              loading={loading}
              onRefresh={refreshTransactions}
              showActions={true}
            />
          </div>

          {/* Pagination (if needed in future) */}
          {filteredTransactions.length > 50 && (
            <div className="pagination card">
              <button className="pagination-btn" disabled>← Previous</button>
              <span className="pagination-info">Page 1 of 1</span>
              <button className="pagination-btn" disabled>Next →</button>
            </div>
          )}
        </main>

        {/* ================= RIGHT PANEL ================= */}
        <aside className="dashboard-right">
          <div className="card info-card">
            <h3>Export Options</h3>
            <div className="export-options">
              <button className="export-option-btn">
                <span className="export-icon">📊</span>
                <div className="export-details">
                  <div className="export-title">Export as CSV</div>
                  <div className="export-desc">Download in spreadsheet format</div>
                </div>
              </button>
              
              <button className="export-option-btn">
                <span className="export-icon">📄</span>
                <div className="export-details">
                  <div className="export-title">Export as PDF</div>
                  <div className="export-desc">Print-friendly format</div>
                </div>
              </button>
              
              <button className="export-option-btn">
                <span className="export-icon">📈</span>
                <div className="export-details">
                  <div className="export-title">Export as Excel</div>
                  <div className="export-desc">Microsoft Excel format</div>
                </div>
              </button>
            </div>
          </div>

          <div className="card">
            <h4>Quick Stats</h4>
            <div className="quick-stats">
              <div className="stat">
                <span className="stat-label">Total Transactions:</span>
                <span className="stat-value">{transactions.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Income Total:</span>
                <span className="stat-value income">${totals.income.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Expense Total:</span>
                <span className="stat-value expense">${totals.expense.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Net Balance:</span>
                <span className={`stat-value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
                  ${totals.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4>Tips</h4>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">Use filters to find specific transactions quickly</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">Export your data regularly for backup</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span className="tip-text">Search by category names for better results</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Statements;