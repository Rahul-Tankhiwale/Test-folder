// client/src/services/googleAuthService.js

class GoogleAuthService {
  // Store token and user data after successful Google login
  static handleGoogleSuccess(token, userData) {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ Google auth data stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Error storing Google auth data:', error);
      return false;
    }
  }

  // Clear all auth data on logout
  static handleGoogleLogout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✅ Google auth data cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing Google auth data:', error);
      return false;
    }
  }

  // Extract token and user from URL (after Google redirect)
  static extractAuthFromUrl() {
    try {
      // Get the full URL
      const currentUrl = window.location.href;
      console.log('📍 Current URL:', currentUrl);
      
      // Parse URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');
      
      console.log('🔍 Token found:', !!token);
      console.log('🔍 User param found:', !!userParam);
      
      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          console.log('✅ User parsed successfully:', user.email);
          return { token, user };
        } catch (parseError) {
          console.error('❌ Error parsing user JSON:', parseError);
          return null;
        }
      }
      
      // Also check hash parameters (if using hash routing)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get('token');
      const hashUser = hashParams.get('user');
      
      if (hashToken && hashUser) {
        const user = JSON.parse(decodeURIComponent(hashUser));
        console.log('✅ User parsed from hash:', user.email);
        return { token: hashToken, user };
      }
      
      console.log('⚠️ No auth data found in URL');
      return null;
    } catch (error) {
      console.error('❌ Error extracting auth from URL:', error);
      return null;
    }
  }

  // Clear URL parameters after extracting
  static cleanUrl() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('user');
      window.history.replaceState({}, document.title, url.toString());
      console.log('✅ URL cleaned successfully');
    } catch (error) {
      console.error('❌ Error cleaning URL:', error);
    }
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get current user data
  static getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get JWT token
  static getToken() {
    return localStorage.getItem('token');
  }

  // Get user's display name
  static getDisplayName() {
    const user = this.getCurrentUser();
    if (user) {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      if (user.firstName) {
        return user.firstName;
      }
      return user.email || 'User';
    }
    return 'Guest';
  }

  // Get user's avatar
  static getAvatar() {
    const user = this.getCurrentUser();
    return user?.avatar || null;
  }

  // Check if user logged in via Google
  static isGoogleUser() {
    const user = this.getCurrentUser();
    return user?.isGoogleAuth === true;
  }
}

export default GoogleAuthService;
