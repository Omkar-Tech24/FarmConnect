const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================
    // ACCOUNT INFORMATION
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    role: {
      type: String,
      enum: [
        "Farmer",
        "Consumer",
        "Retailer",
        "Admin",
      ],
      required: true,
    },

    // =========================
    // PROFILE PHOTO
    // =========================

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // FARMER PROFILE
    // =========================

    farmName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    farmSize: {
      type: Number,
      default: null,
      min: 0,
    },

    farmingSince: {
      type: Number,
      default: null,
      min: 1900,
      max: new Date().getFullYear(),
    },

    farmingType: {
      type: String,
      enum: [
        "",
        "Organic",
        "Conventional",
        "Natural",
        "Mixed",
      ],
      default: "",
    },

    mainCrops: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // =========================
    // VERIFICATION
    // =========================

    verificationStatus: {
      type: String,
      enum: [
        "Pending",
        "Verified",
        "Rejected",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);