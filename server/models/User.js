// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: function() {
        return !this.googleId; // Not required for Google users
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: function() {
        return !this.googleId; // Not required for Google users
      },
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        // Password is required only for non-Google auth users
        return !this.googleId;
      }
    },
    // ========== GOOGLE AUTH FIELDS ==========
    googleId: {
      type: String,
      unique: true,
      sparse: true,  // Allows multiple null values
      index: true
    },
    avatar: {
      type: String,
      default: ""
    },
    isGoogleAuth: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
