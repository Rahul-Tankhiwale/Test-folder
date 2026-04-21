// client/src/pages/AuthSuccess.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const hasProcessed = useRef(false); // ✅ Use ref to prevent multiple executions

  useEffect(() => {
    // ✅ Prevent multiple executions
    if (hasProcessed.current) {
      // console.log('⚠️ Already processed, skipping...');
      return;
    }
    
    const handleAuth = () => {
      // console.log('🔵 AuthSuccess component processing');
      
      // ✅ Check if already authenticated
      if (isAuthenticated()) {
        // console.log('✅ User already authenticated, redirecting to dashboard');
        hasProcessed.current = true;
        navigate('/', { replace: true });
        return;
      }
      
      // Extract token and user from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');
      
      console.log('🔍 Token found:', !!token);
      console.log('🔍 User param found:', !!userParam);
      
      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          // console.log('✅ User parsed:', user.email);
          
          // ✅ Mark as processed BEFORE navigation
          hasProcessed.current = true;
          
          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update AuthContext
          login(user, token);
          
          // Clean URL and redirect to dashboard
          window.history.replaceState({}, document.title, window.location.pathname);
          // console.log('✅ Redirecting to dashboard...');
          navigate('/', { replace: true });
          
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          hasProcessed.current = true;
          navigate('/login?error=auth_failed', { replace: true });
        }
      } else {
        console.error('❌ Missing token or user in URL');
        // console.log('Current URL:', window.location.href);
        
        // ✅ Only redirect to login if we're not already on dashboard
        if (!isAuthenticated() && window.location.pathname !== '/') {
          hasProcessed.current = true;
          navigate('/login?error=missing_auth_data', { replace: true });
        }
      }
    };
    
    // ✅ Small delay to ensure everything is loaded
    const timer = setTimeout(handleAuth, 100);
    return () => clearTimeout(timer);
  }, [navigate, login, isAuthenticated]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #4e79a7',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ marginTop: '20px', color: '#666' }}>Completing Google login...</p>
    </div>
  );
};

export default AuthSuccess;
