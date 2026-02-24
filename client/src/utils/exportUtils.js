import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportTransactionsToPDF = (transactions, totals) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Transaction Report', 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Summary
  doc.setFontSize(12);
  doc.text('Summary', 14, 42);
  
  doc.setFontSize(10);
  doc.text(`Total Income: $${totals.income.toFixed(2)}`, 14, 50);
  doc.text(`Total Expense: $${totals.expense.toFixed(2)}`, 14, 56);
  doc.text(`Balance: $${totals.balance.toFixed(2)}`, 14, 62);
  
  // Table
  const tableColumn = ["Date", "Category", "Description", "Type", "Amount"];
  const tableRows = [];
  
  transactions.forEach(transaction => {
    const transactionData = [
      new Date(transaction.date).toLocaleDateString(),
      transaction.category,
      transaction.description || '-',
      transaction.type,
      `$${transaction.amount.toFixed(2)}`
    ];
    tableRows.push(transactionData);
  });
  
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'striped',
    headStyles: { fillColor: [78, 121, 167] },
    columnStyles: {
      3: { cellWidth: 20 },
      4: { halign: 'right' }
    }
  });
  
  // Save the PDF
  doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
};