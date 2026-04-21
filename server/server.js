// server/server.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet"); // Install: npm install helmet

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

const app = require("./app");

// Add security headers to the main server
app.use(helmet()); // Helmet adds various security headers

// Additional custom security headers
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy (CSP) - Adjust as needed
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://*.googleusercontent.com; " +
    "font-src 'self'; " +
    "connect-src 'self' http://localhost:5000 https://accounts.google.com; " +
    "frame-src 'self' https://accounts.google.com;"
  );
  
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Security headers enabled`);
});
