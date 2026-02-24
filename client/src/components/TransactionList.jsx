import React from "react";

const TransactionList = ({ transactions, onEdit, onDelete, loading, onRefresh, onExport }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="card transactions-list">
        <h3>Transaction History</h3>
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="card transactions-list">
      <div className="table-header">
        <h3>Transaction History ({transactions.length})</h3>
        <div className="table-actions">
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="btn-text"
              title="Refresh transactions"
            >
              🔄 Refresh
            </button>
          )}
          {onExport && transactions.length > 0 && (
            <button 
              onClick={onExport} 
              className="btn-text"
              title="Export to CSV"
              style={{ marginLeft: '10px' }}
            >
              📥 Export CSV
            </button>
          )}
          {transactions.length > 0 && (
            <div className="csv-template">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  // Create sample CSV template
                  const headers = "Date,Category,Description,Type,Amount\n";
                  const example = "2024-01-15,Grocery,Weekly shopping,expense,150.00";
                  const blob = new Blob([headers + example], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'transaction_template.csv';
                  a.click();
                }}
              >
                📋 Download CSV Template
              </a>
            </div>
          )}
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet. Add your first transaction above!</p>
          <div className="csv-template">
            <p>Or import transactions from CSV file</p>
          </div>
        </div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th className="date-col">Date</th>
                <th className="category-col">Category</th>
                <th className="description-col">Description</th>
                <th className="type-col">Type</th>
                <th className="amount-col">Amount</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="date-col">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="category-col">
                    {transaction.category}
                  </td>
                  <td className="description-col" title={transaction.description}>
                    {transaction.description || "-"}
                  </td>
                  <td className="type-col">
                    <span className={`badge ${transaction.type}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`amount-col ${transaction.type}`}>
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => onEdit(transaction)}
                        title="Edit transaction"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this transaction?")) {
                            onDelete(transaction._id);
                          }
                        }}
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <div className="csv-format-hint">
              <small>CSV Format: Date, Category, Description, Type (income/expense), Amount</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionList;