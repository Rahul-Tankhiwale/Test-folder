// components/Navbar.jsx - Updated with ThemeToggle
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // ADD THIS
import ThemeToggle from "./ThemeToggle"; // ADD THIS
import voiceService from "../services/voiceService";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme(); // ADD THIS
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  useEffect(() => {
    // Set up voice service callbacks
    voiceService.setCallbacks(
      (result) => {
        if (result.type === 'transcript' && result.final) {
          setVoiceTranscript(result.final);
        }
        if (result.type === 'status') {
          setIsListening(result.isListening);
        }
      },
      (error) => console.error('Voice error:', error)
    );

    return () => {
      voiceService.stopListening();
    };
  }, []);

  const toggleVoiceModal = () => {
    setShowVoiceModal(!showVoiceModal);
    if (!showVoiceModal) {
      setVoiceTranscript("");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening();
    } else {
      voiceService.startListening();
    }
  };

  const quickVoiceCommands = [
    { text: "Add expense", icon: "💰", action: () => voiceService.speak("Say: Add 50 expense for lunch") },
    { text: "Check balance", icon: "⚖️", action: () => voiceService.speak("Say: What is my balance?") },
    { text: "Show transactions", icon: "📊", action: () => voiceService.speak("Say: Show today's transactions") },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo section */}
        <div className="logo-container">
          <div className="logo-circle">
            <span className="logo-icon">{theme === 'dark' ? '💸' : '💰'}</span> {/* THEME AWARE ICON */}
          </div>
          <h1 className="logo-text">Expense Tracker</h1>
        </div>

        {/* Navigation actions */}
        <div className="nav-actions">
          {/* Theme Toggle - ADD THIS */}
          <ThemeToggle variant="compact" />
          
          {/* Voice command button */}
          <button 
            className={`nav-action-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoiceModal}
            title="Voice Commands"
          >
            <span className="action-icon">🎤</span>
            <span className="action-text">Voice</span>
            {isListening && <span className="pulse-dot"></span>}
          </button>


          {/* User section */}
          {user && (
            <div className="user-section">
              <div className="user-avatar">
                {user.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-greeting">Hi, {user.firstName || user.email.split('@')[0]}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <div className="user-dropdown">
                <button className="dropdown-toggle">▾</button>
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => alert('Profile coming soon!')}>
                    👤 Profile
                  </button>
                  <button className="dropdown-item" onClick={() => alert('Settings coming soon!')}>
                    ⚙️ Settings
                  </button>
                  <button className="dropdown-item" onClick={logout}>
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="voice-modal-overlay" onClick={toggleVoiceModal}>
          <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <h3>🎤 Voice Commands</h3>
              <button className="close-btn" onClick={toggleVoiceModal}>✕</button>
            </div>
            
            <div className="voice-modal-content">
              {/* Status */}
              <div className="voice-status">
                <div className={`status-indicator ${isListening ? 'active' : ''}`}>
                  <div className="status-dot"></div>
                  <span>{isListening ? 'Listening...' : 'Ready'}</span>
                </div>
                <button className={`listen-toggle-btn ${isListening ? 'stop' : 'start'}`} onClick={toggleListening}>
                  {isListening ? '🔴 Stop' : '🎤 Start'}
                </button>
              </div>

              {/* Transcript */}
              {voiceTranscript && (
                <div className="voice-transcript-box">
                  <div className="transcript-label">You said:</div>
                  <div className="transcript-text">{voiceTranscript}</div>
                </div>
              )}

              {/* Quick Commands */}
              <div className="quick-commands">
                <h4>Try saying:</h4>
                <div className="commands-grid">
                  {quickVoiceCommands.map((cmd, index) => (
                    <button key={index} className="command-chip" onClick={cmd.action}>
                      <span className="command-icon">{cmd.icon}</span>
                      <span className="command-text">{cmd.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div className="voice-examples">
                <h4>Examples:</h4>
                <ul className="examples-list">
                  <li>"Add 50 expense for lunch"</li>
                  <li>"Show today's transactions"</li>
                  <li>"What is my balance?"</li>
                  <li>"Delete last transaction"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;