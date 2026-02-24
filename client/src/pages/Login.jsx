import { useState, useRef, useEffect } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";
import { useTheme } from "../context/ThemeContext"; // ADD THIS
import ThemeToggle from "../components/ThemeToggle"; // ADD THIS

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme(); // ADD THIS
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitButtonRef = useRef(null);

  // Check for saved credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedRememberMe = localStorage.getItem("rememberMe");
    
    if (savedEmail && savedRememberMe === "true") {
      setForm(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Create ripple effect
    if (submitButtonRef.current) {
      createRipple(e);
    }

    try {
      const res = await API.post("/auth/login", form);
      const { user, token } = res.data;

      if (!token) {
        setError("Login succeeded but token not returned by server");
        setLoading(false);
        return;
      }

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("savedEmail", form.email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("rememberMe");
      }

      login(user, token);
      navigate("/");

    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const createRipple = (event) => {
    const button = submitButtonRef.current;
    if (!button) return;

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <h1 className="hero-title">Expense Tracker</h1>
            <p className="hero-subtitle">Take control of your finances with intelligent tracking</p>
            
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span className="feature-text">Real-time Analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span className="feature-text">AI-powered Insights</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📂</span>
                <span className="feature-text">Import-Export Your Files</span>
              </div>
               <div className="feature-item">
                <span className="feature-icon">🎙️</span>
                <span className="feature-text"> Voice Command Control</span>
              </div>
            </div>

            <div className="hero-stats">
              <div className="">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="">
                <div className="stat-number">$1M+</div>
                <div className="stat-label">Tracked</div>
              </div>
              <div className="">
                <div className="stat-number">99%</div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-right-panel">
          {/* Theme Toggle and Language Selector */}
          <div className="auth-controls">
            <ThemeToggle /> {/* ADD THEME TOGGLE HERE */}
            <div className="language-selector">
             
            </div>
          </div>

          <div className="auth-form-container">
            <div className="auth-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-container">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={loading}
                    className="auth-input"
                  />
                  {/* <span className="input-icon"></span> */}
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    disabled={loading}
                    className="auth-input"
                  />
                  {/* <span className="input-icon">🔒</span> */}
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    tabIndex="-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
              </div>

              <button
                ref={submitButtonRef}
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-loader"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>→</span>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>Or continue with</span>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <button  onClick={()=>{alert('Google Authentication feature is coming soon...')}} type="button" className="social-btn google">
                <span className="social-icon">G</span>
                <span>Google</span>
              </button>
              <button  onClick={()=>{alert("GitHub Authentication feature is coming soon...")}} type="button" className="social-btn github">
                <span className="social-icon">🐙</span>
                <span>GitHub</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Sign up now
                </Link>
              </p>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner-large"></div>
                <p>Authenticating...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;