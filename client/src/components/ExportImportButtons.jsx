import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import API from '../api/axios';
import '../styles/ExportImportButtons.css';

const ExportImportButtons = ({ transactions, onImportSuccess }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [activeExport, setActiveExport] = useState(null);
  const fileInputRef = useRef(null);

  // Export to CSV
  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    setActiveExport('csv');
    
    const csvData = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
      Category: t.category,
      Description: t.description || '',
      Type: t.type,
      Amount: t.amount
    }));

    const csv = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ','
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = `expense_tracker_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
    
    setTimeout(() => setActiveExport(null), 2000);
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!transactions || transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    setActiveExport('pdf');
    
    try {
      // Using jsPDF for PDF generation
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('Expense Tracker Report', 20, 20);
      
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add summary
      const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      }, { income: 0, expense: 0 });
      
      totals.balance = totals.income - totals.expense;
      
      pdf.text(`Total Transactions: ${transactions.length}`, 20, 45);
      pdf.text(`Total Income: $${totals.income.toFixed(2)}`, 20, 55);
      pdf.text(`Total Expenses: $${totals.expense.toFixed(2)}`, 20, 65);
      pdf.text(`Net Balance: $${totals.balance.toFixed(2)}`, 20, 75);
      
      // Add transactions table
      let y = 90;
      pdf.setFontSize(10);
      
      // Table header
      pdf.setFillColor(200, 200, 200);
      pdf.rect(20, y, 170, 8, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Date', 22, y + 6);
      pdf.text('Category', 50, y + 6);
      pdf.text('Description', 90, y + 6);
      pdf.text('Type', 140, y + 6);
      pdf.text('Amount', 160, y + 6);
      
      y += 12;
      
      // Table rows
      transactions.slice(0, 20).forEach((t, i) => {
        if (y > 270) return; // Prevent overflow
        
        pdf.setTextColor(0, 0, 0);
        pdf.text(new Date(t.date).toLocaleDateString(), 22, y);
        pdf.text(t.category, 50, y);
        pdf.text(t.description || '-', 90, y);
        pdf.text(t.type.charAt(0).toUpperCase() + t.type.slice(1), 140, y);
        
        // Color code amounts
        if (t.type === 'income') {
          pdf.setTextColor(0, 128, 0);
          pdf.text(`$${t.amount}`, 160, y);
        } else {
          pdf.setTextColor(255, 0, 0);
          pdf.text(`$${t.amount}`, 160, y);
        }
        
        y += 8;
      });
      
      if (transactions.length > 20) {
        pdf.text(`... and ${transactions.length - 20} more transactions`, 20, y + 10);
      }
      
      const fileName = `expense_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error generating PDF. Please try CSV export instead.');
    } finally {
      setActiveExport(null);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!transactions || transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    setActiveExport('excel');
    
    try {
      const XLSX = await import('xlsx');
      
      // Format data for Excel
      const excelData = transactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString('en-CA'),
        Category: t.category,
        Description: t.description || '',
        Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
        Amount: Number(t.amount),
        'Amount ($)': `$${Number(t.amount).toFixed(2)}`
      }));
      
      // Add summary row
      const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') {
          acc.income += Number(t.amount);
        } else {
          acc.expense += Number(t.amount);
        }
        return acc;
      }, { income: 0, expense: 0 });
      
      totals.balance = totals.income - totals.expense;
      
      const summaryRow = [
        {
          Date: 'SUMMARY',
          Category: '',
          Description: '',
          Type: '',
          Amount: '',
          'Amount ($)': ''
        },
        {
          Date: 'Total Income',
          Category: '',
          Description: '',
          Type: '',
          Amount: totals.income,
          'Amount ($)': `$${totals.income.toFixed(2)}`
        },
        {
          Date: 'Total Expense',
          Category: '',
          Description: '',
          Type: '',
          Amount: totals.expense,
          'Amount ($)': `$${totals.expense.toFixed(2)}`
        },
        {
          Date: 'Net Balance',
          Category: '',
          Description: '',
          Type: '',
          Amount: totals.balance,
          'Amount ($)': `$${totals.balance.toFixed(2)}`
        }
      ];
      
      const allData = [...excelData, ...summaryRow];
      
      const worksheet = XLSX.utils.json_to_sheet(allData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      // Auto-size columns
      const maxWidth = allData.reduce((w, r) => Math.max(w, r.Category ? r.Category.length : 1), 10);
      worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: Math.max(maxWidth, 10) }, // Category
        { wch: 30 }, // Description
        { wch: 10 }, // Type
        { wch: 12 }, // Amount
        { wch: 12 }  // Amount ($)
      ];
      
      const fileName = `expense_tracker_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Error generating Excel file. Please try CSV export instead.');
    } finally {
      setActiveExport(null);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExtension) && !validTypes.includes(file.type)) {
      setImportStatus({ 
        type: 'error', 
        message: 'Please select a CSV file (.csv)' 
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImportStatus({ 
        type: 'error', 
        message: 'File size too large. Maximum 5MB allowed.' 
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: 'loading', message: 'Reading file...' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsImporting(false);
        
        if (results.errors.length > 0) {
          setImportStatus({ 
            type: 'error', 
            message: 'Error parsing CSV file. Please check the format.' 
          });
          return;
        }

        if (results.data.length === 0) {
          setImportStatus({ 
            type: 'error', 
            message: 'File is empty or contains no valid data.' 
          });
          return;
        }

        setImportData(results.data);
        setImportStatus({ 
          type: 'success', 
          message: `Successfully loaded ${results.data.length} records. Preview below.` 
        });
      },
      error: (error) => {
        setIsImporting(false);
        setImportStatus({ 
          type: 'error', 
          message: 'Error reading file. Please try again.' 
        });
        console.error('CSV parse error:', error);
      }
    });
  };

  // Validate imported data
  const validateImportData = (data) => {
    const errors = [];
    const validTypes = ['income', 'expense'];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because: 1 for header, 1 for 0-based index
      
      // Check required fields
      if (!row.Date) {
        errors.push(`Row ${rowNumber}: Missing Date field`);
      }
      
      if (!row.Category) {
        errors.push(`Row ${rowNumber}: Missing Category field`);
      }
      
      if (!row.Type) {
        errors.push(`Row ${rowNumber}: Missing Type field`);
      }
      
      if (!row.Amount) {
        errors.push(`Row ${rowNumber}: Missing Amount field`);
      }
      
      // Check amount is numeric
      if (row.Amount && isNaN(parseFloat(row.Amount))) {
        errors.push(`Row ${rowNumber}: Amount must be a number (found: "${row.Amount}")`);
      }
      
      // Check type is valid
      if (row.Type && !validTypes.includes(row.Type.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Type must be "income" or "expense" (found: "${row.Type}")`);
      }
      
      // Check date format
      if (row.Date) {
        const date = new Date(row.Date);
        if (isNaN(date.getTime())) {
          errors.push(`Row ${rowNumber}: Invalid date format (use YYYY-MM-DD or MM/DD/YYYY)`);
        }
      }
    });
    
    return errors;
  };

  // Process imported data
  const processImportData = (data) => {
    return data.map(row => {
      // Parse date
      let date = new Date(row.Date);
      if (isNaN(date.getTime())) {
        // Try different date formats
        const formats = [
          'YYYY-MM-DD',
          'MM/DD/YYYY',
          'DD/MM/YYYY',
          'YYYY/MM/DD'
        ];
        
        for (const format of formats) {
          const parts = row.Date.split(/[\/\-]/);
          if (parts.length === 3) {
            if (format === 'YYYY-MM-DD') {
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else if (format === 'MM/DD/YYYY') {
              date = new Date(parts[2], parts[0] - 1, parts[1]);
            } else if (format === 'DD/MM/YYYY') {
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else if (format === 'YYYY/MM/DD') {
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
            
            if (!isNaN(date.getTime())) break;
          }
        }
      }
      
      const formattedDate = date.toISOString().split('T')[0];
      
      // Ensure amount is number
      const amount = parseFloat(row.Amount) || 0;
      
      return {
        date: formattedDate,
        category: row.Category.trim(),
        description: (row.Description || '').trim(),
        type: row.Type.toLowerCase(),
        amount: amount
      };
    });
  };

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!importData || importData.length === 0) {
      setImportStatus({ type: 'error', message: 'No data to import' });
      return;
    }

    // Validate data
    const errors = validateImportData(importData);
    if (errors.length > 0) {
      setImportStatus({ 
        type: 'error', 
        message: `Validation errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n... and more' : ''}` 
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: 'loading', message: 'Importing transactions...' });

    try {
      // Process data
      const processedData = processImportData(importData);
      
      // Send to backend
      const response = await API.post('/transactions/bulk', {
        transactions: processedData
      });
      
      setIsImporting(false);
      setImportStatus({ 
        type: 'success', 
        message: `Successfully imported ${processedData.length} transactions!` 
      });
      
      // Call onImportSuccess callback
      if (onImportSuccess) {
        onImportSuccess(processedData);
      }
      
      // Close modal after 3 seconds
      setTimeout(() => {
        handleCloseModal();
      }, 3000);
      
    } catch (error) {
      setIsImporting(false);
      const errorMessage = error.response?.data?.message || error.message || 'Import failed';
      setImportStatus({ 
        type: 'error', 
        message: `Import failed: ${errorMessage}` 
      });
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const templateData = [
      {
        Date: '2024-01-15',
        Category: 'Groceries',
        Description: 'Weekly shopping',
        Type: 'expense',
        Amount: '150.00'
      },
      {
        Date: '2024-01-16',
        Category: 'Salary',
        Description: 'Monthly salary',
        Type: 'income',
        Amount: '5000.00'
      },
      {
        Date: '2024-01-17',
        Category: 'Rent',
        Description: 'Monthly rent payment',
        Type: 'expense',
        Amount: '1200.00'
      }
    ];

    const csv = Papa.unparse(templateData, {
      quotes: true,
      delimiter: ','
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'expense_tracker_template.csv');
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowImportModal(false);
    setImportData(null);
    setImportStatus({ type: '', message: '' });
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="export-import-container">
        {/* Export Dropdown */}
        <div className="dropdown export-dropdown">
          <button className="export-btn">
            <span className="export-icon">📥</span>
            <span className="export-text">Export</span>
            <span className="dropdown-arrow">▾</span>
          </button>
          
          <div className="dropdown-menu export-menu">
            <button 
              onClick={exportToCSV} 
              className="dropdown-item"
              disabled={!transactions || transactions.length === 0}
            >
              <span className="item-icon">📊</span>
              <div className="item-content">
                <div className="item-title">Export to CSV</div>
                <div className="item-description">Download as CSV file</div>
                {activeExport === 'csv' && <div className="item-loading">Exporting...</div>}
              </div>
            </button>
            
            <button 
              onClick={exportToExcel} 
              className="dropdown-item"
              disabled={!transactions || transactions.length === 0}
            >
              <span className="item-icon">📈</span>
              <div className="item-content">
                <div className="item-title">Export to Excel</div>
                <div className="item-description">Download as Excel file</div>
                {activeExport === 'excel' && <div className="item-loading">Exporting...</div>}
              </div>
            </button>
            
            <button 
              onClick={exportToPDF} 
              className="dropdown-item"
              disabled={!transactions || transactions.length === 0}
            >
              <span className="item-icon">📄</span>
              <div className="item-content">
                <div className="item-title">Export to PDF</div>
                <div className="item-description">Download as PDF report</div>
                {activeExport === 'pdf' && <div className="item-loading">Exporting...</div>}
              </div>
            </button>
            
            <div className="dropdown-divider"></div>
            
            <button 
              onClick={() => setShowImportModal(true)} 
              className="dropdown-item import-item"
            >
              <span className="item-icon">📤</span>
              <div className="item-content">
                <div className="item-title">Import Data</div>
                <div className="item-description">Upload CSV file</div>
              </div>
            </button>
          </div>
        </div>

        {/* Import button (alternative) */}
        <button 
          onClick={() => setShowImportModal(true)} 
          className="import-btn"
        >
          <span className="import-icon">📤</span>
          <span className="import-text">Import</span>
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Transactions</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-content">
              {/* Status Message */}
              {importStatus.message && (
                <div className={`status-message ${importStatus.type}`}>
                  {importStatus.type === 'loading' && <div className="status-spinner"></div>}
                  <span>{importStatus.message}</span>
                </div>
              )}
              
              {/* File Upload Area */}
              <div 
                className={`file-upload-area ${importData ? 'has-data' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="file-input"
                  id="csv-upload"
                  disabled={isImporting}
                />
                
                <label htmlFor="csv-upload" className="file-upload-label">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <strong>Drag & drop CSV file here</strong>
                    <span>or click to browse</span>
                  </div>
                  <div className="upload-hint">Max file size: 5MB</div>
                </label>
              </div>
              
              {/* Template Download */}
              <div className="template-section">
                <button onClick={downloadTemplate} className="template-btn">
                  <span className="template-icon">📋</span>
                  Download CSV Template
                </button>
                <div className="template-note">
                  Use our template to ensure proper formatting
                </div>
              </div>
              
              {/* Data Preview */}
              {importData && importData.length > 0 && (
                <div className="data-preview">
                  <h4>Preview ({importData.length} records)</h4>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {Object.keys(importData[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, i) => (
                              <td key={i}>{String(value)}</td>
                            ))}
                          </tr>
                        ))}
                        {importData.length > 5 && (
                          <tr>
                            <td colSpan={Object.keys(importData[0]).length} className="preview-more">
                              ... and {importData.length - 5} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="modal-actions">
                <button 
                  onClick={handleCloseModal} 
                  className="btn ghost"
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImportConfirm} 
                  className="btn primary"
                  disabled={!importData || isImporting}
                >
                  {isImporting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Importing...
                    </>
                  ) : (
                    `Import ${importData ? importData.length : 0} Transactions`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportImportButtons;