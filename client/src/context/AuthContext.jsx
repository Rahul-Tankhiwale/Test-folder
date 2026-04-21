// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage if available
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        
        if (storedToken && storedUser && storedUser !== "undefined") {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
         
        } else {
          console.log("⚠️ No stored auth data found");
        }
      } catch (err) {
        console.error("Error parsing stored data:", err);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    console.log("🔐 Login called with user:", userData?.email);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    console.log("🚪 Logout called");
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = '/login';
  };

  // Check if user is authenticated (only if not loading)
  const isAuthenticated = () => {
    if (loading) return false;
    return !!token && !!user;
  };

  // Get current user safely
  const getCurrentUser = () => {
    return user;
  };

  // Get current token
  const getToken = () => {
    return token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading,
      isAuthenticated,
      getCurrentUser,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
