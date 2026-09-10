const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // The produce being ordered
    produceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produce",
      required: true,
    },

    produceName: {
      type: String,
      required: true,
    },

    // The farmer who owns the produce
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The buyer who placed the order
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    buyerType: {
      type: String,
      enum: ["Consumer", "Retailer"],
      default: "Consumer",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerKg: {
      type: Number,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    buyerName: {
      type: String,
      required: true,
    },

    buyerLocation: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Preparing",
        "Out for Delivery",
        "Delivered",
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
  "Order",
  orderSchema
);