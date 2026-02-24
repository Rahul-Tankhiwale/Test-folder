import React from "react";


const SummaryCards = ({ transactions = [], totals = {} }) => {
  const income = totals.income ?? 0;
  const expense = totals.expense ?? 0;
  const balance = totals.balance ?? income - expense;

  return (
    <div className="summary-cards">
      <div className="card summary">
        <div className="card-title">Income</div>
        <div className="card-value plus">+ ${income.toFixed(2)}</div>
      </div>
      <div className="card summary">
        <div className="card-title">Expense</div>
        <div className="card-value minus">- ${expense.toFixed(2)}</div>
      </div>
      <div className="card summary highlight">
        <div className="card-title">Balance</div>
        <div className="card-value">${balance.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default SummaryCards;
