const mongoose = require("mongoose");

const produceSchema = new mongoose.Schema(
  {
    // =========================
    // FARMER
    // =========================

    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================
    // PRODUCE INFORMATION
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // FARM LOCATION
    // =========================

    location: {
      type: String,
      required: true,
      trim: true,
    },

    // Latitude of the farm
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      default: null,
    },

    // Longitude of the farm
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      default: null,
    },

    // =========================
    // HARVEST INFORMATION
    // =========================

    harvestDate: {
      type: Date,
      required: true,
    },

    // =========================
    // FOOD TRANSPARENCY
    // =========================

    farmingMethod: {
      type: String,
      default: "",
      trim: true,
    },

    pesticide: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
  type: String,
  default: "",
  trim: true,
},
  },

  // Automatically creates:
  // createdAt
  // updatedAt

  {
    timestamps: true,
  }
);

// =========================
// EXPORT MODEL
// =========================

module.exports = mongoose.model(
  "Produce",
  produceSchema
);