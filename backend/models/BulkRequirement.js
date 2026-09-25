const mongoose = require("mongoose");

const bulkRequirementSchema = new mongoose.Schema(
  {
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    produceName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    expectedPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryLocation: {
  type: String,
  required: true,
  trim: true,
},

deliveryLatitude: {
  type: Number,
  default: null,
},

deliveryLongitude: {
  type: Number,
  default: null,
},
    requiredBy: {
      type: Date,
      required: true,
    },

    requirements: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Open", "Partially Fulfilled", "Fulfilled", "Closed"],
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "BulkRequirement",
  bulkRequirementSchema
);