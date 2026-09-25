const mongoose = require("mongoose");

const bulkOfferSchema = new mongoose.Schema(
  {
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkRequirement",
      required: true,
    },

    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    offeredQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    offeredPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Countered"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BulkOffer", bulkOfferSchema);