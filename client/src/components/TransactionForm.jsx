import React, { useEffect, useState } from "react";

const empty = {
  _id: null,
  type: "expense",
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

const TransactionForm = ({ onAdd, onUpdate, editingTransaction, cancelEdit }) => {
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        ...editingTransaction,
        amount: editingTransaction.amount.toString(),
      });
    } else {
      setForm(empty);
    }
    setMessage("");
  }, [editingTransaction]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage(""); // Clear message when user types
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = { 
        ...form, 
        amount: Number(form.amount),
        // Ensure date is in correct format
        date: form.date
      };

      if (form._id) {
        // Call updateTransaction
        await onUpdate(payload);
        setMessage("✅ Transaction updated successfully!");
        setForm(empty);
      } else {
        // Call addTransaction
        await onAdd(payload);
        setMessage("✅ Transaction added successfully!");
        setForm(empty);
      }
    } catch (error) {
      console.error("Transaction save error:", error);
      setMessage(`❌ Error: ${error.response?.data?.message || error.message || "Failed to save transaction"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(empty);
    setMessage("");
    cancelEdit();
  };

  return (
    <div className="card form-card">
      <h3>{form._id ? "Edit Transaction" : "Add Transaction"}</h3>
      
      {message && (
        <div className={`form-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={form.type} onChange={handleChange} disabled={loading}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount ($)</label>
            <input 
              name="amount" 
              type="number" 
              value={form.amount} 
              onChange={handleChange} 
              required 
              min="0.01"
              step="0.01"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <input 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Food, Salary"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input 
              name="date" 
              type="date" 
              value={form.date} 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description </label>
          <input 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            placeholder="Add a note..."
            disabled={loading}
          />
        </div>

        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Processing..." : (form._id ? "Update" : "Add")}
          </button>
          {(form._id || form.amount || form.category) && (
            <button 
              type="button" 
              className="btn ghost" 
              onClick={handleCancel}
              disabled={loading}
            >
              {form._id ? "Cancel Edit" : "Clear"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;