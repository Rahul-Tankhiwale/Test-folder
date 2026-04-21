// server/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile.emails[0].value);
        
        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ]
        });

        if (user) {
          console.log('Existing user found:', user.email);
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            user.isGoogleAuth = true;
            await user.save();
          }
          return done(null, user);
        }

        console.log('Creating new user for:', profile.emails[0].value);
        user = await User.create({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0].value,
          isGoogleAuth: true,
          password: Math.random().toString(36).slice(-16),
          phone: '', // Empty string for Google users
          gender: 'other' // Default gender for Google users
        });

        console.log('New user created successfully:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

// ✅ DISABLE SESSIONS (since you're using JWT)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
