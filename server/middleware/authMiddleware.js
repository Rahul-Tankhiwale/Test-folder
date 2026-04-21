// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  let token;
  
  // Check for token in different locations (priority order)
  // 1. Authorization header (Bearer token) - Most common
  // 2. Cookie (if using HTTP-only cookies)
  // 3. Query parameter (for special cases like email verification)
  
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } 
  // Optional: Check cookies for token (if you switch to cookie-based auth)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Optional: Check query parameter (use cautiously, only for specific cases)
  else if (req.query.token) {
    token = req.query.token;
  }

  // If no token found
  if (!token) {
    return res.status(401).json({ 
      message: "Not authorized. No token provided.",
      error: "NO_TOKEN"
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ 
        message: "User no longer exists",
        error: "USER_NOT_FOUND"
      });
    }
    
    // Optional: Check if user is active/verified (add these fields to User model)
    // if (user.isActive === false) {
    //   return res.status(401).json({ 
    //     message: "Account is deactivated",
    //     error: "ACCOUNT_INACTIVE"
    //   });
    // }
    
    // if (user.emailVerified === false) {
    //   return res.status(401).json({ 
    //     message: "Email not verified",
    //     error: "EMAIL_NOT_VERIFIED"
    //   });
    // }
    
    // Attach user to request
    req.user = user;
    
    // Optional: Attach token expiry info for logging
    req.tokenExp = decoded.exp;
    
    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid token",
        error: "INVALID_TOKEN"
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token expired. Please login again.",
        error: "TOKEN_EXPIRED"
      });
    }
    
    // Generic error
    console.error("Auth middleware error:", error);
    res.status(401).json({ 
      message: "Not authorized",
      error: "AUTH_FAILED"
    });
  }
};

// Optional: Middleware for optional authentication (user may or may not be logged in)
const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Invalid token, but continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
};

// Optional: Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

module.exports = { 
  authMiddleware, 
  optionalAuthMiddleware,
  authorize
};
