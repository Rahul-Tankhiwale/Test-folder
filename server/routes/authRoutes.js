// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const { OAuth2Client } = require('google-auth-library'); // ADD THIS
const { register, login } = require("../controllers/authController");
const generateToken = require("../utils/generateToken"); 

// Initialize Google OAuth2 client for token verification
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ========== REGULAR AUTH ROUTES (Existing) ==========
router.post("/register", register);
router.post("/login", login);

// ========== GOOGLE AUTH ROUTES ==========

// Route 1: Initiate Google Login
router.get("/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account",
    state: true // Enable state parameter for CSRF protection
  })
);

// Route 2: Google Callback URL with Enhanced Security
router.get("/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false,
    failureMessage: true
  }),
  async (req, res) => {
    try {
      // Validate that user exists in passport session
      if (!req.user) {
        console.error("No user in session after Google auth");
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user_data`);
      }
      
      const user = req.user;
      
      // Additional validation: Check if user data is complete
      if (!user.email || !user._id) {
        console.error("Incomplete user data:", user);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=incomplete_user_data`);
      }
      
      // Generate JWT token
      const token = generateToken(user._id);
      
      // Prepare user data (exclude sensitive info)
      const userData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar || "",
        isGoogleAuth: user.isGoogleAuth || true
      };
      
      // Log successful authentication (for audit)
      console.log(`Google auth success: ${user.email} at ${new Date().toISOString()}`);
      
      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?token=${token}&user=${encodeURIComponent(
          JSON.stringify(userData)
        )}`
      );
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
);

// Route 2.5: Alternative Google Token Verification (for frontend token validation)
router.post("/google/verify", async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: "No credential provided" 
      });
    }
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Google token" 
      });
    }
    
    // Extract user data from verified payload
    const { email, given_name, family_name, picture, sub } = payload;
    
    // Check if user exists in database
    let user = await User.findOne({ 
      $or: [
        { googleId: sub },
        { email: email }
      ]
    });
    
    if (!user) {
      // Create new user
      user = await User.create({
        firstName: given_name || '',
        lastName: family_name || '',
        email: email,
        googleId: sub,
        avatar: picture || '',
        isGoogleAuth: true,
        password: Math.random().toString(36).slice(-16)
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = sub;
      user.avatar = picture || user.avatar;
      user.isGoogleAuth = true;
      await user.save();
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Return success response
    res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar || "",
        isGoogleAuth: true
      }
    });
    
  } catch (error) {
    console.error("Google token verification error:", error);
    res.status(401).json({ 
      success: false, 
      message: "Google authentication failed",
      error: error.message 
    });
  }
});

// Route 3: Login Success with Enhanced Security
router.get("/login/success", (req, res) => {
  if (req.user) {
    // Validate session user
    const token = generateToken(req.user._id);
    
    // Remove sensitive data
    const safeUser = {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      avatar: req.user.avatar || "",
      isGoogleAuth: req.user.isGoogleAuth || false
    };
    
    res.status(200).json({
      success: true,
      message: "User authenticated",
      user: safeUser,
      token: token
    });
  } else {
    res.status(401).json({
      success: false,
      message: "User not authenticated"
    });
  }
});

// Route 4: Login Failed with Detailed Error
router.get("/login/failed", (req, res) => {
  const error = req.query.error || "Google authentication failed";
  const message = req.query.message || "Unable to authenticate with Google";
  
  res.status(401).json({
    success: false,
    message: message,
    error: error,
    timestamp: new Date().toISOString()
  });
});

// Route 5: Logout with Session Cleanup
router.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ 
        success: false,
        message: "Logout failed" 
      });
    }
    
    // Destroy session
    req.session = null;
    
    // Clear any cookies
    res.clearCookie('session');
    
    res.status(200).json({ 
      success: true, 
      message: "Logged out successfully",
      timestamp: new Date().toISOString()
    });
  });
});

// Route 6: Get Current User with Validation
router.get("/current-user", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No user logged in"
      });
    }
    
    // Fetch fresh user data from database
    const freshUser = await User.findById(req.user._id).select('-password');
    
    if (!freshUser) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    
    const userData = {
      id: freshUser._id,
      firstName: freshUser.firstName,
      lastName: freshUser.lastName,
      email: freshUser.email,
      avatar: freshUser.avatar || "",
      isGoogleAuth: freshUser.isGoogleAuth || false
    };
    
    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Route 7: Validate Token (for frontend to check token validity)
router.post("/validate-token", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "No token provided" 
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Token is valid",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
});

module.exports = router;
