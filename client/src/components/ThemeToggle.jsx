// components/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/ThemeToggle.css';

const ThemeToggle = ({ variant = 'default' }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  return (
    <button
      className={`theme-toggle ${variant}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Current theme: ${isDarkMode ? 'Dark' : 'Light'}`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          {isDarkMode ? (
            <span className="theme-icon">🌙</span>
          ) : (
            <span className="theme-icon">☀️</span>
          )}
        </div>
      </div>
      <span className="theme-text">
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;