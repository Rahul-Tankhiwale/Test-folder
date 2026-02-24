import { useEffect, useState } from "react";
import API from "../api/axios";

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================= FETCH ================= */
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error("Fetch error", err);
      setError(err?.response?.data?.message || "Failed to fetch transactions");
      
      // If unauthorized, don't redirect here - let axios interceptor handle it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ================= ADD ================= */
  const addTransaction = async (data) => {
    try {
      setError(null);
      const res = await API.post("/transactions", data);
      setTransactions((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error("Add transaction error", err);
      setError(err?.response?.data?.message || "Failed to add transaction");
      throw err;
    }
  };

  /* ================= UPDATE ================= */
  const updateTransaction = async (data) => {
    try {
      setError(null);
      const res = await API.put(`/transactions/${data._id}`, data);
      setTransactions((prev) =>
        prev.map((t) => (t._id === data._id ? res.data : t))
      );
      setEditingTransaction(null);
      return res.data;
    } catch (err) {
      console.error("Update transaction error", err);
      setError(err?.response?.data?.message || "Failed to update transaction");
      throw err;
    }
  };

  /* ================= DELETE ================= */
  const deleteTransaction = async (id) => {
    try {
      setError(null);
      await API.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      if (editingTransaction?._id === id) {
        setEditingTransaction(null);
      }
      return true;
    } catch (err) {
      console.error("Delete transaction error", err);
      setError(err?.response?.data?.message || "Failed to delete transaction");
      throw err;
    }
  };

  /* ================= TOTALS ================= */
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expense += t.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );

  /* ================= REFRESH ================= */
  const refreshTransactions = () => {
    fetchTransactions();
  };

  return {
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
  };
}