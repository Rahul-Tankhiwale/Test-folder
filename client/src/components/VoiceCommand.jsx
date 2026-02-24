// components/VoiceCommand.jsx
import React, { useState, useEffect, useRef } from 'react';
import voiceService from '../services/voiceService';
import '../styles/VoiceCommand.css';

const VoiceCommand = ({ 
  onAddTransaction, 
  onNavigate, 
  onFilter, 
  onGetBalance, 
  onDeleteLast,
  onDeleteCategory,
  transactions = [] 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('Click microphone to start');
  const [showCommands, setShowCommands] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [pendingCommand, setPendingCommand] = useState(null);
  
  const historyRef = useRef([]);

  useEffect(() => {
    // Set up callbacks
    voiceService.setCallbacks(
      (result) => handleVoiceResult(result),
      (error) => handleVoiceError(error)
    );

    // Load command history from localStorage
    const savedHistory = localStorage.getItem('voiceCommandHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        historyRef.current = parsed.slice(-10);
        setCommandHistory(historyRef.current);
      } catch (error) {
        console.error('Error loading command history:', error);
      }
    }

    return () => {
      voiceService.stopListening();
    };
  }, []);

  const handleVoiceResult = (result) => {
    switch (result.type) {
      case 'transcript':
        if (result.final) {
          setTranscript(result.final);
          setInterimTranscript('');
          
          // Add to history
          const newHistory = [...historyRef.current, {
            command: result.final,
            timestamp: new Date().toISOString()
          }].slice(-10);
          
          historyRef.current = newHistory;
          setCommandHistory(newHistory);
          localStorage.setItem('voiceCommandHistory', JSON.stringify(newHistory));
        } else {
          setInterimTranscript(result.interim);
        }
        break;

      case 'command':
        setStatus(`✅ ${result.message}`);
        executeVoiceCommand(result.command);
        break;

      case 'security_check':
        setShowSecurityDialog(true);
        setPendingCommand(result.command);
        setStatus('🔒 Security check required');
        voiceService.speak('This action requires confirmation. Please click confirm to proceed.');
        break;

      case 'status':
        setIsListening(result.isListening);
        setStatus(result.message);
        break;

      case 'unknown_command':
        setStatus(`❌ ${result.message}`);
        voiceService.speak(result.message);
        break;
    }
  };

  const handleVoiceError = (error) => {
    console.error('Voice error:', error);
    setStatus(`❌ Error: ${error}`);
    setIsListening(false);
  };

  const executeVoiceCommand = (command) => {
    console.log('Executing command:', command);

    switch (command.type) {
      case 'add_expense':
        if (onAddTransaction) {
          const newTransaction = {
            type: 'expense',
            amount: command.amount,
            category: command.category || 'Other',
            description: command.description,
            date: new Date().toISOString().split('T')[0]
          };
          
          onAddTransaction(newTransaction);
          voiceService.speak(`Added $${command.amount} expense for ${command.category || 'other'}`);
          setStatus(`✅ Added $${command.amount} expense`);
        }
        break;

      case 'add_income':
        if (onAddTransaction) {
          const newTransaction = {
            type: 'income',
            amount: command.amount,
            category: command.category || 'Other Income',
            description: command.description,
            date: new Date().toISOString().split('T')[0]
          };
          
          onAddTransaction(newTransaction);
          voiceService.speak(`Added $${command.amount} income for ${command.category || 'other'}`);
          setStatus(`✅ Added $${command.amount} income`);
        }
        break;

      case 'navigate':
        if (onNavigate) {
          onNavigate(command.route);
          voiceService.speak('Navigating to dashboard');
          setStatus('✅ Navigating to dashboard');
        }
        break;

      case 'scroll_to':
        scrollToElement(command.element);
        voiceService.speak(`Scrolling to ${command.element}`);
        setStatus(`✅ Scrolling to ${command.element}`);
        break;

      case 'filter':
        if (onFilter) {
          onFilter(command.category);
          voiceService.speak(`Filtering by ${command.category}`);
          setStatus(`✅ Filtering by ${command.category}`);
        }
        break;

      case 'filter_date':
        if (onFilter) {
          onFilter({ date: command.date });
          voiceService.speak(`Showing ${command.date}'s transactions`);
          setStatus(`✅ Showing ${command.date}'s transactions`);
        }
        break;

      case 'get_balance':
        if (onGetBalance) {
          const balance = onGetBalance();
          const message = balance !== undefined 
            ? `Your current balance is $${balance}`
            : 'Getting your current balance';
          voiceService.speak(message);
          setStatus(`✅ ${message}`);
        }
        break;

      case 'delete_last':
        if (onDeleteLast && transactions.length > 0) {
          onDeleteLast();
          voiceService.speak('Deleted the last transaction');
          setStatus('✅ Deleted the last transaction');
        } else {
          voiceService.speak('No transactions to delete');
          setStatus('ℹ️ No transactions to delete');
        }
        break;

      case 'delete_category':
        if (onDeleteCategory) {
          onDeleteCategory(command.category);
          voiceService.speak(`Deleted all ${command.category} expenses`);
          setStatus(`✅ Deleted all ${command.category} expenses`);
        }
        break;

      case 'show_help':
        setShowCommands(true);
        voiceService.speak('Here are the available commands');
        setStatus('✅ Showing available commands');
        break;

      case 'stop_listening':
        toggleListening();
        break;

      default:
        console.log('Unknown command type:', command.type);
    }
  };

  const handleSecurityConfirm = () => {
    if (pendingCommand) {
      voiceService.confirmSecurityCommand(true);
      executeVoiceCommand(pendingCommand);
    }
    setShowSecurityDialog(false);
    setPendingCommand(null);
  };

  const handleSecurityCancel = () => {
    voiceService.confirmSecurityCommand(false);
    setShowSecurityDialog(false);
    setPendingCommand(null);
    setStatus('❌ Security check cancelled');
    voiceService.speak('Security check cancelled');
  };

  const scrollToElement = (elementId) => {
    const elements = {
      'transactions': '.transactions-list',
      'summary': '.summary-cards',
      'dashboard': '.dashboard-container'
    };

    const selector = elements[elementId] || elements['dashboard'];
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleListening = () => {
    try {
      if (isListening) {
        voiceService.stopListening();
        setIsListening(false);
        setStatus('Voice recognition stopped');
      } else {
        const started = voiceService.startListening();
        if (started) {
          setIsListening(true);
          setStatus('🎤 Listening... Speak now');
          voiceService.speak('I am listening. Please speak your command.');
        } else {
          setStatus('Failed to start voice recognition');
        }
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const testMicrophone = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setStatus('✅ Microphone is working!');
        voiceService.speak('Microphone is working properly');
      })
      .catch(() => {
        setStatus('❌ Microphone access denied');
        voiceService.speak('Please allow microphone access');
      });
  };

  const availableCommands = [
    { category: "Add Expense", examples: ["Add 50 for lunch", "Spent 25 on groceries", "Paid 30 for gas"] },
    { category: "Add Income", examples: ["Add 1000 from salary", "Received 500 for freelance", "Got 50 as gift"] },
    { category: "Check Balance", examples: ["What is my balance?", "How much money do I have?", "Show my balance"] },
    { category: "View Transactions", examples: ["Show my transactions", "List all expenses", "View today's spending"] },
    { category: "Filter", examples: ["Show food expenses", "Filter by shopping", "View transportation"] },
    { category: "Delete (Security Required)", examples: ["Delete last transaction", "Remove all food expenses", "Clear shopping"] },
    { category: "Navigation", examples: ["Go to dashboard", "Show summary", "View transactions list"] },
    { category: "Help", examples: ["What can I say?", "Show commands", "How to use voice?"] }
  ];

  return (
    <div className="voice-command-container">
      {/* Security Dialog */}
      {showSecurityDialog && (
        <div className="security-dialog-overlay">
          <div className="security-dialog">
            <div className="security-dialog-header">
              <span className="security-icon">🔒</span>
              <h3>Security Check Required</h3>
            </div>
            <div className="security-dialog-content">
              <p>Are you sure you want to proceed with this action?</p>
              {pendingCommand && (
                <div className="pending-command-details">
                  <strong>Command:</strong> {pendingCommand.type === 'delete_last' 
                    ? 'Delete last transaction' 
                    : `Delete all ${pendingCommand.category} expenses`}
                </div>
              )}
              <p className="security-warning">This action cannot be undone!</p>
            </div>
            <div className="security-dialog-actions">
              <button className="btn btn-secondary" onClick={handleSecurityCancel}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleSecurityConfirm}>
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="voice-header">
        <h3>
          <span className="voice-icon">🎤</span>
          Voice Commands
        </h3>
        <button
          className={`voice-toggle-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '🔴 Stop' : '🎤 Start'}
        </button>
      </div>

      <div className="voice-status">
        <div className="status-indicator">
          <div className={`status-dot ${isListening ? 'active' : ''}`}></div>
          <span className="status-text">{status}</span>
        </div>
      </div>

      <div className="voice-transcript">
        <div className="transcript-display">
          {transcript && (
            <div className="final-transcript">
              <strong>You said:</strong> "{transcript}"
            </div>
          )}
          {interimTranscript && (
            <div className="interim-transcript">
              <em>Listening: {interimTranscript}</em>
            </div>
          )}
          {!transcript && !interimTranscript && (
            <div className="placeholder-text">
              {isListening ? 'Speak now...' : 'Click the microphone to start'}
            </div>
          )}
        </div>
        
        {(transcript || interimTranscript) && (
          <button className="clear-btn" onClick={clearTranscript} title="Clear">
            ✕
          </button>
        )}
      </div>

      <div className="voice-controls">
        <button
          className="btn btn-secondary"
          onClick={() => setShowCommands(!showCommands)}
        >
          {showCommands ? 'Hide Commands' : 'Show Commands'}
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={testMicrophone}
        >
          Test Microphone
        </button>
      </div>

      {showCommands && (
        <div className="commands-list">
          <h4>📋 Available Commands:</h4>
          <div className="commands-grid">
            {availableCommands.map((cmd, index) => (
              <div key={index} className="command-card">
                <div className="command-title">{cmd.category}</div>
                <div className="command-examples">
                  {cmd.examples.map((example, idx) => (
                    <div key={idx} className="command-example">"{example}"</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {commandHistory.length > 0 && (
        <div className="command-history">
          <h4>🕒 Recent Commands:</h4>
          <div className="history-list">
            {commandHistory.map((item, index) => (
              <div key={index} className="history-item">
                <span className="history-command">{item.command}</span>
                <span className="history-time">
                  {new Date(item.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
        <div className="browser-warning">
          ⚠️ Voice commands are not supported in your browser. 
          Please use Chrome, Edge, or Safari for the best experience.
        </div>
      )}
    </div>
  );
};

export default VoiceCommand;