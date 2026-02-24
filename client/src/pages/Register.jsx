import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import "../styles/auth.css";
import "../styles/register.css";
import { useTheme } from "../context/ThemeContext"; // ADD THIS
import ThemeToggle from "../components/ThemeToggle"; // ADD THIS

const Register = () => {
  const navigate = useNavigate();
  const { theme } = useTheme(); // ADD THIS
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "Very Weak";
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "#e15759";
    if (passwordStrength === 2) return "#f28e2c";
    if (passwordStrength === 3) return "#4e79a7";
    return "#59a14f";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 3) {
      setError("Please choose a stronger password");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (res.data?.token && res.data?.user) {
        // Save token and user to localStorage
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // Navigate to dashboard
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-full-page" data-theme={theme}> {/* ADD data-theme */}
      {/* Animated Background */}
      <div className="auth-background"></div>
      
      {/* Main Container */}
      <div className="auth-main-container">
        {/* Left Side - Brand/Info */}
        <div className="auth-left-panel">
          <div className="auth-brand-hero">
            <div className="hero-logo">{theme === 'dark' ? '💸' : '💰'}</div> {/* THEME AWARE ICON */}
            <h1 className="hero-title">Join Expense Tracker</h1>
            <p className="hero-subtitle">Start your journey to financial freedom today</p>
            
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <span className="feature-text">Track spending habits</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span className="feature-text">Set financial goals</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span className="feature-text">Access anywhere</span>
              </div>
            </div>

            <div className="testimonial">
              <div className="testimonial-content">
                "Expense Tracker helped me save 30% more every month. The insights are invaluable!"
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">SR</div>
                <div className="author-info">
                  <div className="author-name">John Doe</div>
                  <div className="author-role">Software Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="auth-right-panel">
          {/* Theme Toggle and Language Selector */}
          <div className="auth-controls">
            <ThemeToggle /> {/* ADD THEME TOGGLE HERE */}
            <div className="language-selector">
              
            </div>
          </div>

          <div className="auth-form-container">
            <div className="auth-form-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <div className="input-container">
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="auth-input"
                    />
                    <span className="input-icon"></span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="input-container">
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="auth-input"
                    />
                    <span className="input-icon"></span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <div className="input-container">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="auth-input select-input"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="input-icon"></span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-container">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="auth-input"
                  />
                  <span className="input-icon"></span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-container">
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="auth-input"
                  />
                  <span className="input-icon"></span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="auth-input"
                  />
                  <span className="input-icon"></span>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      ></div>
                    </div>
                    <div className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-container">
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="auth-input"
                  />
                  <span className="input-icon"></span>
                </div>
              </div>

              <div className="form-options">
                <div className="terms-agreement">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="terms">
                    I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-loader"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>Already have an account?</span>
            </div>

            {/* Login Link */}
            <div className="auth-footer">
              <Link to="/login" className="auth-link-btn">
                <span>←</span>
                <span>Back to Login</span>
              </Link>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner-large"></div>
                <p>Creating your account...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;