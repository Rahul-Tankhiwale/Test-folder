import React, { useState } from "react";
import Navbar from "../components/Navbar";
import SummaryCards from "../components/SummaryCards";
import Charts from "../components/Charts";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import AIInsightsPanel from "../components/AIInsightsPanel";
import VoiceCommand from "../components/VoiceCommand";
import ThemeToggle from "../components/ThemeToggle";
import useTransactions from "../hooks/useTransactions";
import "../styles/dashboard.css";
import "../styles/charts.css"; 
import { useNavigate } from "react-router-dom";

import FinancialNews from '../components/FinancialNews';


const Dashboard = () => {
  const {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    editingTransaction,
    setEditingTransaction,
    totals,
    refreshTransactions,
  } = useTransactions();

  const [voiceTransaction, setVoiceTransaction] = useState(null);
  const navigate = useNavigate();

  // Voice command handlers
  const handleVoiceAddTransaction = (transactionData) => {
    setVoiceTransaction(transactionData);

    // Auto-add after 3 seconds or let user confirm
    setTimeout(() => {
      if (
        voiceTransaction &&
        window.confirm(
          `Add ${transactionData.type}: $${transactionData.amount} for ${transactionData.category}?`,
        )
      ) {
        addTransaction(transactionData);
        setVoiceTransaction(null);
      }
    }, 3000);
  };

  const handleVoiceNavigate = (route) => {
    console.log("Navigate to:", route);
  };

  const handleVoiceFilter = (filter) => {
    console.log("Filter by:", filter);
  };

  const handleVoiceGetBalance = () => {
    alert(`Your current balance is $${totals.balance.toFixed(2)}`);
  };

  const handleVoiceDeleteLast = () => {
    if (transactions.length > 0) {
      const lastTransaction = transactions[0];
      if (
        window.confirm(
          `Delete last transaction: ${lastTransaction.category} - $${lastTransaction.amount}?`,
        )
      ) {
        deleteTransaction(lastTransaction._id);
      }
    }
  };

  // Error handling
  if (error && transactions.length === 0) {
    return (
      <div className="app-root">
        <Navbar />
        <div className="dashboard-error">
          <h2>Error Loading Transactions</h2>
          <p>{error}</p>
          <button onClick={refreshTransactions} className="btn">
            Retry
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="btn ghost"
          >
            Logout & Login Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Navbar />

      <div className="dashboard">
        {/* ================= LEFT SIDEBAR ================= */}
        
        <aside className="dashboard-sidebar">
          <div className="brand">ExpTracker</div>
          <ul>
            <li className="active">Dashboard</li>
            <li onClick={() => navigate("/statements")}>Statements</li>
            <li onClick={() => alert("Payments page coming soon!")}>
              Payments
            </li>
            <li onClick={() => alert("Accounts page coming soon!")}>
              Accounts
            </li>
            <li className="sidebar-theme-toggle">
              <ThemeToggle />
            </li>
            <li
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="logout-item"
            >
              Logout
            </li>
          </ul>
        </aside>
        {/* ================= CENTER ================= */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h1>Dashboard</h1>
            <span className="muted">Overview of your finances</span>
            {error && transactions.length > 0 && (
              <div className="error-banner">
                ⚠️ {error}
                <button onClick={refreshTransactions} className="btn-text">
                  Refresh
                </button>
              </div>
            )}
          </header>

          {/* Summary Cards */}
          <section className="summary-section">
            <SummaryCards totals={totals} loading={loading} />
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            <Charts transactions={transactions} loading={loading} />
          </section>

          {/* Voice & AI Section - Side by side layout */}
          <div className="voice-ai-section">
            <div className="voice-column">
              <VoiceCommand
                onAddTransaction={handleVoiceAddTransaction}
                onNavigate={handleVoiceNavigate}
                onFilter={handleVoiceFilter}
                onGetBalance={handleVoiceGetBalance}
                onDeleteLast={handleVoiceDeleteLast}
              />
            </div>

            <div className="ai-column">
              <AIInsightsPanel
                transactions={transactions}
                userProfile={{
                  monthlyIncome: totals.income,
                  monthlyExpense: totals.expense,
                  balance: totals.balance,
                }}
              />
            </div>
          </div>

          {/* Voice Transaction Preview */}
          {voiceTransaction && (
            <div className="voice-preview card">
              <div className="voice-preview-header">
                <h4>🎤 Voice Transaction Preview</h4>
                <button onClick={() => setVoiceTransaction(null)}>✕</button>
              </div>
              <div className="voice-preview-content">
                <p>
                  <strong>Type:</strong> {voiceTransaction.type}
                </p>
                <p>
                  <strong>Amount:</strong> ${voiceTransaction.amount}
                </p>
                <p>
                  <strong>Category:</strong> {voiceTransaction.category}
                </p>
                <p>
                  <strong>Description:</strong> {voiceTransaction.description}
                </p>
                <div className="voice-preview-actions">
                  <button
                    className="btn"
                    onClick={() => {
                      addTransaction(voiceTransaction);
                      setVoiceTransaction(null);
                    }}
                  >
                    ✓ Confirm & Add
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => setVoiceTransaction(null)}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form + Table */}
          <section className="form-table">
            <div className="form-container">
              <TransactionForm
                onAdd={addTransaction}
                onUpdate={updateTransaction}
                editingTransaction={editingTransaction}
                cancelEdit={() => setEditingTransaction(null)}
              />
            </div>

            <TransactionList
              transactions={transactions}
              loading={loading}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
              onRefresh={refreshTransactions}
            />
          </section>
        </main>
        {/* ================= RIGHT PANEL ================= */}
<aside className="dashboard-right">
  <div className="card info-card">
    <h3>Your Balance</h3>
    <div className="balance">
      {loading ? "Loading..." : `$${totals.balance.toFixed(2)}`}
    </div>
    <div className="balance-sub">
      <span data-label="Income">${totals.income.toFixed(2)}</span>
      <span data-label="Expense">${totals.expense.toFixed(2)}</span>
    </div>
  </div>

 

  <div className="card">
    <h4>Spending Trend</h4>
    <div className="small-chart-wrapper">
      <Charts transactions={transactions} small loading={loading} />
    </div>
  </div>


   {/* Add Financial News Here */}
  <div className="card">
    <FinancialNews />
  </div>

  <div className="card">
    <h4>Quick Stats</h4>
    <div className="quick-stats">
      <div className="stat">
        <span className="stat-label">Transactions:</span>
        <span className="stat-value">{transactions.length}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Last Added:</span>
        <span className="stat-value">
          {transactions.length > 0
            ? formatDate(transactions[0].date)
            : "None"}
        </span>
      </div>
    </div>
  </div>
</aside>
      </div>
    </div>
  );
};

// Helper function for date formatting
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default Dashboard;
