require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Produce = require("./models/Produce");
const Order = require("./models/Order");
const User = require("./models/User");

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "farmconnect_secret_2026";

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
}


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "FarmConnect backend is running 🌱",
  });
});


// ===============================
// AUTH - SIGN UP
// ===============================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      location,
      role,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !location ||
      !role
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const allowedRoles = [
      "Farmer",
      "Consumer",
      "Retailer",
      "Admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      location,
      role,
      verificationStatus:
        role === "Consumer"
          ? "Verified"
          : "Pending",
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        role: user.role,
        verificationStatus:
          user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ===============================
// AUTH - LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        role: user.role,
        verificationStatus:
          user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ===============================
// AUTH - CURRENT USER
// ===============================

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.userId
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Get current user error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// PRODUCE - ADD PRODUCE
// ===============================

app.post(
  "/api/produce",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can add produce",
        });
      }

      const {
        name,
        quantity,
        price,
        location,
        latitude,
        longitude,
        harvestDate,
        farmingMethod,
        pesticide,
      } = req.body;

      if (
        !name ||
        quantity === undefined ||
        price === undefined ||
        !location ||
        !harvestDate
      ) {
        return res.status(400).json({
          message:
            "Name, quantity, price, location and harvest date are required",
        });
      }

      if (Number(quantity) < 0) {
        return res.status(400).json({
          message:
            "Quantity cannot be negative",
        });
      }

      if (Number(price) < 0) {
        return res.status(400).json({
          message:
            "Price cannot be negative",
        });
      }

      if (
        latitude !== null &&
        latitude !== undefined &&
        latitude !== "" &&
        (Number(latitude) < -90 ||
          Number(latitude) > 90)
      ) {
        return res.status(400).json({
          message: "Invalid latitude",
        });
      }

      if (
        longitude !== null &&
        longitude !== undefined &&
        longitude !== "" &&
        (Number(longitude) < -180 ||
          Number(longitude) > 180)
      ) {
        return res.status(400).json({
          message: "Invalid longitude",
        });
      }

      const produce = await Produce.create({
        farmerId: req.user.userId,
        name,
        quantity: Number(quantity),
        price: Number(price),
        location,
        latitude:
          latitude === "" ||
          latitude === undefined
            ? null
            : Number(latitude),
        longitude:
          longitude === "" ||
          longitude === undefined
            ? null
            : Number(longitude),
        harvestDate,
        farmingMethod:
          farmingMethod || "",
        pesticide:
          pesticide || "",
      });

      res.status(201).json({
        message:
          "Produce added successfully",
        produce,
      });
    } catch (error) {
      console.error("Add produce error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// PRODUCE - GET ALL
// ===============================

app.get(
  "/api/produce",
  async (req, res) => {
    try {
      const produce = await Produce.find()
        .populate(
          "farmerId",
          "name email location verificationStatus"
        )
        .sort({ createdAt: -1 });

      res.json(produce);
    } catch (error) {
      console.error("Get produce error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// PRODUCE - FARMER'S PRODUCE
// ===============================

app.get(
  "/api/produce/my",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can access this route",
        });
      }

      const produce = await Produce.find({
        farmerId: req.user.userId,
      }).sort({ createdAt: -1 });

      res.json(produce);
    } catch (error) {
      console.error(
        "Get farmer produce error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ORDERS - CREATE ORDER
// ===============================

app.post(
  "/api/orders",
  authenticateToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "Consumer" &&
        req.user.role !== "Retailer"
      ) {
        return res.status(403).json({
          message:
            "Only consumers and retailers can place orders",
        });
      }

      const {
        produceId,
        quantity,
      } = req.body;

      if (!produceId || !quantity) {
        return res.status(400).json({
          message:
            "Produce and quantity are required",
        });
      }

      const requestedQuantity =
        Number(quantity);

      if (
        !Number.isFinite(requestedQuantity) ||
        requestedQuantity <= 0
      ) {
        return res.status(400).json({
          message:
            "Quantity must be greater than 0",
        });
      }

      const produce =
        await Produce.findById(produceId);

      if (!produce) {
        return res.status(404).json({
          message: "Produce not found",
        });
      }

      if (
        produce.quantity <
        requestedQuantity
      ) {
        return res.status(400).json({
          message:
            "Not enough quantity available",
        });
      }

      const buyer =
        await User.findById(
          req.user.userId
        );

      if (!buyer) {
        return res.status(404).json({
          message: "Buyer not found",
        });
      }

      const totalPrice =
        requestedQuantity *
        produce.price;

      const order =
        await Order.create({
          produceId: produce._id,
          produceName: produce.name,
          farmerId: produce.farmerId,
          buyerId: buyer._id,
          buyerType: buyer.role,
          quantity:
            requestedQuantity,
          pricePerKg:
            produce.price,
          totalPrice,
          buyerName:
            buyer.name,
          buyerLocation:
            buyer.location,
          status: "Pending",
        });

      produce.quantity -=
        requestedQuantity;

      await produce.save();

      res.status(201).json({
        message:
          "Order placed successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ORDERS - FARMER ORDERS
// ===============================

app.get(
  "/api/orders",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can access this route",
        });
      }

      const orders =
        await Order.find({
          farmerId: req.user.userId,
        })
          .populate(
            "buyerId",
            "name email location role"
          )
          .populate(
            "produceId",
            "name price quantity"
          )
          .sort({ createdAt: -1 });

      res.json(orders);
    } catch (error) {
      console.error(
        "Get farmer orders error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ORDERS - BUYER ORDERS
// ===============================

app.get(
  "/api/orders/my",
  authenticateToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "Consumer" &&
        req.user.role !== "Retailer"
      ) {
        return res.status(403).json({
          message:
            "Only consumers and retailers can access this route",
        });
      }

      const orders =
        await Order.find({
          buyerId: req.user.userId,
        })
          .populate(
            "produceId",
            "name price location"
          )
          .populate(
            "farmerId",
            "name location"
          )
          .sort({ createdAt: -1 });

      res.json(orders);
    } catch (error) {
      console.error(
        "Get buyer orders error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ORDERS - FIND BY BUYER NAME
// ===============================

app.get(
  "/api/orders/buyer/:buyerName",
  authenticateToken,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          buyerName:
            req.params.buyerName,
        })
          .populate(
            "produceId",
            "name price location"
          )
          .populate(
            "farmerId",
            "name location"
          )
          .sort({ createdAt: -1 });

      res.json(orders);
    } catch (error) {
      console.error(
        "Get buyer orders error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ORDERS - UPDATE STATUS
// ===============================

app.patch(
  "/api/orders/:id/status",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Farmer") {
        return res.status(403).json({
          message:
            "Only farmers can update order status",
        });
      }

      const {
        status,
      } = req.body;

      const allowedStatuses = [
        "Pending",
        "Accepted",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Rejected",
      ];

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid order status",
        });
      }

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (
        order.farmerId.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          message:
            "You can only update your own orders",
        });
      }

      order.status = status;

      await order.save();

      res.json({
        message:
          "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ADMIN - GET ALL USERS
// ===============================

app.get(
  "/api/admin/users",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message:
            "Admin access required",
        });
      }

      const users =
        await User.find()
          .select("-password")
          .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      console.error(
        "Get admin users error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ADMIN - VERIFY USER
// ===============================

app.patch(
  "/api/admin/users/:id/verify",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message:
            "Admin access required",
        });
      }

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      user.verificationStatus =
        "Verified";

      await user.save();

      res.json({
        message:
          "User verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus:
            user.verificationStatus,
        },
      });
    } catch (error) {
      console.error(
        "Verify user error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// ADMIN - REJECT USER
// ===============================

app.patch(
  "/api/admin/users/:id/reject",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message:
            "Admin access required",
        });
      }

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      user.verificationStatus =
        "Rejected";

      await user.save();

      res.json({
        message:
          "User rejected successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus:
            user.verificationStatus,
        },
      });
    } catch (error) {
      console.error(
        "Reject user error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully 🌱"
    );

    app.listen(PORT, () => {
      console.log(
        `FarmConnect backend running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error
    );
  });