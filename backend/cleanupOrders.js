require("dotenv").config();
const mongoose = require("mongoose");

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const db = mongoose.connection.db;
    const orders = db.collection("orders");

    const result = await orders.updateMany(
      { razorpayOrderId: "" },
      { $unset: { razorpayOrderId: "" } }
    );

    console.log(
      `Removed empty razorpayOrderId from ${result.modifiedCount} order(s).`
    );

    const indexes = await orders.indexes();

    console.log("\nCurrent indexes:");
    indexes.forEach((index) => {
      console.log(index.name);
    });

    console.log("\nCleanup completed successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:");
    console.error(error);
    process.exit(1);
  }
}

cleanup();